import dayjs from 'dayjs';

const VALID_STATUS = ['activo', 'renovado', 'cancelado', 'completado'];
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

export class Contract {
  constructor({
    id = null, contractCode, customerId, planId, conditions,
    durationMonth, price, startDate, endDate, status = 'activo'
  }) {
    this.id = id;
    this.contractCode = this.validateRequire(contractCode, 'Código de contrato', 60);
    this.customerId = this.validatePositiveInteger(customerId, 'Id de cliente');
    this.planId = this.validatePositiveInteger(planId, 'Id de plan');
    this.conditions = this.validateRequire(conditions, 'Condiciones');
    this.durationMonth = this.validatePositiveInteger(durationMonth, 'Duración en meses');
    this.price = this.validatePrice(price);
    this.startDate = this.validateDate(startDate, 'Fecha de inicio');
    this.endDate = this.validateDate(endDate, 'Fecha de fin');
    if (!dayjs(this.endDate).isAfter(dayjs(this.startDate))) {
      throw new Error('La fecha de fin debe ser posterior a la fecha de inicio.');
    }
    this.status = this.validateStatus(status);
  }

  validateRequire(value, field, maxLength = null) {
    if (!value || typeof value !== 'string' || value.trim() === '') {
      throw new Error(`El campo ${field} es obligatorio.`);
    }
    if (maxLength && value.trim().length > maxLength) {
      throw new Error(`El campo ${field} no puede superar ${maxLength} caracteres.`);
    }
    return value.trim();
  }

  validatePositiveInteger(value, field) {
    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0) {
      throw new Error(`El campo ${field} debe ser un entero positivo.`);
    }
    return num;
  }

  validatePrice(value) {
    const num = Number(value);
    if (Number.isNaN(num) || num < 0) {
      throw new Error('El precio debe ser un número mayor o igual a 0.');
    }
    return Math.round(num * 100) / 100;
  }

  validateDate(value, field) {
    if (typeof value !== 'string' || !DATE_FORMAT.test(value) || !dayjs(value).isValid()) {
      throw new Error(`${field} inválida. Formato esperado: YYYY-MM-DD.`);
    }
    return value;
  }

  validateStatus(status) {
    if (!VALID_STATUS.includes(status)) {
      throw new Error(`Estado de contrato inválido. Use: ${VALID_STATUS.join(', ')}.`);
    }
    return status;
  }
}
