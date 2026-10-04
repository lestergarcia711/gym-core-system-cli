import { input, number, select, Separator } from '@inquirer/prompts';
import chalk from 'chalk';
import { PlanService } from '../services/PlanService.js';
import { contractService as defaultContractService } from '../config/container.js';

const money = (value) => `Q${Number(value).toFixed(2)}`;
const fmtDate = (d) => (d instanceof Date ? d.toISOString().split('T')[0] : String(d));

export class PlanManagementCommand {

  constructor(contractService = defaultContractService) {
    this.contractService = contractService;
  }

  async execute() {
    let inMenu = true;
    while (inMenu) {
      console.log(chalk.bold.blue('\n====  GESTIÓN DE PLANES DE ENTRENAMIENTO Y CONTRATOS  ====='));
      console.log(chalk.bold.blue('==========================================================='));
      const action = await select({
        message: 'Seleccione una opcion:',
        loop: false,
        choices: [
          new Separator('--- Planes ---'),
          { name: '1. Crear Nuevo Plan de Entrenamiento', value: 'CREATE_PLAN' },
          { name: '2. Listar Planes Activos', value: 'LIST' },
          { name: '3. Actualizar Plan', value: 'UPDATE_PLAN' },
          { name: '4. Eliminar Plan de Entrenamiento', value: 'DELETE_PLAN' },
          new Separator('--- Contratos ---'),
          { name: '5. Asignar Plan a Cliente y Contrato', value: 'ASSIGN' },
          { name: '6. Listar Contratos de un Cliente', value: 'LIST_CONTRACTS' },
          { name: '7. Renovar Contrato', value: 'RENEW' },
          { name: '8. Finalizar Contrato', value: 'FINISH' },
          { name: '9. Cancelar Contrato (revierte seguimiento)', value: 'CANCEL' },
          new Separator(),
          { name: '0.--> Volver al Menú Principal', value: 'BACK' }
        ]
      });

      switch (action) {
        case 'CREATE_PLAN': await this.createPlan(); break;
        case 'LIST': await this.listPlans(); break;
        case 'UPDATE_PLAN': await this.updatePlan(); break;
        case 'DELETE_PLAN': await this.deletePlan(); break;
        case 'ASSIGN': await this.assignPlan(); break;
        case 'LIST_CONTRACTS': await this.listContracts(); break;
        case 'RENEW': await this.renewContract(); break;
        case 'FINISH': await this.finishContract(); break;
        case 'CANCEL': await this.cancelContract(); break;
        case 'BACK': inMenu = false; break;
      }
    }
  }

  async createPlan() {
    console.log(chalk.bold.cyan('\n>>>>> REGISTRAR NUEVO PLAN DE ENTRENAMIENTO >>>>>'));
    try {
      const name = await input({
        message: 'Nombre del plan:',
        validate: val => val.trim() !== '' || 'El nombre es obligatorio.'
      });

      const durationMonth = await number({
        message: 'Duración en meses:',
        validate: val => (Number.isInteger(val) && val > 0) || 'Ingrese un número entero de meses (> 0).'
      });

      const price = await number({
        message: 'Precio total del plan (Q):',
        validate: val => (val !== undefined && val >= 0) || 'Ingrese un precio válido (>= 0).'
      });

      const phisicalGoals = await input({
        message: 'Objetivos físicos / condiciones:',
        validate: val => val.trim() !== '' || 'Los objetivos son obligatorios.'
      });

      const level = await select({
        message: 'Nivel del plan:',
        choices: [
          { name: 'Principiante', value: 'principiante' },
          { name: 'Intermedio', value: 'intermedio' },
          { name: 'Avanzado', value: 'avanzado' }
        ]
      });

      const metricsRaw = await input({
        message: 'Métricas requeridas para el progreso (separadas por comas, ej: Cintura, Biceps, Muslo). Enter = Peso, Grasa:'
      });

      const requiredMetrics = metricsRaw.trim()
        ? metricsRaw.split(',').map(m => m.trim()).filter(m => m.length > 0)
        : null; // el modelo aplica ['Peso', 'Grasa']

      const newPlanId = await PlanService.createPlan({
        name, durationMonth, price, phisicalGoals, level, requiredMetrics
      });
      console.log(chalk.green.bold(`\n Plan de entrenamiento creado correctamente con ID: ${newPlanId}\n`));
    } catch (error) {
      console.log(chalk.red.bold(`\n Error al crear el plan: ${error.message}\n`));
    }
  }

  async listPlans() {
    try {
      const plans = await PlanService.listActivePlans();
      if (plans.length === 0) {
        return console.log(chalk.yellow('No hay planes activos registrados en la base de datos.'));
      }
      console.table(plans.map(plan => ({
        ID: plan.id,
        Nombre: plan.name,
        'Duración (Meses)': plan.durationMonth,
        Nivel: plan.level,
        Precio: money(plan.price),
        Métricas: plan.requiredMetrics.join(', ')
      })));
    } catch (error) {
      console.log(chalk.red.bold(` Error al listar planes: ${error.message}`));
    }
  }

