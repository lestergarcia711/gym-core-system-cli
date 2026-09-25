export class FinancialTransaction{
    constructor({id = null, customerId = null, contractId = null, type, category, amount, description}){
        this.id = id ;
        this.customerId = customerId ? Number(customerId): null;
        this.contractId - contractId ? Number(contractId): null;
        this.type = this.validateType(type);
        this.category = this.validateRequired(category, 'Categorias');
        this.amount = this.validateAmount(amount);
        this.description = description || '';
    }
    validateType(type){
        const valid = ['INCOME', 'EXPENSE'];
        if (!valid.includes(type))
            throw new Error ("El tipo debe ser 'INCOME' (ingreso) o 'EXPENSE' (egreso).");
        return type;
    }
    validateAmount(amount){
        const num = parseFloat(amount);
        if(isNaN(num) || num <= 0 )
            throw new Error ('El monto financiero debe ser un numero mayor a cero.');
        return num;
    }
    validateRequired(val, field){
        if(!val || val.trim() === '')
            throw new Error (`El campo '${field}' es obligatorio.`);
        return val.trim();
    }
}