import dayjs from 'dayjs';
import { ContractFactory } from '../utils/ContractFactory.js';

export class ContractService {
  constructor({ transactionManager, database }) {
    this.transactionManager = transactionManager;
    this.database = database;
  }

  async assignPlan(customerId, planId, conditions = null) {
    const cId = this.#toId(customerId, 'cliente');
    const pId = this.#toId(planId, 'plan');

    return this.transactionManager.run(async (connection) => {
    
      const [customers] = await connection.execute(
        'SELECT id FROM customers WHERE id = ? AND active = 1 FOR UPDATE', [cId]
      );
      if (customers.length === 0) throw new Error(`El cliente ID ${cId} no existe o está inactivo.`);

      const [plans] = await connection.execute(
        'SELECT id, name, duration_month, price, phisical_goals FROM training_plans WHERE id = ? AND active = 1',
        [pId]
      );
      if (plans.length === 0) throw new Error(`El plan ID ${pId} no existe o está inactivo.`);
      const plan = plans[0];

      const [existing] = await connection.execute(
        `SELECT id FROM contracts WHERE customer_id = ? AND plan_id = ? AND status = 'activo'`, [cId, pId]
      );
      if (existing.length > 0) {
        throw new Error(`El cliente ya tiene un contrato activo (ID ${existing[0].id}) con este plan.`);
      }

      const contract = ContractFactory.createContract({
        customerId: cId,
        planId: pId,
        durationMonths: plan.duration_month,
        price: plan.price,
        conditions: conditions || plan.phisical_goals
      });

      const [result] = await this.#insertContract(connection, contract);
      return this.#summary(result.insertId, contract);
    });
  }

  async renew(customerId, contractId) {
    const cId = this.#toId(customerId, 'cliente');
    const ctId = this.#toId(contractId, 'contrato');

    return this.transactionManager.run(async (connection) => {
      const [rows] = await connection.execute(
        `SELECT c.id, c.plan_id, c.conditions, c.end_date,
                p.duration_month AS plan_duration, p.price AS plan_price, p.active AS plan_active
           FROM contracts c
           JOIN training_plans p ON p.id = c.plan_id
          WHERE c.id = ? AND c.customer_id = ? AND c.status = 'activo'
          FOR UPDATE OF c`,
        [ctId, cId]
      );
      if (rows.length === 0) throw new Error('Contrato activo no encontrado para este cliente.');
      const current = rows[0];
      if (!current.plan_active) throw new Error('El plan de este contrato ya no está activo; no se puede renovar.');

      const previousEnd = dayjs(current.end_date);
      const start = previousEnd.isAfter(dayjs(), 'day') ? previousEnd : dayjs();

      const contract = ContractFactory.createContract({
        customerId: cId,
        planId: current.plan_id,
        durationMonths: current.plan_duration,
        price: current.plan_price,     
        conditions: current.conditions,
        startDate: start.format('YYYY-MM-DD')
      });

      await connection.execute(`UPDATE contracts SET status = 'renovado' WHERE id = ?`, [ctId]);
      const [result] = await this.#insertContract(connection, contract);
      return { ...this.#summary(result.insertId, contract), renewedContractId: ctId };
    });
  }

  async finish(customerId, contractId) {
    const cId = this.#toId(customerId, 'cliente');
    const ctId = this.#toId(contractId, 'contrato');

    return this.transactionManager.run(async (connection) => {
      await this.#lockActiveContract(connection, ctId, cId);
      await connection.execute(`UPDATE contracts SET status = 'completado' WHERE id = ?`, [ctId]);
      return { message: 'Contrato finalizado correctamente.' };
    });
  }

  async cancel(customerId, contractId) {
    const cId = this.#toId(customerId, 'cliente');
    const ctId = this.#toId(contractId, 'contrato');

    return this.transactionManager.run(async (connection) => {
      await this.#lockActiveContract(connection, ctId, cId);

      const [tracking] = await connection.execute(
        'DELETE FROM phisical_tracking WHERE contract_id = ?', [ctId]
      );

      const [nutrition] = await connection.execute(
        'UPDATE nutrition_plans SET active = 0 WHERE contract_id = ?', [ctId]
      );

      await connection.execute(`UPDATE contracts SET status = 'cancelado' WHERE id = ?`, [ctId]);

      return {
        message: 'Contrato cancelado. Seguimiento revertido y planes de alimentación desactivados.',
        trackingRemoved: tracking.affectedRows,
        nutritionPlansDeactivated: nutrition.affectedRows
      };
    });
  }

  async listByCustomer(customerId) {
    const cId = this.#toId(customerId, 'cliente');
    const pool = this.database.getPool();
    const [rows] = await pool.execute(
      `SELECT c.id, c.contract_code, p.name AS plan_name, c.price,
              c.start_date, c.end_date, c.status
         FROM contracts c
         JOIN training_plans p ON p.id = c.plan_id
        WHERE c.customer_id = ?
        ORDER BY c.start_date DESC, c.id DESC`,
      [cId]
    );
    return rows;
  }

  async #lockActiveContract(connection, contractId, customerId) {
    const [rows] = await connection.execute(
      `SELECT id FROM contracts WHERE id = ? AND customer_id = ? AND status = 'activo' FOR UPDATE`,
      [contractId, customerId]
    );
    if (rows.length === 0) throw new Error('Contrato activo no encontrado para este cliente.');
  }

  #insertContract(connection, contract) {
    return connection.execute(
      `INSERT INTO contracts
         (contract_code, customer_id, plan_id, conditions, duration_month, price, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contract.contractCode, contract.customerId, contract.planId, contract.conditions,
        contract.durationMonth, contract.price, contract.startDate, contract.endDate, contract.status
      ]
    );
  }

  #summary(contractId, contract) {
    return {
      success: true,
      contractId,
      contractCode: contract.contractCode,
      price: contract.price,
      startDate: contract.startDate,
      endDate: contract.endDate
    };
  }

  #toId(value, label) {
    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0) {
      throw new Error(`El ID de ${label} debe ser un entero positivo.`);
    }
    return num;
  }
}
