
export class ContractFactory {
  /**

   * @param {Object} params
   * @param {number} params.customerId
   * @param {number} params.planId
   * @param {number} params.durationMonths
   * @param {number} [params.price=0]
   * @param {string} [params.conditions='']
   */
  static createContract({ customerId, planId, durationMonths, price = 0, conditions = '' }) {
    if (!customerId || !planId || !durationMonths) {
      throw new Error('Datos insuficientes para fabricar el contrato. Se requiere customerId, planId y durationMonths.');
    }

    const startDate = new Date();

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + Number(durationMonths));

    const randomSuffix = Math.floor(Math.random() * 90) + 10;
    const contractCode = `CTR-${Date.now()}-${randomSuffix}`;

    return {
      contractCode,
      customerId: Number(customerId),
      planId: Number(planId),
      conditions: conditions || 'Sin condiciones específicas',
      durationMonth: Number(durationMonths),
      price: Number(price),
      startDate: startDate.toISOString().slice(0, 19).replace('T', ' '),
      endDate: endDate.toISOString().slice(0, 19).replace('T', ' '),
      status: 'activo'
    };
  }
}