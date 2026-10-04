const DEFAULT_METRICS = ['Peso', 'Grasa'];

export class TrainingPlan {
    constructor({ id = null, name, durationMonth, phisicalGoals, level, price = 0, requiredMetrics = null, active = true, createdAt = null }) {
        this.id = id;
        this.name = this.validateRequire(name, 'Nombre del plan');
        this.durationMonth = this.validateDuration(durationMonth);
        this.phisicalGoals = this.validateRequire(phisicalGoals, 'Objetivos físicos');
        this.level = this.validateLevel(level);
        this.price = this.validatePrice(price);
        this.requiredMetrics = this.validateMetrics(requiredMetrics);
        this.active = Boolean(active);
        this.createdAt = createdAt;
    }

    validateRequire(value, fieldName) {
        if (!value || typeof value !== 'string' || value.trim() === '') {
            throw new Error(`El campo ${fieldName} es obligatorio.`);
        }
        return value.trim();
    }

    validateDuration(months) {
        const parsed = Number(months);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new Error('La duración en meses debe ser un número entero mayor a 0.');
        }
        return parsed;
    }

    validateLevel(level) {
        const validLevels = ['principiante', 'intermedio', 'avanzado'];
        const cleanLevel = level ? level.toString().toLowerCase().trim() : '';
        if (!validLevels.includes(cleanLevel)) {
            throw new Error(`Nivel no válido. Debe ser uno de los siguientes: ${validLevels.join(', ')}.`);
        }
        return cleanLevel;
    }

    validatePrice(price) {
        const num = Number(price);
        if (Number.isNaN(num) || num < 0) {
            throw new Error('El precio del plan debe ser un número mayor o igual a 0.');
        }
        return Math.round(num * 100) / 100;
    }

    validateMetrics(metrics) {
        let list = metrics;
        if (typeof list === 'string') {
            try { list = JSON.parse(list); } catch { list = null; }
        }
        if (list === null || list === undefined) return [...DEFAULT_METRICS];
        if (!Array.isArray(list) || list.some(m => typeof m !== 'string' || m.trim() === '')) {
            throw new Error('Las métricas requeridas deben ser una lista de textos no vacíos.');
        }
        return list.map(m => m.trim());
    }
}