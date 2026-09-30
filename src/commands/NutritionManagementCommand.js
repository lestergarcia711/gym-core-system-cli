import { input, number, select, Separator } from '@inquirer/prompts';
import chalk from 'chalk';
import { DAYS, DAY_LABELS, MEAL_TYPES } from '../models/NutritionItem.js';
import { nutritionService as defaultNutritionService, contractService as defaultContractService } from '../config/container.js';

const dayLabel = (day) => DAY_LABELS[day] ?? day;
const BAR_WIDTH = 20;

export class NutritionManagementCommand {
  constructor(nutritionService = defaultNutritionService, contractService = defaultContractService) {
    this.nutritionService = nutritionService;
    this.contractService = contractService;
  }

  async execute() {
    let inMenu = true;
    while (inMenu) {
      console.log(chalk.bold.blue('\n=====  GESTIÓN DE NUTRICIÓN  ====='));
      console.log(chalk.bold.blue('=================================='));
      const action = await select({
        message: 'Seleccione una opción:',
        loop: false,
        choices: [
          new Separator(),
          { name: '1. Crear Plan de Alimentación', value: 'CREATE' },
          { name: '2. Agregar Alimento a un Plan', value: 'ADD_ITEM' },
          { name: '3. Ver Reporte Nutricional Semanal', value: 'REPORT' },
          { name: '4. Listar Planes de Alimentación de un Cliente', value: 'LIST' },
          { name: '5. Eliminar Alimento', value: 'REMOVE_ITEM' },
          new Separator(),
          { name: '0. Volver al Menú Principal', value: 'BACK' }
        ]
      });

      switch (action) {
        case 'CREATE': await this.createPlan(); break;
        case 'ADD_ITEM': await this.addItem(); break;
        case 'REPORT': await this.showReport(); break;
        case 'LIST': await this.listPlans(); break;
        case 'REMOVE_ITEM': await this.removeItem(); break;
        case 'BACK': inMenu = false; break;
      }
    }
  }

  async createPlan() {
    console.log(chalk.cyan.bold('\n[+] Crear Plan de Alimentación'));
    try {
      const customerId = await input({ message: 'ID del Cliente:' });
      const contracts = (await this.contractService.listByCustomer(customerId))
        .filter(c => c.status === 'activo');
      if (contracts.length === 0) {
        return console.log(chalk.yellow('Este cliente no tiene contratos activos.'));
      }

      const contractId = await select({
        message: 'Contrato (plan de entrenamiento) al que se asocia:',
        choices: contracts.map(c => ({ name: `${c.plan_name} | ${c.contract_code}`, value: c.id }))
      });
      const name = await input({
        message: 'Nombre del plan de alimentación:',
        validate: val => val.trim() !== '' || 'El nombre es obligatorio.'
      });

      const res = await this.nutritionService.createPlan(customerId, contractId, name);
      console.log(chalk.green.bold(`\n Plan de alimentación creado con ID: ${res.planId}`));
    } catch (error) {
      console.log(chalk.red.bold(`\n Error (se hizo ROLLBACK, no se creó nada): ${error.message}`));
    }
  }

  async addItem() {
    console.log(chalk.cyan.bold('\n[+] Agregar Alimento'));
    try {
      const plan = await this.pickPlan({ onlyActive: true });
      if (!plan) return;

      let adding = true;
      while (adding) {
        const dayOfWeek = await select({
          message: 'Día:',
          choices: DAYS.map(d => ({ name: dayLabel(d), value: d })),
          loop: false
        });
        const mealType = await select({
          message: 'Comida:',
          choices: MEAL_TYPES.map(m => ({ name: m, value: m }))
        });
        const foodDescription = await input({
          message: 'Alimento (ej: 2 huevos con frijoles):',
          validate: val => val.trim() !== '' || 'La descripción es obligatoria.'
        });
        const estimatedCalories = await number({
          message: 'Calorías estimadas:',
          validate: val => (Number.isInteger(val) && val >= 0 && val <= 5000) || 'Ingrese un entero entre 0 y 5000.'
        });

        const res = await this.nutritionService.addItem(plan.id, {
          dayOfWeek, mealType, foodDescription, estimatedCalories
        });
        console.log(chalk.green(` Alimento registrado (ID ${res.itemId}): ${dayLabel(dayOfWeek)} / ${mealType} / ${estimatedCalories} kcal`));

        adding = await select({
          message: '¿Agregar otro alimento a este plan?',
          choices: [{ name: 'Sí', value: true }, { name: 'No', value: false }]
        });
      }
    } catch (error) {
      console.log(chalk.red.bold(`\n Error (se hizo ROLLBACK): ${error.message}`));
    }
  }

