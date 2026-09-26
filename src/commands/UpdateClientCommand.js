import inquirer from 'inquirer';
import chalk from 'chalk';
import {ClientService } from '../services/ClientService.js';
import { Customer } from '../models/Customer.js';

export class UpdateClientCommand{
    async execute(){
        console.log(chalk.blue.bold('\n--- Actualizar Datos de Cliente ---'));

        const { id } = await inquirer.prompt([
            {type: 'input', name: 'id', message:'Ingrese el ID del cliente a actualizar:'}

        ]);
        const current = await ClientService.getClientById(id);
        if(!current){
            console.log(chalk.red('Cliente no encontrado.'));
            return;
        }

        const answers= await inquirer.prompt([
            {type: 'input', name: 'dpi', message: 'DPI:', default: current.dpi},
            {type: 'input', name: 'firstName', message: 'Nombre:', default: current.first_name},
            {type: 'input', name: 'lastName', message: 'Apellido:', default: current.last_name},
            {type: 'input', name: 'email', message: 'Correo Electronico:', default: current.email},
            {type: 'input', name: 'phone', message: 'Telefono:', default: current.phone_number}
        ]);

        try {
            const updateModel = new Customer(answers);
            await ClientService.updateClient(id, updateModel);
            console.log(chalk.green.bold('Cliente actualizado correctamente'));

        }catch(error){
            console.log(chalk.red(`Error al actulaizar: ${error.message}`));
        }
       }
}