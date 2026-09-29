import dbInstance from '../config/database.js';

export class TrackingService {
    static async addProgress(tracking){
        const pool = dbInstance.getPool();
        const [ result ] = await pool.execute(
            `INSERT INTO phisical_tracking
            (customer_id, contract_id, week_number, weight_kg, body_fat_percentage, photo_url, comments, measurements_json)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              tracking.customerId,
              tracking.contractId,
              tracking.weekNumber,
              tracking.weightKg,
              tracking.bodyFatPercentage,
              tracking.photoUrl,
              tracking.comments,
              tracking.measurementsJson
            ]
        );
        return result.insertId;
    }

    static async getHistoryByCustomer(customerId){
        const pool = dbInstance.getPool();
        const [ rows ] = await pool.execute(
            `SELECT id, contract_id, week_number, weight_kg, body_fat_percentage, comments, measurements_json, recorded_at
              FROM phisical_tracking WHERE customer_id = ? ORDER BY week_number ASC`,
             [customerId]
         );

         return rows;
    }
}