import { input, select } from '@inquirer/prompts';
import chalk from 'chalk';
import { PhisicalTracking } from '../models/PhisicalTracking.js';
import { TrackingService } from '../services/TrackingService.js';
import { PlanService } from '../services/PlanService.js';

export class TrackingManagementCommand{
   async execute() {
        let inMenu = true;
        while (inMenu) {
            console.log(chalk.bold.blue('\n ====  GESTION DE SEGUIMIENTO FISICO ===='));
            console.log(chalk.bold.blue('\n ========================================'));
            
            const action = await select({
                message: 'Seleccione una opcion:',
                choices: [
                    { name: '1. Registrar Avance semanal', value: 'ADD' },
                    { name: '2. Consultar Historial de Cliente', value: 'VIEW' },
                    { name: '0. --> Volver al Menu Principal', value: 'BACK' }
                ]
            });

            switch (action) {
                case 'ADD': await this.addTracking(); break;
                case 'VIEW': await this.viewTracking(); break;
                case 'BACK': inMenu = false; break;
            }
        }
    }
   async addTracking() {
        try {
            const customerId = await input({ message: 'ID del Cliente:' });
            const contractId = await input({ message: 'ID del Contrato Activo:' });
            const weekNumber = await input({ message: 'Número de Semana:' });

            console.log(chalk.cyan('\n Buscando Requerimientos del plan asignado...'));
            
            const requiredMetrics = await PlanService.getMetricsByContract(contractId);

            const weightKg = await input({ message: 'Peso (kg):' });
            const bodyFatPercentage = await input({ message: 'Grasa (%):' });

            const measurementsObj = {};
            for (const metric of requiredMetrics) {
                const value = await input({ message: `${metric}:` });
                measurementsObj[metric] = value || null;
            }

            const photoUrl = await input({ message: 'URL o Ruta de la foto de progreso [Opcional]:'});

            const comments = await input({ message: 'Comentarios:' });

            const trackingData = new PhisicalTracking({
                customerId,
                contractId,
                weekNumber,
                weightKg,
                bodyFatPercentage,
                measurementsJson: measurementsObj,
                photoUrl,
                comments
            });

            const insertId = await TrackingService.addProgress(trackingData);
            console.log(chalk.green.bold(`\n Progreso registrado exitosamente con el ID: ${insertId}\n`));

        } catch (error) {
            console.log(chalk.red.bold(`\n Error al registrar el progreso: ${error.message}\n`));
        }
    }
    
  async viewTracking() {
    try {
      const customerId = await input({ message: 'ID del Cliente:' });

      const records = await TrackingService.getHistoryByCustomer(customerId);
      
      if (!records || records.length === 0) {
        console.log(chalk.yellow('\n No se encontraron registros de seguimiento para este cliente.\n'));
        return;
      }

      const cleanRecords = records.map(r => {
        let parsedMeasurements = '';
        
        if (r.measurements_json || r.measurementsJson) {
          const rawJson = r.measurements_json || r.measurementsJson;
          try {
            const obj = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
            parsedMeasurements = Object.entries(obj)
              .map(([key, val]) => `${key}: ${val}`)
              .join(' | ');
          } catch (e) {
            parsedMeasurements = String(rawJson);
          }
        }

        return {
          'Semana': r.week_number || r.weekNumber,
          'Peso (kg)': r.weight_kg || r.weightKg,
          'Grasa (%)': r.body_fat_percentage || r.bodyFatPercentage,
          'Medidas': parsedMeasurements || 'Ninguna',
          'Comentarios': r.comments || ''
        };
      });

      console.table(cleanRecords);
    } catch (error) {
      console.log(chalk.red.bold(`Error: ${error.message}`));
    }
     
   }
}
