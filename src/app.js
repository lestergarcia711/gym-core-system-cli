
import inquirer from 'inquirer';
import chalk from 'chalk';
import dotenv from 'dotenv';

import { CreateClientCommand } from './commands/CreateClientCommand.js';
import { ListClientsCommand } from './commands/ListClientsCommand.js';
import { UpdateClientCommand } from './commands/UpdateClientCommand.js';
import { DeleteClientCommand } from './commands/DeleteClientCommand.js';

dotenv.config();

class App{
    constructor(){
        this.commands = {
            'CLIENT_CREATE': new CreateClientCommand(),
            'CLIENT_LIST': new ListClientsCommand(),
            'CLIENT_UPDATE': new UpdateClientCommand(),
            'CLIENT_DELETE': new DeleteClientCommand()
        };
       
    }
     async start(){
            console.clear();
            console.log(chalk.bold.cyan('====================================='));
            console.log(chalk.bold.cyan('  GYM SYSTEM CLI - PANEL DE CONTROL  '));
            console.log(chalk.bold.cyan('=====================================\n'));

            let running =true ;

            while(running){
                const { option } = await inquirer.prompt([
                    {
                        type : 'select', name : 'option', message: 'Seleccione una operacion:',
                        choices: [
                            {name:'1.Registrar Nuevo Cliente.', value: 'CLIENT_CREATE'},
                            {name:'2.Listar Clientes.', value: 'CLIENT_LIST'},
                            {name:'3.Actualizar Cliente', value: 'CLIENT_UPDATE'},
                            {name:'4.Eliminar Cliente', value: 'CLIENT_DELETE'},
                            new inquirer.Separator(),
                            { name: '0. Salir del sistema', value: 'EXIT'}
                        ]
                        
                    }
                ]);
                if(option === 'EXIT'){
                    console.log(chalk.yellow('\nCerrando el sistema...'));
                    running = false;
                    process.exit(0);
                }
                const command = this.commands[option];
                if(command){
                    try{
                       await command.execute();
                    }catch(error){
                       console.log(chalk.red(`\n Error: ${error.message}\n`));

                    }
                }
        
            }
        }
}

const app = new App();
app.start();