export class ContractFactory {
  static createContract({ customerId, planId, durationMonths, price, conditions }) {
    
    if (!customerId || !planId) {
      throw new Error('El cliente y el plan son obligatorios para crear un contrato.');
    }

    const months = parseInt(durationMonths, 10);
    if (isNaN(months) || months <= 0) {
      throw new Error('La duración del plan debe ser de al menos 1 mes.');
    }

    const now = new Date();
    const startDate = now.toISOString().split('T')[0];

    const endDateObj = new Date(now);
    endDateObj.setMonth(endDateObj.getMonth() + months);
    const endDate = endDateObj.toISOString().split('T')[0];

    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const contractCode = `CTR-${Date.now()}-${randomCode}`;

    return {
      contractCode,
      customerId: Number(customerId),
      planId: Number(planId),
      conditions: conditions || 'Sin condiciones específicas',
      durationMonth: months,
      price: parseFloat(price) || 0,
      startDate,
      endDate,
      status: 'activo'
    };
  }
}