  async showReport() {
    console.log(chalk.cyan.bold('\n[+] Reporte Nutricional Semanal'));
    try {
      const plan = await this.pickPlan({ onlyActive: false });
      if (!plan) return;

      const report = await this.nutritionService.getWeeklyReport(plan.id);
      console.log(chalk.bold(`\n ${report.plan.name}`) + chalk.gray(`  (${report.plan.active ? 'activo' : 'inactivo'})`));
      console.log(chalk.gray(` Cliente: ${report.plan.customerName} | Plan de entrenamiento: ${report.plan.trainingPlanName}\n`));

      if (report.daysWithData === 0) {
        return console.log(chalk.yellow(' Este plan aún no tiene alimentos registrados.'));
      }

      const maxCalories = Math.max(...report.days.map(d => d.calories), 1);
      for (const day of report.days) {
        const filled = Math.round((day.calories / maxCalories) * BAR_WIDTH);
        const bar = '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled);
        console.log(
          chalk.bold(dayLabel(day.day).padEnd(10)) + chalk.cyan(bar) + ` ${String(day.calories).padStart(5)} kcal`
        );
        for (const meal of day.meals) {
          const foods = meal.items.map(i => `${i.food} (${i.calories})`).join(', ');
          console.log(chalk.gray(`   ${meal.mealType.padEnd(10)} ${String(meal.calories).padStart(5)} kcal  ${foods}`));
        }
      }

      console.log(chalk.bold('\n Resumen'));
      console.log(`   Total semanal:          ${chalk.green.bold(report.totalCalories + ' kcal')}`);
      console.log(`   Días con alimentos:     ${report.daysWithData} de 7`);
      console.log(`   Promedio por día:       ${report.averagePerDay} kcal`);
      if (report.peakDay) {
        console.log(`   Día de mayor consumo:   ${dayLabel(report.peakDay.day)} (${report.peakDay.calories} kcal)`);
      }
    } catch (error) {
      console.log(chalk.red.bold(`\n Error al generar el reporte: ${error.message}`));
    }
  }

  async listPlans() {
    try {
      const customerId = await input({ message: 'ID del Cliente:' });
      const plans = await this.nutritionService.listPlansByCustomer(customerId);
      if (plans.length === 0) return console.log(chalk.yellow('Este cliente no tiene planes de alimentación.'));
      console.table(plans.map(p => ({
        ID: p.id, Nombre: p.name, 'Plan de entrenamiento': p.trainingPlanName, Contrato: p.contractCode,
        Alimentos: p.items, 'Calorías (suma)': p.totalCalories, Estado: p.active ? 'activo' : 'inactivo'
      })));
    } catch (error) {
      console.log(chalk.red.bold(` Error: ${error.message}`));
    }
  }

  async removeItem() {
    console.log(chalk.cyan.bold('\n[+] Eliminar Alimento'));
    try {
      const plan = await this.pickPlan({ onlyActive: true });
      if (!plan) return;

      const report = await this.nutritionService.getWeeklyReport(plan.id);
      const rows = report.days.flatMap(d => d.meals.flatMap(m => m.items.map(i => ({
        ID: i.id, Día: dayLabel(d.day), Comida: m.mealType, Alimento: i.food, Calorías: i.calories
      }))));
      if (rows.length === 0) return console.log(chalk.yellow('Este plan no tiene alimentos.'));
      console.table(rows);

      const itemId = await input({ message: 'ID del alimento a eliminar:' });
      const removed = await this.nutritionService.removeItem(itemId);
      console.log(removed
        ? chalk.green.bold('\n Alimento eliminado.')
        : chalk.yellow('\n No se encontró ese alimento en un plan activo.'));
    } catch (error) {
      console.log(chalk.red.bold(`\n Error: ${error.message}`));
    }
  }

  async pickPlan({ onlyActive }) {
    const customerId = await input({ message: 'ID del Cliente:' });
    let plans = await this.nutritionService.listPlansByCustomer(customerId);
    if (onlyActive) plans = plans.filter(p => p.active);
    if (plans.length === 0) {
      console.log(chalk.yellow(onlyActive
        ? 'El cliente no tiene planes de alimentación activos.'
        : 'El cliente no tiene planes de alimentación.'));
      return null;
    }
    return select({
      message: 'Plan de alimentación:',
      choices: plans.map(p => ({
        name: `${p.name} | ${p.trainingPlanName} | ${p.items} alimento(s)${p.active ? '' : ' | inactivo'}`,
        value: p
      }))
    });
  }
}
