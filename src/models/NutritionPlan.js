export class NutritionPlan {
  constructor({ id = null, customerId, contractId, name, active = true }) {
    this.id = id;
    this.customerId = this.validateId(customerId, 'Id de cliente');
    this.contractId = this.validateId(contractId, 'Id de contrato');
    this.name = this.validateName(name);
    this.active = Boolean(active);
  }

  validateId(value, field) {
    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0) {
      throw new Error(`El campo ${field} debe ser un entero positivo.`);
    }
    return num;
  }

  validateName(name) {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('El nombre del plan de alimentación es obligatorio.');
    }
    if (name.trim().length > 100) {
      throw new Error('El nombre del plan de alimentación no puede superar 100 caracteres.');
    }
    return name.trim();
  }
}
