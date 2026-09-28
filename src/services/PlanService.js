import dbInstance from '../config/database.js';
import { TrainingPlan } from '../models/TrainingPlan.js';

export class PlanService {
    static async createPlan(planData) {
        
        const plan = new TrainingPlan(planData);
        
        const pool = dbInstance.getPool();
        const [result] = await pool.execute(
            `INSERT INTO training_plans (name, duration_month, phisical_goals, level, active) 
             VALUES (?, ?, ?, ?, ?)`,
            [plan.name, plan.durationMonth, plan.phisicalGoals, plan.level, plan.active ? 1 : 0]
        );
        
        return result.insertId;
    }

    static async listActivePlans() {
        const pool = dbInstance.getPool();
        const [rows] = await pool.execute(
            `SELECT id, name, duration_month AS durationMonth, phisical_goals AS phisicalGoals, level, active, created_at AS createdAt 
             FROM training_plans 
             WHERE active = 1`
        );
        return rows.map(row => new TrainingPlan(row));
    }

    static async getPlanById(id) {
        const pool = dbInstance.getPool();
        const [rows] = await pool.execute(
            `SELECT id, name, duration_month AS durationMonth, phisical_goals AS phisicalGoals, level, active, created_at AS createdAt 
             FROM training_plans 
             WHERE id = ? AND active = 1`,
            [id]
        );
        if (rows.length === 0) return null;
        return new TrainingPlan(rows[0]);
    }

    static async updatePlan(id, planData) {
        const plan = new TrainingPlan({ ...planData, id });
        const pool = dbInstance.getPool();
        const [result] = await pool.execute(
            `UPDATE training_plans 
             SET name = ?, duration_month = ?, phisical_goals = ?, level = ? 
             WHERE id = ?`,
            [plan.name, plan.durationMonth, plan.phisicalGoals, plan.level, id]
        );
        return result.affectedRows > 0;
    }

    static async deletePlan(id) {
        const pool = dbInstance.getPool();

        const [activeContracts] = await pool.execute(
           `SELECT COUNT(*) as total FROM contracts WHERE plan_id = ? AND status= 'activo'`,
           [id]
        );

        if(activeContracts[0].total > 0) {
            
           throw new Error('PLAN_ASIGNADO');
        }
        const [result] = await pool.execute(
            `UPDATE training_plans SET active = 0 WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    }
}