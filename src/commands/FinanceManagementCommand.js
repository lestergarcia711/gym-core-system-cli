import { input, number, select, Separator } from '@inquirer/prompts';
import chalk from 'chalk';
import dayjs from 'dayjs';
import { PAYMENT_CATEGORY, SESSION_CATEGORY } from '../services/FinanceService.js';
import { financeService as defaultFinanceService } from '../config/container.js';

const money = (value) => `Q${Number(value).toFixed(2)}`;
const fmtDate = (d) => (d instanceof Date ? dayjs(d).format('YYYY-MM-DD') : String(d));

const optionalDate = (val) => {
  const text = val.trim();
  if (text === '') return true;
  return (/^\d{4}-\d{2}-\d{2}$/.test(text) && dayjs(text).format('YYYY-MM-DD') === text)
    || 'Use el formato YYYY-MM-DD (o deje vacío).';
};

export class FinanceManagementCommand {
  // El servicio se recibe por parámetro (DIP); por defecto usa el del container.
  constructor(financeService = defaultFinanceService) {
    this.financeService = financeService;
  }

  async execute() {
    let inMenu = true;
    while (inMenu) {
      console.log(chalk.bold.blue('\n=====  GESTIÓN FINANCIERA  ====='));
      console.log(chalk.bold.blue('================================'));
      const action = await select({
        message: 'Seleccione una opción:',
        loop: false,
        choices: [
          new Separator(),
          { name: '1. Registrar Pago de Cliente (ingreso)', value: 'PAYMENT' },
          { name: '2. Registrar Egreso (servicios, suplementos, gastos)', value: 'EXPENSE' },
          { name: '3. Consultar Balance (por fechas y/o cliente)', value: 'BALANCE' },
          { name: '4. Listar Movimientos', value: 'LIST' },
          { name: '5. Estado de Pagos de un Cliente', value: 'STATUS' },
          new Separator(),
          { name: '0. Volver al Menú Principal', value: 'BACK' }
        ]
      });

      switch (action) {
        case 'PAYMENT': await this.registerPayment(); break;
        case 'EXPENSE': await this.registerExpense(); break;
        case 'BALANCE': await this.showBalance(); break;
        case 'LIST': await this.listTransactions(); break;
        case 'STATUS': await this.showPaymentStatus(); break;
        case 'BACK': inMenu = false; break;
      }
    }
  }

  async registerPayment() {
    console.log(chalk.cyan.bold('\n[+] Registrar Pago de Cliente'));
    try {
      const customerId = await input({ message: 'ID del Cliente:' });
      const contracts = (await this.financeService.getCustomerContractsStatus(customerId))
        .filter(c => c.status === 'activo');
      if (contracts.length === 0) {
        return console.log(chalk.yellow('Este cliente no tiene contratos activos.'));
      }

      const contract = await select({
        message: 'Contrato al que corresponde el pago:',
        choices: contracts.map(c => ({
          name: `${c.planName} | ${c.contractCode} | Total ${money(c.price)} | Pagado ${money(c.paid)} | Pendiente ${money(c.pending)}`,
          value: c
        }))
      });

      const category = await select({
        message: 'Tipo de ingreso:',
        choices: [
          { name: `${PAYMENT_CATEGORY} (abona al precio del contrato)`, value: PAYMENT_CATEGORY },
          { name: `${SESSION_CATEGORY} (no abona al contrato)`, value: SESSION_CATEGORY }
        ]
      });

      const amount = await number({
        message: 'Monto (Q):',
        default: category === PAYMENT_CATEGORY && contract.pending > 0 ? contract.pending : undefined,
        validate: val => (val !== undefined && val > 0) || 'Ingrese un monto mayor a 0.'
      });
      const description = await input({ message: 'Descripción [Opcional]:' });

      const ok = await select({
        message: `¿Confirma el pago de ${money(amount)}?`,
        choices: [{ name: 'Sí', value: true }, { name: 'No', value: false }]
      });
      if (!ok) return console.log(chalk.gray('Operación cancelada.'));

      const res = await this.financeService.registerPayment(customerId, contract.id, { amount, category, description });
      console.log(chalk.green.bold(`\n Pago registrado (movimiento ID ${res.transactionId}) por ${money(res.amount)}.`));
      if (res.pendingAfter !== null) {
        console.log(res.paidInFull
          ? chalk.green(' El contrato quedó pagado en su totalidad.')
          : chalk.yellow(` Saldo pendiente del contrato: ${money(res.pendingAfter)}`));
      }
    } catch (error) {
      console.log(chalk.red.bold(`\n Error (se hizo ROLLBACK, no se registró el pago): ${error.message}`));
    }
  }

