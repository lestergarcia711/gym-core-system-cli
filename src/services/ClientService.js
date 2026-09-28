import dbInstance from '../config/database.js';
import { ContractFactory } from '../utils/ContractFactory.js';

export class ClientService{

    static async createClient(customer) {
    const pool = dbInstance.getPool();
    const [result] = await pool.execute(
      `INSERT INTO customers (dpi, first_name, last_name, email, phone_number, active) VALUES (?, ?, ?, ?, ?, 1)`,
      [customer.dpi, customer.firstName, customer.lastName, customer.email, customer.phone]
    );
    return result.insertId;
  }

    static async listClients(){
        const pool = dbInstance.getPool();
        const [rows] = await pool.execute(
            'SELECT id, dpi, first_name, last_name, email, phone_number, active FROM customers WHERE active = 1'
        );
        return rows;
    }
    static async getClientById(id){
        const pool = dbInstance.getPool();
        const [rows ] = await pool.execute(
            `SELECT * FROM customers
             WHERE id = ? AND active = 1`,
            [id]
        );
        return rows[0] || null;
    }

    static async updateClient(id,customerData){
        const pool = dbInstance.getPool();
        const [result] = await pool.execute(
            `UPDATE customers
             SET dpi = ?, first_name = ?, last_name = ?, email = ?, phone_number = ?
             WHERE id = ? AND active = 1`,
             [
                customerData.dpi,
                customerData.firstName,
                customerData.lastName,
                customerData.email,
                customerData.phone,
                id
             ]
        );
        return result.affectedRows > 0;
        }
        static async deleteClient(id){
            const pool = dbInstance.getPool();

            const [ result ] = await pool.execute(
                'UPDATE customers SET active = 0 WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        }
        
    static async assignPlanToCustomer(customerId, planId) {
    const connection = await dbInstance.getConnection();
    try {
      await connection.beginTransaction();

      const [customers] = await connection.execute('SELECT id FROM customers WHERE id = ? AND active = 1', [customerId]);
      if (customers.length === 0) throw new Error(`El cliente ID ${customerId} no existe o está inactivo.`);

      const [plans] = await connection.execute('SELECT * FROM training_plans WHERE id = ? AND active = 1', [planId]);
      if (plans.length === 0) throw new Error(`El plan ID ${planId} no existe o está inactivo.`);
      const plan = plans[0];

      const contractData = ContractFactory.createContract({
        customerId,
        planId: plan.id,
        durationMonths: plan.duration_month,
        price: plan.price || 0,
        conditions: plan.phisical_goals
      });

      const [contractResult] = await connection.execute(
        `INSERT INTO contracts (contract_code, customer_id, plan_id, conditions, duration_month, price, start_date, end_date, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          contractData.contractCode,
          contractData.customerId,
          contractData.planId,
          contractData.conditions,
          contractData.durationMonth,
          contractData.price,
          contractData.startDate,
          contractData.endDate,
          contractData.status
        ]
      );

          await connection.commit();
          return { success: true, contractId: contractResult.insertId, contractCode: contractData.contractCode };
        } catch (error) {
          await connection.rollback();
          throw new Error(`Rollback ejecutado: ${error.message}`);
        } finally {
          connection.release();
        }
      }

   static async cancelCustomerPlan(customerId, contractId) {
    const connection = await dbInstance.getConnection();
    try {
      await connection.beginTransaction();

      const [contracts] = await connection.execute(
        'SELECT * FROM contracts WHERE id = ? AND customer_id = ? AND status = "activo"',
        [contractId, customerId]
      );
      if (contracts.length === 0) throw new Error('Contrato activo no encontrado para este cliente.');

      await connection.execute('UPDATE contracts SET status = "cancelado" WHERE id = ?', [contractId]);

      await connection.execute('UPDATE phisical_tracking SET comments = CONCAT(comments, " [cancelado]") WHERE contract_id = ?', [contractId]);

      await connection.commit();
      return { message: 'Plan cancelado y registros asociados actualizados en la transacción.' };
    } catch (error) {
      await connection.rollback();
      throw new Error(`Rollback en cancelación: ${error.message}`);
    } finally {
      connection.release();
    }
  }
    }