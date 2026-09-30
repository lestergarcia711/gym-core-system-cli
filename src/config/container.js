import dbInstance from './database.js';
import { TransactionManager } from '../utils/TransactionManager.js';
import { ContractService } from '../services/ContractService.js';
import { FinanceService } from '../services/FinanceService.js';
import { NutritionService } from '../services/NutritionService.js';

export const transactionManager = new TransactionManager(dbInstance);

export const contractService = new ContractService({
  transactionManager,
  database: dbInstance
});

export const financeService = new FinanceService({
  transactionManager,
  database: dbInstance
});

export const nutritionService = new NutritionService({
  transactionManager,
  database: dbInstance
});