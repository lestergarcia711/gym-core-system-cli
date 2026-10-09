import { input, select, Separator } from '@inquirer/prompts';
import chalk from 'chalk';
import dayjs from 'dayjs';
import {
  backupService as defaultBackupService
} from '../config/container.js';

const RESTORE_CONFIRMATION_WORD = 'RESTAURAR';

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export class DataManagementCommand {
  constructor(backupService = defaultBackupService) {
    this.backupService = backupService;
  }

  async execute() {
    let inMenu = true;

    while (inMenu) {
      console.log(chalk.bold.blue('\n=====  RESPALDO Y EXPORTACIÓN DE DATOS  ====='));
      console.log(chalk.bold.blue('=============================================='));

      const action = await select({
        message: 'Seleccione una opción:',
        loop: false,
        choices: [
          new Separator(),
          { name: '1. Crear Respaldo de la Base de Datos', value: 'BACKUP' },
          { name: '2. Restaurar Base de Datos desde un Respaldo', value: 'RESTORE' },
          { name: '3. Ver Respaldos Disponibles', value: 'LIST' },
          new Separator(),
          { name: '0. Volver al Menú Principal', value: 'BACK' }
        ]
      });

      switch (action) {
        case 'BACKUP': await this.createBackup(); break;
        case 'RESTORE': await this.restoreBackup(); break;
        case 'LIST': await this.listBackups(); break;
        case 'BACK': inMenu = false; break;
      }
    }
  }

  async createBackup() {
    console.log(chalk.cyan.bold('\n[+] Crear Respaldo de la Base de Datos'));
    try {
      console.log(chalk.gray('Generando respaldo, por favor espere...'));
      const backup = await this.backupService.createBackup();

      console.log(chalk.green.bold('\n Respaldo creado exitosamente.'));
      console.log(`   Archivo:  ${backup.filePath}`);
      console.log(`   Tamaño:   ${formatSize(backup.sizeBytes)}`);
      console.log(`   Tablas:   ${backup.tables.length} | Registros: ${backup.totalRows}`);
      console.table(backup.tables.map(t => ({ Tabla: t.name, Registros: t.rows })));
    } catch (error) {
      console.log(chalk.red.bold(`\n Error al crear el respaldo: ${error.message}`));
    }
  }

  async listBackups() {
    console.log(chalk.cyan.bold('\n Respaldos Disponibles'));
    try {
      const backups = await this.backupService.listBackups();
      if (backups.length === 0) {
        console.log(chalk.yellow('Aún no hay respaldos en la carpeta exports/backups.'));
        return;
      }
      console.table(backups.map((b, i) => ({
        '#': i + 1,
        Archivo: b.fileName,
        Tipo: b.isSafetyCopy ? 'Seguridad (pre-restauración)' : 'Manual',
        Fecha: dayjs(b.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        Tamaño: formatSize(b.sizeBytes)
      })));
    } catch (error) {
      console.log(chalk.red.bold(`\n Error al listar los respaldos: ${error.message}`));
    }
  }

  async restoreBackup() {
    console.log(chalk.cyan.bold('\n[+] Restaurar Base de Datos'));
    try {
      const backups = await this.backupService.listBackups();
      if (backups.length === 0) {
        console.log(chalk.yellow('No hay respaldos disponibles en la carpeta exports/backups.'));
        return;
      }

      const fileName = await select({
        message: 'Seleccione el respaldo a restaurar:',
        choices: [
          ...backups.map(b => ({
            name: `${b.fileName}  |  ${dayjs(b.createdAt).format('YYYY-MM-DD HH:mm')}  |  ${formatSize(b.sizeBytes)}${b.isSafetyCopy ? '  | seguridad' : ''}`,
            value: b.fileName
          })),
          new Separator(),
          { name: '0. Cancelar', value: null }
        ]
      });
      if (!fileName) {
        console.log(chalk.gray('Operación cancelada.'));
        return;
      }

      console.log(chalk.yellow.bold('\n ATENCIÓN: se reemplazarán TODOS los datos actuales de las tablas por los del respaldo.'));
      console.log(chalk.yellow(' Antes de restaurar se guardará automáticamente un respaldo del estado actual.'));
      const answer = await input({ message: `Escriba ${RESTORE_CONFIRMATION_WORD} para confirmar (Enter para cancelar):` });
      if (answer.trim() !== RESTORE_CONFIRMATION_WORD) {
        console.log(chalk.gray('Operación cancelada. No se modificó la base de datos.'));
        return;
      }

      console.log(chalk.gray('\nRestaurando, por favor espere...'));
      const result = await this.backupService.restore(fileName);
      console.log(chalk.green.bold('\n Base de datos restaurada exitosamente.'));
      console.log(`   Restaurado desde:     ${result.restoredFrom}`);
      console.log(`   Tablas restauradas:   ${result.tables}`);
      console.log(`   Respaldo de seguridad del estado anterior: ${result.safetyBackup}`);
    } catch (error) {
      console.log(chalk.red.bold(`\n Error al restaurar: ${error.message}`));
    }
  }
}