/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Expense Controller
 */

import type { Request, Response } from 'express';
import * as expenseService from './expense.service.ts';
import { sendSuccess, sendCreated, sendError, sendServerError } from '../../common/responseHelper.ts';
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
