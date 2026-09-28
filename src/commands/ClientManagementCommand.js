// src/commands/ClientManagementCommand.js
import inquirer from 'inquirer';
import chalk from 'chalk';
import { ClientService } from '../services/ClientService.js';
import { Customer } from '../models/Customer.js';

export class ClientManagementCommand {
  async execute() {
    let inMenu = true;

    while (inMenu) {
      console.log(chalk.bold.blue('\n=====  GESTIÓN DE CLIENTES ======'));
       console.log(chalk.bold.blue('\n================================'));
      const { action } = await inquirer.prompt([
        {
          type: 'select',
          name: 'action',
          message: '¿Qué operación desea realizar?',
          choices: [
            new inquirer.Separator(),
            { name: '1. Registrar Nuevo Cliente', value: 'CREATE' },
            { name: '2. Listar Clientes Activos', value: 'LIST' },
            { name: '3. Actualizar Datos de Cliente', value: 'UPDATE' },
            { name: '4. Eliminar / Desactivar Cliente', value: 'DELETE' },
            new inquirer.Separator(),
            { name: '0. Volver al Menú Principal', value: 'BACK' }
          ]
        }
      ]);

      switch (action) {
        case 'CREATE':
          await this.createClient();
          break;
        case 'LIST':
          await this.listClients();
          break;
        case 'UPDATE':
          await this.updateClient();
          break;
        case 'DELETE':
          await this.deleteClient();
          break;
        case 'BACK':
          inMenu = false;
          break;
      }
    }
  }


  async createClient() {
    console.log(chalk.cyan.bold('\n[+] Registrar Nuevo Cliente'));
    const answers = await inquirer.prompt([
      { type: 'input', name: 'dpi', message: 'DPI / Documento de Identificación:' },
      { type: 'input', name: 'firstName', message: 'Nombre:' },
      { type: 'input', name: 'lastName', message: 'Apellido:' },
      { type: 'input', name: 'email', message: 'Correo Electrónico:' },
      { type: 'input', name: 'phone', message: 'Teléfono de Contacto:' }
    ]);

    try {
      const customer = new Customer(answers);
      const insertedId = await ClientService.createClient(customer);
      console.log(chalk.green.bold(`\n Cliente registrado exitosamente con ID: ${insertedId}`));
    } catch (error) {
      console.log(chalk.red.bold(`\n Error al registrar cliente: ${error.message}`));
    }
  }

  async listClients() {
    console.log(chalk.cyan.bold('\n Lista de Clientes Activos'));
    try {
      const clients = await ClientService.listClients();
      if (!clients || clients.length === 0) {
        console.log(chalk.yellow('No hay clientes activos registrados en el sistema.'));
        return;
      }

      console.table(
        clients.map(c => ({
          ID: c.id,
          DPI: c.dpi,
          Nombre: `${c.first_name} ${c.last_name}`,
          Email: c.email,
          Teléfono: c.phone_number
        }))
      );
    } catch (error) {
      console.log(chalk.red.bold(`\n Error al consultar la lista de clientes: ${error.message}`));
    }
  }

  async updateClient() {
    console.log(chalk.cyan.bold('\n[+] Actualizar Datos de Cliente'));
    const { id } = await inquirer.prompt([
      { type: 'input', name: 'id', message: 'Ingrese el ID del cliente a actualizar:' }
    ]);

    try {
      const current = await ClientService.getClientById(id);
      if (!current) {
        console.log(chalk.yellow(' No se encontró un cliente con el ID especificado.'));
        return;
      }

      console.log(chalk.gray('Presione Enter para conservar el valor actual entre corchetes.\n'));

      const answers = await inquirer.prompt([
        { type: 'input', name: 'dpi', message: 'DPI:', default: current.dpi },
        { type: 'input', name: 'firstName', message: 'Nombre:', default: current.first_name },
        { type: 'input', name: 'lastName', message: 'Apellido:', default: current.last_name },
        { type: 'input', name: 'email', message: 'Correo Electrónico:', default: current.email },
        { type: 'input', name: 'phone', message: 'Teléfono:', default: current.phone_number }
      ]);

      const updatedCustomer = new Customer(answers);
      await ClientService.updateClient(id, updatedCustomer);
      console.log(chalk.green.bold('\n Datos del cliente actualizados correctamente.'));
    } catch (error) {
      console.log(chalk.red.bold(`\nError al actualizar el cliente: ${error.message}`));
    }
  }

  async deleteClient() {
    console.log(chalk.cyan.bold('\n Eliminar / Desactivar Cliente'));
    const { id, confirm } = await inquirer.prompt([
      { type: 'input', name: 'id', message: 'Ingrese el ID del cliente a desactivar:' },
      { 
        type: 'confirm', 
        name: 'confirm', 
        message: '¿Está seguro de que desea desactivar a este cliente del sistema?', 
        default: false 
      }
    ]);

    if (!confirm) {
      console.log(chalk.gray('Operación cancelada.'));
      return;
    }

    try {
      const success = await ClientService.deleteClient(id);
      if (success) {
        console.log(chalk.green.bold('\n Cliente desactivado/eliminado correctamente.'));
      } else {
        console.log(chalk.yellow('\n No se encontró el cliente o ya se encuentra inactivo.'));
      }
    } catch (error) {
      console.log(chalk.red.bold(`\nError al eliminar el cliente: ${error.message}`));
    }
  }
}