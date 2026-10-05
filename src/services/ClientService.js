import dbInstance from '../config/database.js';

export class ClientService{

    static async createClient(customer) {
        const pool = dbInstance.getPool();
        try {
            const [result] = await pool.execute(
                `INSERT INTO customers (dpi, first_name, last_name, email, phone_number, active) VALUES (?, ?, ?, ?, ?, 1)`,
                [customer.dpi, customer.firstName, customer.lastName, customer.email, customer.phone]
            );
            return result.insertId;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un cliente con ese DPI o correo electrónico.');
            }
            throw error;
        }
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

            const [active] = await pool.execute(
                `SELECT COUNT(*) AS total FROM contracts WHERE customer_id = ? AND status = 'activo'`,
                [id]
            );
            if (active[0].total > 0) {
                throw new Error('El cliente tiene contratos activos. Cancélelos o finalícelos antes de desactivarlo.');
            }

            const [ result ] = await pool.execute(
                'UPDATE customers SET active = 0 WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        }

    
        static async exportClientData(id) {
            const pool = dbInstance.getPool();
            
          
            const [customers] = await pool.execute(
                `SELECT id, dpi, first_name, last_name, email, phone_number, active, created_at 
                 FROM customers 
                 WHERE id = ? OR dpi = ? OR CONCAT(first_name, ' ', last_name) LIKE ?`,
                [id, id, `%${id}%`]
            );
    
            if (customers.length === 0) {
                throw new Error(`No se encontró ningún cliente que coincida con: "${id}"`);
            }
            
            const client = customers[0];
            const customerId = client.id;
    
            const [physicalTracking] = await pool.execute(
                `SELECT id, contract_id, week_number, weight_kg, body_fat_percentage, 
                        measurements_json, photo_url, comments, recorded_at 
                 FROM phisical_tracking 
                 WHERE customer_id = ? 
                 ORDER BY recorded_at DESC`,
                [customerId]
            );
        }
}
