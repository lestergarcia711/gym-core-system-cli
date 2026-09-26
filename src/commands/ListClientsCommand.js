import chalk from "chalk";
import {ClientService} from '../services/ClientService.js';

export class ListClientsCommand{
    async execute(){
        console.log(chalk.blue.bold('\n --- Listar Clientes Activos---'));
        try{
            const clients = await ClientService.listClients();
            if(clients.length === 0){
                console.log(chalk.yellow('No hay clientes registrados en el sistema'));
                return;
            }

            console.table(clients.map(c => ({
                ID:c.id,
                DPI:c.dpi,
                Nombre: `${c.first_name} ${c.last_name}`,
                Email: c.email,
                Telefono: c.phone_number

            })));
        }catch(error){
            console.log(chalk.red(`Error al listar clientes: ${error.message}`));
        }
    }
}