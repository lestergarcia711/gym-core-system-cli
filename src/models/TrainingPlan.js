export class TrainingPlan {
    constructor({ id = null, name, durationMonth, phisicalGoals, level, active = true, createdAt = null }) {
        this.id = id;
        this.name = this.validateRequire(name, 'Nombre del plan');
        this.durationMonth = this.validateDuration(durationMonth);
        this.phisicalGoals = this.validateRequire(phisicalGoals, 'Objetivos físicos');
        this.level = this.validateLevel(level);
        this.active = active;
        this.createdAt = createdAt;
    }

    validateRequire(value, fieldName) {
        if (!value || typeof value !== 'string' || value.trim() === '') {
            throw new Error(`El campo ${fieldName} es obligatorio.`);
        }
        return value.trim();
    }

    validateDuration(months) {
        const parsed = parseInt(months, 10);
        if (isNaN(parsed) || parsed <= 0) {
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
}