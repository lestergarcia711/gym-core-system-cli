// app.js
import inquirer from 'inquirer';
import chalk from 'chalk';
import dotenv from 'dotenv';

import { ClientManagementCommand } from './commands/ClientManagementCommand.js';

dotenv.config();

class App {
  constructor() {
    this.modules = {
      CLIENTS: new ClientManagementCommand()
    };
  }

  async start() {
    console.clear();
    let running = true;

    while (running) {
      console.log(chalk.bold.magenta('\n========================================'));
      console.log(chalk.bold.white('      SISTEMA DE GESTIÓN DE GIMNASIO    '));
      console.log(chalk.bold.magenta('========================================'));

      const { selectedModule } = await inquirer.prompt([
        {
          type: 'select',
          name: 'selectedModule',
          message: 'Seleccione un módulo de gestión:',
          choices: [
            { name: '1. Gestión de Clientes (CRUD)', value: 'CLIENTS' },
            new inquirer.Separator(),
            { name: '0. Salir del Sistema', value: 'EXIT' }
          ]
        }
      ]);

      if (selectedModule === 'EXIT') {
        console.log(chalk.yellow('\n¡Gracias por usar el sistema! Hasta pronto.\n'));
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