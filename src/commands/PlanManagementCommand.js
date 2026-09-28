import inquirer from 'inquirer';
import chalk from 'chalk';
import { ClientService } from '../services/ClientService.js';
import { PlanService } from '../services/PlanService.js';

export class PlanManagementCommand {
  async execute() {
    let inMenu = true;
    while (inMenu) {
      console.log(chalk.bold.blue('\n====  GESTIÓN DE PLANES DE ENTRENAMIENTO Y CONTRATOS  ====='));
      console.log(chalk.bold.blue('\n==========================================================='));
      const { action } = await inquirer.prompt([
        {
          type: 'select',
          name: 'action',
          message: 'Seleccione una opción:',
          loop:false,
          choices: [
            new inquirer.Separator(),
            { name: '1. Crear Nuevo Plan de Entrenamiento', value: 'CREATE_PLAN' },
            { name: '2. Listar Planes Activos', value: 'LIST' },
            { name: '3. Eliminar Plan de Entrenamiento', value: 'DELETE_PLAN'},
            { name: '4. Asignar Plan a Cliente', value: 'ASSIGN' },
            { name: '5. Cancelar Plan de Cliente y contrato', value: 'CANCEL' },
            new inquirer.Separator(),
            { name: '0.--> Volver al Menú Principal', value: 'BACK' }
          ]
        }
      ]);

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
    
    const planData = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Nombre del plan:',
        validate: input => input.trim() !== '' || 'El nombre es obligatorio.'
      },
      {
        type: 'number',
        name: 'durationMonth',
        message: 'Duración en meses:',
        validate: input => (input && input > 0) || 'Ingrese un número de meses válido (> 0).'
      },
      {
        type: 'input',
        name: 'phisicalGoals',
        message: 'Objetivos físicos / condiciones:',
        validate: input => input.trim() !== '' || 'Los objetivos son obligatorios.'
      },
      {
        type: 'select',
        name: 'level',
        message: 'Nivel del plan:',
        choices: [
          { name: 'Principiante', value: 'principiante' },
          { name: 'Intermedio', value: 'intermedio' },
          { name: 'Avanzado', value: 'avanzado' }
        ]
      }
    ]);

    try {
      const newPlanId = await PlanService.createPlan(planData);
      console.log(chalk.green.bold(` Plan de entrenamiento creado Correctamente con ID: ${newPlanId}`));
    } catch (error) {
      console.log(chalk.red.bold(`Error al crear el plan: ${error.message}`));
    }
  }

  async listPlans() {
    try {
      const plans = await PlanService.listActivePlans();
      if (plans.length === 0) {
        return console.log(chalk.yellow('No hay planes activos registrados en la base de datos.'));
      }
      console.table(plans);
    } catch (error) {
      console.log(chalk.red.bold(` Error al listar planes: ${error.message}`));
    }
  }

  async deletePlan() {
      console.log(chalk.cyan.bold('\n Eliminar Plan de Entrenamiento'));
      const { id, confirm } = await inquirer.prompt([
        { type: 'input', name: 'id', message: 'Ingrese el ID del Plan a eliminar' },
        { 
          type: 'confirm', 
          name: 'confirm', 
          message: '¿Está seguro de que desea eliminar el Plan de Entrenamiento?', 
          default: false 
        }
      ]);

      if (!confirm) {
        console.log(chalk.gray('Operación cancelada.'));
        return;
      }

      try {
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

      const { customerId, planId } = await inquirer.prompt([
        { type: 'input', name: 'customerId', message: 'ID del Cliente:' },
        {
          type: 'select',
          name: 'planId',
          message: 'Seleccione el Plan a asignar:',
          choices: plans.map(p => ({ 
            name: `${p.name} | Duración: ${p.durationMonth} mes(es) | Nivel: ${p.level}`, 
            value: p.id 
          }))
        }
      ]);

      const res = await ClientService.assignPlanToCustomer(customerId, planId);
      console.log(chalk.green.bold(` Plan asignado correctamente. ID Contrato: ${res.contractId} (Código: ${res.contractCode})`));
    } catch (error) {
      console.log(chalk.red.bold(` Error: ${error.message}`));
    }
  }

  async cancelPlan() {
    const { customerId, contractId, confirm } = await inquirer.prompt([
      { type: 'input', name: 'customerId', message: 'ID del Cliente:' },
      { type: 'input', name: 'contractId', message: 'ID del Contrato:' },
      { type: 'confirm', name: 'confirm', message: '¿Confirms la cancelación transaccional?', default: false }
    ]);
    
    if (!confirm) return;

    try {
      const res = await ClientService.cancelCustomerPlan(customerId, contractId);
      console.log(chalk.green.bold(`${res.message}`));
    } catch (error) {
      console.log(chalk.red.bold(` Error: ${error.message}`));
    }
  }
}