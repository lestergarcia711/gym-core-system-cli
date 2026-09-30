import dayjs from 'dayjs';
import { Contract } from '../models/Contract.js';
export class ContractFactory {
  static createContract({ customerId, planId, durationMonths, price, conditions, startDate = null }) {
    if (!customerId || !planId) {
      throw new Error('El cliente y el plan son obligatorios para crear un contrato.');
    }

    const months = Number.parseInt(durationMonths, 10);
    if (Number.isNaN(months) || months <= 0) {
      throw new Error('La duración del plan debe ser de al menos 1 mes.');
    }
    
    const start = startDate ? dayjs(startDate) : dayjs();
    if (!start.isValid()) {
      throw new Error('La fecha de inicio del contrato no es válida.');
    }

    return new Contract({
      contractCode: ContractFactory.generateCode(),
      customerId,
      planId,
      conditions: conditions && conditions.trim() ? conditions : 'Sin condiciones específicas',
      durationMonth: months,
      price,
      startDate: start.format('YYYY-MM-DD'),
      endDate: start.add(months, 'month').format('YYYY-MM-DD'),
      status: 'activo'
    });
  }

  static generateCode() {
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    return `CTR-${Date.now()}-${randomCode}`;
  }
}
