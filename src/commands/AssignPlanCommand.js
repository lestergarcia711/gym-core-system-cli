import inquirer from 'inquirer';
import chalk from 'chalk';
import dbInstance from '../config/database.js';
import { ClientService } from '../services/ClientService.js';

export class AssignPlanCommand{
    async execute(){
        console.log(chalk.blue.bold('\n --- Asignar Plan de Entrenamiento y Generar Contrato---'));
         const pool = dbInstance.getPool();

         const [ plans ] = await pool.execute(`SELECT id, name, duration_month, phisical_goals, level FROM training_plans WHERE active = 1`);
         if(!plans || plans.lenght === 0){
            console.log(chalk.yellow('No hay planes de entrenamiento activos registrados'));
            console.log(chalk.yellow('Por favor, registre un plan antes de asignarlo a un cliente.\n'));
            return;
         }

         const { customerId, planId } = await inquirer.prompt([
            {
            type: 'input',
            name: 'customerId',
            message: 'Ingrese el ID del cliente:'
            },
            {
                type: 'select',
                name: 'planId',
                message: 'Seleccione el Plan de Entrenamiento a asignar:',
                choices: plans.map(p => ({
                    name: `${p.name} (${p.duration_month} meses) - Nivel: ${p.level}`,
                    value: p.id
                }))

            }
           
         ]);

         try {
            const result = await ClientService.assignPlanToCustomer(customerId, planId);
            console.log(chalk.green.bold(`\n Plan Asignado Correctamente.`));
            console.log(chalk.green(`\n Contrato Generado con ID: ${result.contractId}`));
         }catch(error){
            console.log(chalk.red.bold(`\n Error al asignar plan: ${error.message}`));
         }

    }
}