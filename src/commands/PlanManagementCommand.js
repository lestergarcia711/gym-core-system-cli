import { input, number, select, Separator } from '@inquirer/prompts';
import chalk from 'chalk';
import { ClientService } from '../services/ClientService.js';
import { PlanService } from '../services/PlanService.js';

export class PlanManagementCommand {
  async execute() {
    let inMenu = true;
    while (inMenu) {
      console.log(chalk.bold.blue('\n====  GESTIÓN DE PLANES DE ENTRENAMIENTO Y CONTRATOS  ====='));
      console.log(chalk.bold.blue('\n==========================================================='));
      const action = await select({
          message: 'Seleccione una opcion:',
          loop : false,
          choices: [
            new Separator(),
            { name: '1. Crear Nuevo Plan de Entrenamiento', value: 'CREATE_PLAN' },
            { name: '2. Listar Planes Activos', value: 'LIST' },
            { name: '3. Eliminar Plan de Entrenamiento', value: 'DELETE_PLAN'},
            { name: '4. Asignar Plan a Cliente', value: 'ASSIGN' },
            { name: '5. Cancelar Plan de Cliente y contrato', value: 'CANCEL' },
            new Separator(),
            { name: '0.--> Volver al Menú Principal', value: 'BACK' }
          ]
      });

      switch (action) {
        case 'CREATE_PLAN': await this.createPlan(); break;
        case 'LIST': await this.listPlans(); break;
        case 'DELETE_PLAN': await this.deletePlan(); break;
        case 'ASSIGN': await this.assignPlan(); break;
        case 'CANCEL': await this.cancelPlan(); break;
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
             validate: val => (val && val > 0) || 'Ingrese un número de meses válido (> 0).'
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
             message: 'Métricas requeridas para el progreso (separadas por comas, ej: Cintura, Biceps, Muslo):'
         });

         const requiredMetrics = metricsRaw
             ? metricsRaw.split(',').map(m => m.trim()).filter(m => m.length > 0)
             : ['Peso', 'Grasa'];

         const planData = {
             name,
             durationMonth,
             phisicalGoals,
             level,
             metrics: requiredMetrics
         };

        const newPlanId = await PlanService.createPlan(planData);
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
      
      const cleanRecords = plans.map(plan => ({
          ID: plan.id,
          Nombre: plan.name,
          'Duración (Meses)': plan.duration_month || plan.durationMonth,
          Nivel: plan.level,
          Estado: plan.active && (plan.active === 1 || plan.active.readInt8?.(0) === 1) ? 'Activo' : 'Inactivo'
      }));

      console.table(cleanRecords);
    } catch (error) {
      console.log(chalk.red.bold(` Error al listar planes: ${error.message}`));
    }
  }

  async deletePlan() {
      console.log(chalk.cyan.bold('\n Eliminar Plan de Entrenamiento'));
      try {
        const id = await input({ message: 'Ingrese el ID del Plan a eliminar:' });
        const confirmOption = await select({
          message: '¿Está seguro de que desea eliminar el Plan de Entrenamiento?',
          choices: [
            { name: 'No', value: false },
            { name: 'Sí', value: true }
          ]
        });

        if (!confirmOption) {
          console.log(chalk.gray('Operación cancelada.'));
          return;
        }

        const success = await PlanService.deletePlan(id);
        if (success) {
          console.log(chalk.green.bold('\n Plan eliminado correctamente.'));
        } else {
          console.log(chalk.yellow('\n No se encontró el Plan o ya se encuentra inactivo.'));
        }
      } catch (error) {
        console.log(chalk.red.bold(`\nError al eliminar el Plan de entrenamiento ${error.message}`));
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
          name: `${p.name} | Duración: ${p.duration_month || p.durationMonth} mes(es) | Nivel: ${p.level}`, 
          value: p.id 
        }))
      });

      const res = await ClientService.assignPlanToCustomer(customerId, planId);
      console.log(chalk.green.bold(` Plan asignado correctamente. ID Contrato: ${res.contractId} (Código: ${res.contractCode})`));
    } catch (error) {
      console.log(chalk.red.bold(` Error: ${error.message}`));
    }
  }

  async cancelPlan() {
    try {
      const customerId = await input({ message: 'ID del Cliente:' });
      const contractId = await input({ message: 'ID del Contrato:' });
      
      const confirmOption = await select({
        message: '¿Confirma la cancelación transaccional?',
        choices: [
          { name: 'No', value: false },
          { name: 'Sí', value: true }
        ]
      });
      
      if (!confirmOption) return;

      const res = await ClientService.cancelCustomerPlan(customerId, contractId);
      console.log(chalk.green.bold(`${res.message}`));
    } catch (error) {
      console.log(chalk.red.bold(` Error: ${error.message}`));
    }
  }
}
