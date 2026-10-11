/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Expense Controller
 */

import type { Request, Response } from 'express';
import * as expenseService from './expense.service.ts';
import { sendSuccess, sendCreated, sendNotFound, sendError, sendServerError } from '../../common/responseHelper.ts';
import type { CreateExpenseDto } from '../../../types/apiContracts.ts';

export async function getExpenses(req: Request, res: Response) {
  try {
    const expenses = await expenseService.getAllExpenses();
    return sendSuccess(res, expenses);
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function createExpense(req: Request, res: Response) {
  try {
    const body = req.body as CreateExpenseDto;
    if (!body.category || body.amount === undefined || !body.description || !body.date || !body.paymentMethod) {
      return sendError(res, 'Missing required expense fields: category, amount, description, date, paymentMethod');
    }
    const expense = await expenseService.createExpense(body);
    return sendCreated(res, expense, 'Expense recorded successfully');
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function updateExpense(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const body = req.body;
    const updated = await expenseService.updateExpense(id, body);
    if (!updated) {
      return sendNotFound(res, `Expense with id "${id}"`);
    }
    return sendSuccess(res, updated, 'Expense updated successfully');
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function deleteExpense(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const deleted = await expenseService.deleteExpense(id);
    if (!deleted) {
      return sendNotFound(res, `Expense with id "${id}"`);
    }
    return sendSuccess(res, { id, deleted: true }, 'Expense deleted successfully');
  } catch (err: any) {
    return sendServerError(res, err);
  }
}
