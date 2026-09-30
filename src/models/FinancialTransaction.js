import dayjs from 'dayjs';

const VALID_TYPES = ['ingreso', 'egreso'];

export class FinancialTransaction {
  constructor({
    id = null, customerId = null, contractId = null, type, category,
    amount, transactionDate = null, description = ''
  }) {
    this.id = id;
    this.type = this.validateType(type);
    this.customerId = this.validateOptionalId(customerId, 'Id de cliente');
    this.contractId = this.validateOptionalId(contractId, 'Id de contrato');

    if (this.type === 'ingreso' && (!this.customerId || !this.contractId)) {
      throw new Error('Un ingreso debe estar asociado a un cliente y a un contrato.');
    }

    this.category = this.validateRequired(category, 'Categoría', 100);
    this.amount = this.validateAmount(amount);
    this.transactionDate = this.validateDate(transactionDate);
    this.description = description ? String(description).trim() : '';
  }

  validateType(type) {
    if (!VALID_TYPES.includes(type)) {
      throw new Error(`El tipo debe ser uno de: ${VALID_TYPES.join(', ')}.`);
    }
    return type;
  }

  validateOptionalId(value, field) {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0) {
      throw new Error(`El campo ${field} debe ser un entero positivo.`);
    }
    return num;
  }

  validateAmount(amount) {
    const num = Number(amount);
    if (Number.isNaN(num) || num <= 0) {
      throw new Error('El monto financiero debe ser un número mayor a cero.');
    }
    return Math.round(num * 100) / 100;
  }

  validateRequired(value, field, maxLength) {
    if (!value || typeof value !== 'string' || value.trim() === '') {
      throw new Error(`El campo '${field}' es obligatorio.`);
    }
    if (value.trim().length > maxLength) {
      throw new Error(`El campo '${field}' no puede superar ${maxLength} caracteres.`);
    }
    return value.trim();
  }

  validateDate(value) {
    const date = value ? dayjs(value) : dayjs();
    
    if (!date.isValid() || (value && date.format('YYYY-MM-DD') !== String(value).trim())) {
      throw new Error('Fecha de transacción inválida. Formato esperado: YYYY-MM-DD.');
    }
    return date.format('YYYY-MM-DD');
  }
}