import inquirer from 'inquirer';
import chalk from 'chalk';
import dbInstance from '../config/database.js';
import { Customer } from '../models/Customer.js';

export class CreateClientCommand{
    async execute(){
        console.log(chalk.blue.bold('\n === Registrar NUEVO cliente ==='));
        const answer = await inquirer.prompt([
            {type: 'input', name: 'dpi', message: 'DPI/Identificacion: '},
            {type: 'input', name: 'firstName', message: 'Nombre: ' },
            {type: 'input', name: 'lastName', message:'Apellido: '},
            {type: 'input', name: 'email', message: 'Correo Electronico:'},
            {type: 'input', name: 'phone' , message : 'Telefono: '}
        ]);

        try {
            const customer = new Customer(answer);

            const pool = dbInstance.getPool();

            await pool.execute(
                `INSERT INTO customers (dpi, first_name, last_name, email, phone_number, active) VALUES (?, ?, ?, ?, ?, ?)`,
                [customer.dpi, customer.firstName, customer.lastName, customer.email, customer.phone, true]
            );
            console.log(chalk.green.bold('El cliente ha sido registrado exitosamente.'));

        }catch(error){
            console.log(chalk.red.bold(`Error al registrar cliente: ${error.message}`));
        }
    }
}

