import inquirer from 'inquirer';
import chalk from 'chalk';
import { ClientService } from '../services/ClientService.js';

export class DeleteClientCommand {
    async execute(){
        console.log(chalk.blue.bold('\n ---Eliminar Cliente ---'));

        const { id, confirm } = await inquirer.prompt([
            {type: 'input', name: 'id', message: 'Ingrese el Id del cliente a eliminar: '},
            {type: 'confirm', name: 'confirm', message: 'Esta seguro de eliminar el cliente?:' ,default:false}

        ]);
        if(!confirm){
            console.log(chalk.yellow('La opercion fue cancelada.'));
            return;
        }
        try{
            const success = await ClientService.deleteClient(id);
            if(success){
              console.log(chalk.green.bold('Cliente eliminado correctamente.'));

            }else{
                console.log(chalk.red('No se encontro el cliente especificado.'));

            }
        }catch(error){
            console.log(chalk.red(`Error al eliminar Cliente: ${error.message}`));
        }
    }
}