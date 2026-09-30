import dbInstance from './database.js';
import { TransactionManager } from '../utils/TransactionManager.js';
import { ContractService } from '../services/ContractService.js';

export const transactionManager = new TransactionManager(dbInstance);

export const contractService = new ContractService({
  transactionManager,
  database: dbInstance
});
