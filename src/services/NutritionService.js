import { NutritionPlan } from '../models/NutritionPlan.js';
import { NutritionItem, DAYS, MEAL_TYPES } from '../models/NutritionItem.js';

export class NutritionService {
  constructor({ transactionManager, database }) {
    this.transactionManager = transactionManager;
    this.database = database;
  }

  async createPlan(customerId, contractId, name) {
    const plan = new NutritionPlan({ customerId, contractId, name });

    return this.transactionManager.run(async (connection) => {
      // Bloquear el contrato serializa creaciones simultáneas para el mismo contrato.
      const [contracts] = await connection.execute(
        `SELECT id FROM contracts WHERE id = ? AND customer_id = ? AND status = 'activo' FOR UPDATE`,
        [plan.contractId, plan.customerId]
      );
      if (contracts.length === 0) {
        throw new Error('Contrato activo no encontrado para este cliente.');
      }

      const [existing] = await connection.execute(
        'SELECT id FROM nutrition_plans WHERE contract_id = ? AND active = 1',
        [plan.contractId]
      );
      if (existing.length > 0) {
        throw new Error(`El contrato ya tiene un plan de alimentación activo (ID ${existing[0].id}).`);
      }

      const [result] = await connection.execute(
        'INSERT INTO nutrition_plans (customer_id, contract_id, name, active) VALUES (?, ?, ?, 1)',
        [plan.customerId, plan.contractId, plan.name]
      );
      return { planId: result.insertId };
    });
  }

  async addItem(planId, { dayOfWeek, mealType, foodDescription, estimatedCalories }) {
    const item = new NutritionItem({
      nutritionPlanId: planId, dayOfWeek, mealType, foodDescription, estimatedCalories
    });

    return this.transactionManager.run(async (connection) => {
      const [plans] = await connection.execute(
        `SELECT np.id
           FROM nutrition_plans np
           JOIN contracts c ON c.id = np.contract_id
          WHERE np.id = ? AND np.active = 1 AND c.status = 'activo'
          FOR UPDATE OF np`,
        [item.nutritionPlanId]
      );
      if (plans.length === 0) {
        throw new Error('El plan de alimentación no existe, está inactivo o su contrato ya no está vigente.');
      }

      const [result] = await connection.execute(
        `INSERT INTO nutrition_items
           (nutrition_plan_id, day_of_week, meal_type, food_description, estimated_calories)
         VALUES (?, ?, ?, ?, ?)`,
        [item.nutritionPlanId, item.dayOfWeek, item.mealType, item.foodDescription, item.estimatedCalories]
      );
      return { itemId: result.insertId };
    });
  }

  async removeItem(itemId) {
    const id = this.#toId(itemId, 'alimento');
    const pool = this.database.getPool();
    const [result] = await pool.execute(
      `DELETE ni FROM nutrition_items ni
         JOIN nutrition_plans np ON np.id = ni.nutrition_plan_id
        WHERE ni.id = ? AND np.active = 1`,
      [id]
    );
    return result.affectedRows > 0;
  }

  async listPlansByCustomer(customerId) {
    const id = this.#toId(customerId, 'cliente');
    const pool = this.database.getPool();
    const [rows] = await pool.execute(
      `SELECT np.id, np.name, np.active, np.contract_id, c.contract_code,
              tp.name AS training_plan_name,
              COUNT(ni.id) AS items,
              COALESCE(SUM(ni.estimated_calories), 0) AS total_calories
         FROM nutrition_plans np
         JOIN contracts c ON c.id = np.contract_id
         JOIN training_plans tp ON tp.id = c.plan_id
         LEFT JOIN nutrition_items ni ON ni.nutrition_plan_id = np.id
        WHERE np.customer_id = ?
        GROUP BY np.id, np.name, np.active, np.contract_id, c.contract_code, tp.name
        ORDER BY np.id DESC`,
      [id]
    );
    return rows.map(r => ({
      id: r.id, name: r.name, active: Boolean(r.active), contractId: r.contract_id,
      contractCode: r.contract_code, trainingPlanName: r.training_plan_name,
      items: Number(r.items), totalCalories: Number(r.total_calories)
    }));
  }

  async getWeeklyReport(planId) {
    const id = this.#toId(planId, 'plan de alimentación');
    const pool = this.database.getPool();

    const [headers] = await pool.execute(
      `SELECT np.id, np.name, np.active, cu.first_name, cu.last_name, tp.name AS training_plan_name
         FROM nutrition_plans np
         JOIN customers cu ON cu.id = np.customer_id
         JOIN contracts c ON c.id = np.contract_id
         JOIN training_plans tp ON tp.id = c.plan_id
        WHERE np.id = ?`,
      [id]
    );
    if (headers.length === 0) throw new Error('Plan de alimentación no encontrado.');
    const h = headers[0];

    const [items] = await pool.execute(
      `SELECT id, day_of_week, meal_type, food_description, estimated_calories
         FROM nutrition_items WHERE nutrition_plan_id = ?`,
      [id]
    );

    return {
      plan: {
        id: h.id, name: h.name, active: Boolean(h.active),
        customerName: `${h.first_name} ${h.last_name}`, trainingPlanName: h.training_plan_name
      },
      ...NutritionService.buildReport(items)
    };
  }

  static buildReport(items) {
    const days = DAYS.map(day => {
      const dayItems = items.filter(i => i.day_of_week === day);
      const meals = MEAL_TYPES
        .map(mealType => {
          const mealItems = dayItems
            .filter(i => i.meal_type === mealType)
            .map(i => ({
              id: i.id, food: i.food_description, calories: Number(i.estimated_calories)
            }));
          return { mealType, items: mealItems, calories: mealItems.reduce((s, i) => s + i.calories, 0) };
        })
        .filter(m => m.items.length > 0);
      return {
        day, meals,
        itemCount: dayItems.length,
        calories: meals.reduce((s, m) => s + m.calories, 0)
      };
    });

    const totalCalories = days.reduce((s, d) => s + d.calories, 0);
    const daysWithData = days.filter(d => d.itemCount > 0);
    const peak = daysWithData.reduce((best, d) => (!best || d.calories > best.calories ? d : best), null);

    return {
      days,
      totalCalories,
      daysWithData: daysWithData.length,
      averagePerDay: daysWithData.length ? Math.round(totalCalories / daysWithData.length) : 0,
      peakDay: peak ? { day: peak.day, calories: peak.calories } : null
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
