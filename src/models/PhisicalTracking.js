export class PhisicalTracking {
    constructor({id = null, customerId, contractId, weekNumber, weightKg, bodyFatPercentage, measurementsJson, photoUrl, comments}){
        this.id = id;
        this.customerId = this.validatePositiveInteger(customerId, 'Id de cliente');
        this.contractId = this.validatePositiveInteger(contractId, 'Id de contrato');
        this.weekNumber = this.validatePositiveInteger(weekNumber, 'Numero de semana');
        this.weightKg = this.validateRange(weightKg, 20, 300, 'Peso en kg');
        this.bodyFatPercentage = this.validateRange(bodyFatPercentage, 3 ,60, 'Porcentaje de grasa');
        this.measurementsJson = typeof measurementsJson === 'object' ? JSON.stringify(measurementsJson): measurementsJson;
        this.photoUrl = photoUrl || null;
        this.comments = comments || '';
    }

    validatePositiveInteger(val, field){
        const num = Number(val);
        if(!Number.isInteger(num) || num <= 0)
            throw new Error (`El campo ${field} debe ser un entero positivo.`);
        return num;
    }
    validateRange(val, min, max, field){
        const num = parseFloat(val);
        if(isNaN(num) || num < min || num > max)
            throw new Error (` El campo ${field} debe estar entre ${min} y ${max}.`);
        return num;
    }
}