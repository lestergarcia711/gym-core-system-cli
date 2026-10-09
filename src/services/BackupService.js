import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';
import dayjs from 'dayjs';
import { BACKUPS_DIR } from '../config/paths.js';
import { splitSqlStatements } from '../utils/SqlScriptParser.js';

const BACKUP_MAGIC = '-- GYM-CORE-SYSTEM-BACKUP v1';
const INSERT_BATCH_SIZE = 500;


const ALLOWED_STATEMENT = /^(SET FOREIGN_KEY_CHECKS|SET NAMES|DROP TABLE IF EXISTS|CREATE TABLE|INSERT INTO)\b/i;
const TABLE_STATEMENT = /^(?:DROP TABLE IF EXISTS|CREATE TABLE|INSERT INTO)\s+`([^`]+)`/i;

const TEXT_TYPES = new Set(['DATE', 'DATETIME', 'TIMESTAMP', 'NEWDATE', 'JSON']);
const typeCast = (field, next) => (TEXT_TYPES.has(field.type) ? field.string() : next());

export class BackupService {
  constructor({ database, backupsDir = BACKUPS_DIR }) {
    this.database = database;
    this.backupsDir = backupsDir;
  }

  async createBackup({ prefix = 'backup' } = {}) {
    const connection = await this.database.getConnection();
    let dump;

    try {
      await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
      await connection.query('START TRANSACTION WITH CONSISTENT SNAPSHOT');
      dump = await this.#buildDump(connection);
      await connection.query('COMMIT');
    } catch (error) {
      try { await connection.query('ROLLBACK'); } catch { /* la conexión ya falló */ }
      throw error;
    } finally {
      connection.release();
    }

    await fs.mkdir(this.backupsDir, { recursive: true });
    const stamp = dayjs().format('YYYY-MM-DD_HH-mm-ss');
    const filePath = await this.#writeUnique(`${prefix}_${dump.database}_${stamp}`, '.sql', dump.content);

    return {
      fileName: path.basename(filePath),
      filePath,
      database: dump.database,
      tables: dump.tables,
      totalRows: dump.tables.reduce((sum, t) => sum + t.rows, 0),
      sizeBytes: Buffer.byteLength(dump.content, 'utf8')
    };
  }

  async restore(fileName) {
    const filePath = this.#resolveBackupPath(fileName);

    let script;
    try {
      script = await fs.readFile(filePath, 'utf8');
    } catch {
      throw new Error(`No se pudo leer el respaldo "${path.basename(filePath)}".`);
    }
    const statements = BackupService.parseBackup(script);
    const tables = statements.filter(s => /^DROP TABLE/i.test(s)).length;

    const safety = await this.createBackup({ prefix: 'pre-restore' });

    try {
      await this.#execute(statements);
    } catch (error) {
      let reverted = false;
      try {
        const safetyScript = await fs.readFile(safety.filePath, 'utf8');
        await this.#execute(BackupService.parseBackup(safetyScript));
        reverted = true;
      } catch { /* se informa abajo */ }

      throw new Error(
        `${error.message}. ` + (reverted
          ? 'La base de datos fue revertida a su estado anterior.'
          : `No se pudo revertir automáticamente; restaure manualmente el respaldo "${safety.fileName}".`)
      );
    }

    return { restoredFrom: path.basename(filePath), tables, safetyBackup: safety.fileName };
  }

  async listBackups() {
    let entries;
    try {
      entries = await fs.readdir(this.backupsDir);
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }

    const backups = [];
    for (const name of entries.filter(n => n.toLowerCase().endsWith('.sql'))) {
      const filePath = path.join(this.backupsDir, name);
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) continue;
      backups.push({
        fileName: name,
        filePath,
        sizeBytes: stats.size,
        createdAt: stats.mtime,
        isSafetyCopy: name.startsWith('pre-restore_')
      });
    }
    return backups.sort((a, b) => b.createdAt - a.createdAt);
  }

  static parseBackup(script) {
    const text = script.replace(/^\uFEFF/, '');
    if (!text.startsWith(BACKUP_MAGIC)) {
      throw new Error('El archivo no es un respaldo válido generado por este sistema.');
    }

    const statements = splitSqlStatements(text);
    for (const statement of statements) {
      if (!ALLOWED_STATEMENT.test(statement)) {
        throw new Error(`El respaldo contiene una sentencia no permitida: "${statement.slice(0, 50)}..."`);
      }
      if (!/^SET /i.test(statement) && !TABLE_STATEMENT.test(statement)) {
        throw new Error(`El respaldo contiene una sentencia con formato inesperado: "${statement.slice(0, 50)}..."`);
      }
    }
    if (!statements.some(s => /^CREATE TABLE/i.test(s))) {
      throw new Error('El respaldo no contiene ninguna tabla.');
    }
    return statements;
  }

  async #buildDump(connection) {
    const [[{ db }]] = await connection.query('SELECT DATABASE() AS db');
    if (!db) throw new Error('No hay una base de datos seleccionada (revise DB_NAME en el archivo .env).');

    const [tableRows] = await connection.query(
      `SELECT TABLE_NAME AS table_name
         FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME`
    );
    if (tableRows.length === 0) throw new Error('La base de datos no tiene tablas para respaldar.');

    const lines = [
      BACKUP_MAGIC,
      '-- Respaldo de la base de datos del Gym Core System',
      `-- Base de datos: ${db}`,
      `-- Generado: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
      '-- Para restaurar use la opción "Restaurar base de datos" del menú del sistema.',
      '',
      'SET NAMES utf8mb4;',
      'SET FOREIGN_KEY_CHECKS=0;',
      ''
    ];
    const tables = [];

    for (const { table_name: table } of tableRows) {
      const [[createRow]] = await connection.query('SHOW CREATE TABLE ??', [table]);
      const [rows] = await connection.query({ sql: 'SELECT * FROM ??', values: [table], typeCast });

      lines.push(
        '-- ----------------------------------------',
        `-- Tabla: ${table} (${rows.length} filas)`,
        '-- ----------------------------------------',
        `DROP TABLE IF EXISTS ${mysql.escapeId(table)};`,
        `${createRow['Create Table']};`
      );
      if (rows.length > 0) {
        const columns = Object.keys(rows[0]).map(c => mysql.escapeId(c)).join(', ');
        for (let i = 0; i < rows.length; i += INSERT_BATCH_SIZE) {
          const values = rows
            .slice(i, i + INSERT_BATCH_SIZE)
            .map(row => `(${Object.values(row).map(BackupService.#toLiteral).join(', ')})`)
            .join(',\n');
          lines.push(`INSERT INTO ${mysql.escapeId(table)} (${columns}) VALUES\n${values};`);
        }
      }
      lines.push('');
      tables.push({ name: table, rows: rows.length });
    }

    lines.push('SET FOREIGN_KEY_CHECKS=1;', '');
    return { database: db, tables, content: lines.join('\n') };
  }

  static #toLiteral(value) {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'number' || typeof value === 'bigint') return String(value);
    if (typeof value === 'boolean') return value ? '1' : '0';
    if (Buffer.isBuffer(value)) return value.length ? `X'${value.toString('hex')}'` : "''";
    return mysql.escape(String(value));
  }

  async #execute(statements) {
    const connection = await this.database.getConnection();
    try {
      for (const statement of statements) {
        await connection.query(statement);
      }
    } finally {
      try { await connection.query('SET FOREIGN_KEY_CHECKS=1'); } catch { /* conexión caída */ }
      connection.release();
    }
  }

  #resolveBackupPath(fileName) {
    const base = path.basename(String(fileName ?? ''));
    if (!base.toLowerCase().endsWith('.sql')) {
      throw new Error('El respaldo debe ser un archivo .sql de la carpeta exports/backups.');
    }
    return path.join(this.backupsDir, base);
  }

  async #writeUnique(baseName, extension, content) {
    for (let attempt = 0; attempt < 100; attempt++) {
      const suffix = attempt === 0 ? '' : `_${attempt}`;
      const target = path.join(this.backupsDir, `${baseName}${suffix}${extension}`);
      try {
        await fs.access(target);
      } catch {
        const temp = `${target}.tmp`;
        await fs.writeFile(temp, content, 'utf8');
        await fs.rename(temp, target);
        return target;
      }
    }
    throw new Error('No se pudo generar un nombre de archivo único para el respaldo.');
  }
}