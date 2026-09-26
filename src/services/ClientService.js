import dbInstance from '../config/database.js';
import { ContractFactory } from '../utils/ContractFactory.js';

export class ClientService{

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

          const [customers] = await connection.execute(
            'SELECT id FROM customers WHERE id = ? AND active = 1',
            [customerId]
          );
          if (customers.length === 0) {
            throw new Error(`El cliente con ID ${customerId} no existe o está inactivo.`);
          }

          const [plans] = await connection.execute(
            'SELECT * FROM training_plans WHERE id = ? AND active = 1',
            [planId]
          );
          if (plans.length === 0) {
            throw new Error(`El plan de entrenamiento con ID ${planId} no existe o está inactivo.`);
          }
          const plan = plans[0];

          const contractData = ContractFactory.createContract({
            customerId: Number(customerId),
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

          return {
            success: true,
            contractId: contractResult.insertId,
            contractCode: contractData.contractCode
          };

        } catch (error) {
          await connection.rollback();
          throw new Error(`Error en la transacción de asignación: ${error.message}`);
        } finally {
          connection.release();
        }
    } 
}   
