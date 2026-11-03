/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Expense Routes Definition
 */

import { Router } from 'express';
import * as expenseController from './expense.controller.ts';

export const expenseRouter = Router();

// GET /api/expenses/categories
expenseRouter.get('/categories', expenseController.getExpenseCategories);

// POST /api/expenses/categories
expenseRouter.post('/categories', expenseController.createExpenseCategory);

// DELETE /api/expenses/categories/:id
expenseRouter.delete('/categories/:id', expenseController.deleteExpenseCategory);

// GET /api/expenses
expenseRouter.get('/', expenseController.getExpenses);

// POST /api/expenses
expenseRouter.post('/', expenseController.createExpense);

// PUT /api/expenses/:id
expenseRouter.put('/:id', expenseController.updateExpense);

// DELETE /api/expenses/:id
expenseRouter.delete('/:id', expenseController.deleteExpense);
