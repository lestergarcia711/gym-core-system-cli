import dayjs from 'dayjs';
import { FinancialTransaction } from '../models/FinancialTransaction.js';

export const PAYMENT_CATEGORY = 'Mensualidad';
export const SESSION_CATEGORY = 'Sesión individual'; 
const INCOME_CATEGORIES = [PAYMENT_CATEGORY, SESSION_CATEGORY];

const toCents = (value) => Math.round(Number(value) * 100);
const fromCents = (cents) => cents / 100;

export class FinanceService {
  constructor({ transactionManager, database }) {
    this.transactionManager = transactionManager;
    this.database = database;
  }

  async registerPayment(customerId, contractId, { amount, category = PAYMENT_CATEGORY, description = '', date = null }) {
    if (!INCOME_CATEGORIES.includes(category)) {
      throw new Error(`Categoría de ingreso inválida. Use: ${INCOME_CATEGORIES.join(' o ')}.`);
    }

    const payment = new FinancialTransaction({
      type: 'ingreso', customerId, contractId, category, amount, transactionDate: date, description
    });

    return this.transactionManager.run(async (connection) => {
     
      const [contracts] = await connection.execute(
        `SELECT id, price FROM contracts
          WHERE id = ? AND customer_id = ? AND status = 'activo' FOR UPDATE`,
        [payment.contractId, payment.customerId]
      );
      if (contracts.length === 0) {
        throw new Error('Contrato activo no encontrado para este cliente.');
      }

      let pendingAfterCents = null;
      if (category === PAYMENT_CATEGORY) {

        const [paidRows] = await connection.execute(
          `SELECT COALESCE(SUM(amount), 0) AS paid FROM financial_ledger
            WHERE contract_id = ? AND type = 'ingreso' AND category = ?`,
          [payment.contractId, PAYMENT_CATEGORY]
        );
        const pendingCents = toCents(contracts[0].price) - toCents(paidRows[0].paid);
        if (pendingCents <= 0) {
          throw new Error('Este contrato ya está pagado en su totalidad.');
        }
        if (toCents(payment.amount) > pendingCents) {
          throw new Error(
            `El pago (Q${payment.amount.toFixed(2)}) excede el saldo pendiente (Q${fromCents(pendingCents).toFixed(2)}).`
          );
        }
        pendingAfterCents = pendingCents - toCents(payment.amount);
      }

      const [result] = await connection.execute(
        `INSERT INTO financial_ledger
           (customer_id, contract_id, type, category, amount, transaction_date, description)
         VALUES (?, ?, 'ingreso', ?, ?, ?, ?)`,
        [payment.customerId, payment.contractId, payment.category, payment.amount,
         payment.transactionDate, payment.description]
      );

      return {
        transactionId: result.insertId,
        amount: payment.amount,
        pendingAfter: pendingAfterCents === null ? null : fromCents(pendingAfterCents),
        paidInFull: pendingAfterCents === 0
      };
    });
  }

  async registerExpense({ category, amount, description = '', date = null, customerId = null }) {
    const expense = new FinancialTransaction({
      type: 'egreso', customerId, category, amount, transactionDate: date, description
    });

    const pool = this.database.getPool();
    try {
      const [result] = await pool.execute(
        `INSERT INTO financial_ledger
           (customer_id, contract_id, type, category, amount, transaction_date, description)
         VALUES (?, NULL, 'egreso', ?, ?, ?, ?)`,
        [expense.customerId, expense.category, expense.amount, expense.transactionDate, expense.description]
      );
      return { transactionId: result.insertId, amount: expense.amount };
    } catch (error) {
      if (error.code === 'ER_NO_REFERENCED_ROW_2') throw new Error('El cliente indicado no existe.');
      throw error;
    }
  }

