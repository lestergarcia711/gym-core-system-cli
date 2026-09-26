import dbInstance from '../config/database.js';

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

}