  async registerExpense() {
    console.log(chalk.cyan.bold('\n[+] Registrar Egreso'));
    try {
      const category = await select({
        message: 'Categoría:',
        choices: ['Servicios', 'Suplementos', 'Gastos operativos', 'Equipo', 'Otro']
          .map(c => ({ name: c, value: c }))
      });
      const amount = await number({
        message: 'Monto (Q):',
        validate: val => (val !== undefined && val > 0) || 'Ingrese un monto mayor a 0.'
      });
      const description = await input({ message: 'Descripción [Opcional]:' });
      const date = await input({ message: 'Fecha (YYYY-MM-DD) [Enter = hoy]:', validate: optionalDate });
      const customerId = await input({ message: 'ID de cliente asociado [Opcional, Enter = ninguno]:' });

      const res = await this.financeService.registerExpense({
        category, amount, description, date: date.trim() || null, customerId: customerId.trim() || null
      });
      console.log(chalk.green.bold(`\n Egreso registrado (movimiento ID ${res.transactionId}) por ${money(res.amount)}.`));
    } catch (error) {
      console.log(chalk.red.bold(`\n Error al registrar el egreso: ${error.message}`));
    }
  }

  async askFilters() {
    console.log(chalk.gray('Deje vacío cualquier filtro que no quiera aplicar.'));
    const from = await input({ message: 'Desde (YYYY-MM-DD):', validate: optionalDate });
    const to = await input({ message: 'Hasta (YYYY-MM-DD):', validate: optionalDate });
    const customerId = await input({ message: 'ID de cliente:' });
    return { from: from.trim() || null, to: to.trim() || null, customerId: customerId.trim() || null };
  }

  async showBalance() {
    console.log(chalk.cyan.bold('\n[+] Balance Financiero'));
    try {
      const filters = await this.askFilters();
      const r = await this.financeService.getBalance(filters);

      console.log(chalk.bold('\n Resumen'));
      console.log(chalk.green(`   Ingresos: ${money(r.income)}`));
      console.log(chalk.red(`   Egresos:  ${money(r.expense)}`));
      const balanceText = `   Balance:  ${money(r.balance)}`;
      console.log(r.balance >= 0 ? chalk.green.bold(balanceText) : chalk.red.bold(balanceText));

      if (r.breakdown.length > 0) {
        console.log(chalk.bold('\n Detalle por categoría'));
        console.table(r.breakdown.map(b => ({
          Tipo: b.type, Categoría: b.category, Movimientos: b.movements, Total: money(b.total)
        })));
      } else {
        console.log(chalk.yellow('\n No hay movimientos con esos filtros.'));
      }
    } catch (error) {
      console.log(chalk.red.bold(`\n Error al consultar el balance: ${error.message}`));
    }
  }

  async listTransactions() {
    console.log(chalk.cyan.bold('\n[+] Movimientos (máx. 50 más recientes)'));
    try {
      const filters = await this.askFilters();
      const rows = await this.financeService.listTransactions(filters);
      if (rows.length === 0) return console.log(chalk.yellow('No hay movimientos con esos filtros.'));
      console.table(rows.map(r => ({
        ID: r.id,
        Fecha: fmtDate(r.transaction_date),
        Tipo: r.type,
        Categoría: r.category,
        Monto: money(r.amount),
        Cliente: r.customer_id ?? '-',
        Contrato: r.contract_id ?? '-',
        Descripción: r.description ?? ''
      })));
    } catch (error) {
      console.log(chalk.red.bold(`\n Error al listar movimientos: ${error.message}`));
    }
  }

  async showPaymentStatus() {
    console.log(chalk.cyan.bold('\n[+] Estado de Pagos de un Cliente'));
    try {
      const customerId = await input({ message: 'ID del Cliente:' });
      const contracts = await this.financeService.getCustomerContractsStatus(customerId);
      if (contracts.length === 0) return console.log(chalk.yellow('Este cliente no tiene contratos.'));
      console.table(contracts.map(c => ({
        Contrato: c.id, Código: c.contractCode, Plan: c.planName, Estado: c.status,
        Total: money(c.price), Pagado: money(c.paid), Pendiente: money(c.pending)
      })));
    } catch (error) {
      console.log(chalk.red.bold(`\n Error: ${error.message}`));
    }
  }
}