  async updatePlan() {
    console.log(chalk.cyan.bold('\n[+] Actualizar Plan de Entrenamiento'));
    try {
      const id = await input({ message: 'ID del plan a actualizar:' });
      const current = await PlanService.getPlanById(id);
      if (!current) {
        return console.log(chalk.yellow(' No se encontró un plan activo con ese ID.'));
      }
      console.log(chalk.gray('Enter conserva el valor actual. Los contratos ya creados no cambian.\n'));

      const name = await input({ message: 'Nombre:', default: current.name });
      const durationMonth = await number({ message: 'Duración en meses:', default: current.durationMonth });
      const price = await number({ message: 'Precio (Q):', default: current.price });
      const phisicalGoals = await input({ message: 'Objetivos físicos:', default: current.phisicalGoals });
      const level = await select({
        message: 'Nivel:',
        default: current.level,
        choices: [
          { name: 'Principiante', value: 'principiante' },
          { name: 'Intermedio', value: 'intermedio' },
          { name: 'Avanzado', value: 'avanzado' }
        ]
      });

      const ok = await PlanService.updatePlan(id, { name, durationMonth, price, phisicalGoals, level });
      console.log(ok
        ? chalk.green.bold('\n Plan actualizado correctamente.')
        : chalk.yellow('\n No se actualizó ningún registro.'));
    } catch (error) {
      console.log(chalk.red.bold(`\n Error al actualizar el plan: ${error.message}`));
    }
  }

  async deletePlan() {
    console.log(chalk.cyan.bold('\n Eliminar Plan de Entrenamiento'));
    try {
      const id = await input({ message: 'Ingrese el ID del Plan a eliminar:' });
      if (!(await this.confirm('¿Está seguro de que desea eliminar el Plan de Entrenamiento?'))) {
        return console.log(chalk.gray('Operación cancelada.'));
      }
      const success = await PlanService.deletePlan(id);
      console.log(success
        ? chalk.green.bold('\n Plan eliminado correctamente.')
        : chalk.yellow('\n No se encontró el Plan o ya se encuentra inactivo.'));
    } catch (error) {
      console.log(chalk.red.bold(`\nError al eliminar el Plan de entrenamiento: ${error.message}`));
    }
  }

  async assignPlan() {
    try {
      const plans = await PlanService.listActivePlans();
      if (plans.length === 0) {
        return console.log(chalk.yellow('No hay planes disponibles para asignar. Crea uno primero.'));
      }

      const customerId = await input({ message: 'ID del Cliente:' });
      const planId = await select({
        message: 'Seleccione el Plan a asignar:',
        choices: plans.map(p => ({
          name: `${p.name} | ${p.durationMonth} mes(es) | ${p.level} | ${money(p.price)}`,
          value: p.id
        }))
      });

      const res = await this.contractService.assignPlan(customerId, planId);
      console.log(chalk.green.bold(
        `\n Plan asignado. Contrato ID ${res.contractId} (${res.contractCode}) | ${money(res.price)} | ${res.startDate} -> ${res.endDate}`
      ));
    } catch (error) {
      console.log(chalk.red.bold(` Error (se hizo ROLLBACK, no se guardó nada): ${error.message}`));
    }
  }

  async listContracts() {
    try {
      const customerId = await input({ message: 'ID del Cliente:' });
      const contracts = await this.contractService.listByCustomer(customerId);
      if (contracts.length === 0) {
        return console.log(chalk.yellow('Este cliente no tiene contratos.'));
      }
      console.table(contracts.map(c => ({
        ID: c.id,
        Código: c.contract_code,
        Plan: c.plan_name,
        Precio: money(c.price),
        Inicio: fmtDate(c.start_date),
        Fin: fmtDate(c.end_date),
        Estado: c.status
      })));
    } catch (error) {
      console.log(chalk.red.bold(` Error: ${error.message}`));
    }
  }

  async renewContract() {
    try {
      const customerId = await input({ message: 'ID del Cliente:' });
      const contractId = await input({ message: 'ID del Contrato a renovar:' });
      if (!(await this.confirm('¿Confirma la renovación? (el contrato actual pasará a "renovado")'))) return;

      const res = await this.contractService.renew(customerId, contractId);
      console.log(chalk.green.bold(
        `\n Renovado. Nuevo contrato ID ${res.contractId} (${res.contractCode}) | ${money(res.price)} | ${res.startDate} -> ${res.endDate}`
      ));
    } catch (error) {
      console.log(chalk.red.bold(` Error (se hizo ROLLBACK): ${error.message}`));
    }
  }

  async finishContract() {
    try {
      const customerId = await input({ message: 'ID del Cliente:' });
      const contractId = await input({ message: 'ID del Contrato a finalizar:' });
      if (!(await this.confirm('¿Confirma que el plan fue completado?'))) return;

      const res = await this.contractService.finish(customerId, contractId);
      console.log(chalk.green.bold(`\n ${res.message}`));
    } catch (error) {
      console.log(chalk.red.bold(` Error (se hizo ROLLBACK): ${error.message}`));
    }
  }

  async cancelContract() {
    try {
      const customerId = await input({ message: 'ID del Cliente:' });
      const contractId = await input({ message: 'ID del Contrato:' });
      if (!(await this.confirm('Se eliminará el seguimiento físico del contrato. ¿Confirma la cancelación?'))) return;

      const res = await this.contractService.cancel(customerId, contractId);
      console.log(chalk.green.bold(`\n ${res.message}`));
      console.log(chalk.gray(` Seguimientos eliminados: ${res.trackingRemoved} | Planes de alimentación desactivados: ${res.nutritionPlansDeactivated}`));
    } catch (error) {
      console.log(chalk.red.bold(` Error (se hizo ROLLBACK, no se canceló nada): ${error.message}`));
    }
  }

  async confirm(message) {
    return select({
      message,
      choices: [
        { name: 'No', value: false },
        { name: 'Sí', value: true }
      ]
    });
  }
}