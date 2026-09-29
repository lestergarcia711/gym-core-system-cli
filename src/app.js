import inquirer from 'inquirer';
import chalk from 'chalk';
import dotenv from 'dotenv';

import { ClientManagementCommand } from './commands/ClientManagementCommand.js';
import { PlanManagementCommand } from './commands/PlanManagementCommand.js';
import { TrackingManagementCommand } from './commands/TrackingManagementCommand.js';

dotenv.config();

class App {
  constructor() {
    this.modules = {
      CLIENTS: new ClientManagementCommand(),
      PLANS: new PlanManagementCommand(),
      TRACKING: new TrackingManagementCommand()
    };
  }

  async start() {
    console.clear();
    let running = true;

    while (running) {
      console.log(chalk.bold.magenta('\n========================================'));
      console.log(chalk.bold.white('      GESTION DE GYM-CORE-SYSTEM            '));
      console.log(chalk.bold.magenta('========================================'));

      const { selectedModule } = await inquirer.prompt([
        {
          type: 'select',
          name: 'selectedModule',
          message: '==>Elija que desea Hacer.',
          choices: [
            { name: '1. Gestión de Clientes.', value: 'CLIENTS' },
            { name: '2. Gestión de Planes y Contratos.', value: 'PLANS' },
            { name: '3. Gestión de Seguimiento Físico', value: 'TRACKING' },
            new inquirer.Separator(),
            { name: '0. Salir del Sistema', value: 'EXIT' }
          ]
        }
      ]);

      if (selectedModule === 'EXIT') {
        console.log(chalk.yellow('\n¡Saliendo del Sistema! Hasta pronto.\n'));
        running = false;
        process.exit(0);
      }

      const moduleCommand = this.modules[selectedModule];
      if (moduleCommand) {
        await moduleCommand.execute();
      }
    }
  }
}

const app = new App();
app.start();