  async getBalance({ from = null, to = null, customerId = null } = {}) {
    const { where, params } = this.#buildFilters({ from, to, customerId });
    const pool = this.database.getPool();

    const [totals] = await pool.execute(
      `SELECT COALESCE(SUM(CASE WHEN type = 'ingreso' THEN amount END), 0) AS income,
              COALESCE(SUM(CASE WHEN type = 'egreso'  THEN amount END), 0) AS expense
         FROM financial_ledger ${where}`,
      params
    );
    const [breakdown] = await pool.execute(
      `SELECT type, category, COUNT(*) AS movements, SUM(amount) AS total
         FROM financial_ledger ${where}
        GROUP BY type, category
        ORDER BY type, total DESC`,
      params
    );

    const incomeCents = toCents(totals[0].income);
    const expenseCents = toCents(totals[0].expense);
    return {
      income: fromCents(incomeCents),
      expense: fromCents(expenseCents),
      balance: fromCents(incomeCents - expenseCents),
      breakdown: breakdown.map(r => ({
        type: r.type, category: r.category, movements: Number(r.movements), total: Number(r.total)
      }))
    };
  }

  async listTransactions({ from = null, to = null, customerId = null, limit = 50 } = {}) {
    const { where, params } = this.#buildFilters({ from, to, customerId });

    const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 50, 1), 500);
    const pool = this.database.getPool();
    const [rows] = await pool.execute(
      `SELECT id, transaction_date, type, category, amount, customer_id, contract_id, description
         FROM financial_ledger ${where}
        ORDER BY transaction_date DESC, id DESC
        LIMIT ${safeLimit}`,
      params
    );
    return rows.map(r => ({ ...r, amount: Number(r.amount) }));
  }

  async getCustomerContractsStatus(customerId) {
    const id = this.#toId(customerId, 'cliente');
    const pool = this.database.getPool();
    const [rows] = await pool.execute(
      `SELECT c.id, c.contract_code, p.name AS plan_name, c.price, c.status,
              COALESCE(SUM(l.amount), 0) AS paid
         FROM contracts c
         JOIN training_plans p ON p.id = c.plan_id
         LEFT JOIN financial_ledger l
                ON l.contract_id = c.id AND l.type = 'ingreso' AND l.category = ?
        WHERE c.customer_id = ?
        GROUP BY c.id, c.contract_code, p.name, c.price, c.status
        ORDER BY c.id DESC`,
      [PAYMENT_CATEGORY, id]
    );
    return rows.map(r => {
      const pendingCents = toCents(r.price) - toCents(r.paid);
      return {
        id: r.id, contractCode: r.contract_code, planName: r.plan_name, status: r.status,
        price: Number(r.price), paid: Number(r.paid), pending: fromCents(Math.max(pendingCents, 0))
      };
    });
  }

  #buildFilters({ from, to, customerId }) {
    const conditions = [];
    const params = [];

    const fromDate = this.#normalizeDate(from, 'Fecha inicial');
    const toDate = this.#normalizeDate(to, 'Fecha final');
    if (fromDate && toDate && dayjs(fromDate).isAfter(dayjs(toDate))) {
      throw new Error('La fecha inicial no puede ser posterior a la fecha final.');
    }
    if (fromDate) { conditions.push('transaction_date >= ?'); params.push(fromDate); }
    if (toDate) { conditions.push('transaction_date <= ?'); params.push(toDate); }
    if (customerId !== null && customerId !== undefined && String(customerId).trim() !== '') {
      conditions.push('customer_id = ?');
      params.push(this.#toId(customerId, 'cliente'));
    }
    return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
  }

  #normalizeDate(value, label) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const text = String(value).trim();
    const parsed = dayjs(text);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !parsed.isValid() || parsed.format('YYYY-MM-DD') !== text) {
      throw new Error(`${label} inválida. Formato esperado: YYYY-MM-DD.`);
    }
    return text;
  }

  #toId(value, label) {
    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0) {
      throw new Error(`El ID de ${label} debe ser un entero positivo.`);
    }
    return num;
  }
}
