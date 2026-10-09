/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Expense Routes Definition
 */

import { Router } from 'express';
import * as expenseController from './expense.controller.ts';

export const expenseRouter = Router();

// GET /api/expenses
expenseRouter.get('/', expenseController.getExpenses);

// POST /api/expenses
expenseRouter.post('/', expenseController.createExpense);
