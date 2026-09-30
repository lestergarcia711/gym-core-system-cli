export const DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
export const DAY_LABELS = { Miercoles: 'Miércoles', Sabado: 'Sábado' };
export const MEAL_TYPES = ['desayuno', 'almuerzo', 'cena', 'snack'];

const MAX_CALORIES_PER_ITEM = 5000;
const stripAccents = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export class NutritionItem {
  constructor({ id = null, nutritionPlanId, dayOfWeek, mealType, foodDescription, estimatedCalories }) {
    this.id = id;
    this.nutritionPlanId = this.validatePlanId(nutritionPlanId);
    this.dayOfWeek = this.validateDay(dayOfWeek);
    this.mealType = this.validateMealType(mealType);
    this.foodDescription = this.validateFood(foodDescription);
    this.estimatedCalories = this.validateCalories(estimatedCalories);
  }

  validatePlanId(value) {
    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0) {
      throw new Error('El Id del plan de alimentación debe ser un entero positivo.');
    }
    return num;
  }

  // Acepta "miércoles", "MIERCOLES", etc. y devuelve el valor canónico del ENUM.
  validateDay(day) {
    const clean = day ? stripAccents(String(day)).trim().toLowerCase() : '';
    const found = DAYS.find(d => d.toLowerCase() === clean);
    if (!found) throw new Error(`Día inválido. Use: ${DAYS.join(', ')}.`);
    return found;
  }

  validateMealType(mealType) {
    const clean = mealType ? String(mealType).trim().toLowerCase() : '';
    if (!MEAL_TYPES.includes(clean)) {
      throw new Error(`Tipo de comida inválido. Use: ${MEAL_TYPES.join(', ')}.`);
    }
    return clean;
  }

  validateFood(food) {
    if (!food || typeof food !== 'string' || food.trim() === '') {
      throw new Error('La descripción del alimento es obligatoria.');
    }
    if (food.trim().length > 255) {
      throw new Error('La descripción del alimento no puede superar 255 caracteres.');
    }
    return food.trim();
  }

  validateCalories(value) {
    const num = Number(value);
    if (value === null || value === undefined || value === '' || !Number.isInteger(num) || num < 0 || num > MAX_CALORIES_PER_ITEM) {
      throw new Error(`Las calorías deben ser un entero entre 0 y ${MAX_CALORIES_PER_ITEM}.`);
    }
    return num;
  }
}
