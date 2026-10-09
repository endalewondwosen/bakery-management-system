/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Expense Domain Service
 * Tracks operational costs: Flour, Yeast, Fuel, Maintenance, Salaries, Utilities.
 */

import { db } from '../../db/index.ts';
import * as schema from '../../db/schema.ts';
import { desc } from 'drizzle-orm';
import type { Expense } from '../../../types/domain.ts';
import type { CreateExpenseDto } from '../../../types/apiContracts.ts';

export async function getAllExpenses(): Promise<Expense[]> {
  const rows = await db.select().from(schema.expenses).orderBy(desc(schema.expenses.date));
  return rows.map((r) => ({
    ...r,
    referenceNumber: r.referenceNumber ?? undefined,
    notes: r.notes ?? undefined,
    expensePeriod: (r.expensePeriod as any) ?? undefined,
    unit: (r.unit as any) ?? undefined,
    quantity: r.quantity ?? undefined,
    unitPrice: r.unitPrice ?? undefined,
    category: r.category as any,
    paymentMethod: r.paymentMethod as any,
  }));
}

export async function createExpense(dto: CreateExpenseDto): Promise<Expense> {
  const id = `exp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  const newExpense: Expense = {
    id,
    date: dto.date,
    amount: dto.amount,
    category: dto.category,
    description: dto.description,
    paymentMethod: dto.paymentMethod,
    referenceNumber: dto.referenceNumber,
    recordedBy: dto.recordedBy || 'Staff',
    notes: dto.notes,
    expensePeriod: dto.expensePeriod || 'DAILY',
    unit: dto.unit,
    quantity: dto.quantity,
    unitPrice: dto.unitPrice,
  };

  await db.insert(schema.expenses).values({
    id: newExpense.id,
    date: newExpense.date,
    amount: newExpense.amount,
    category: newExpense.category,
    description: newExpense.description,
    paymentMethod: newExpense.paymentMethod,
    referenceNumber: newExpense.referenceNumber || null,
    recordedBy: newExpense.recordedBy,
    notes: newExpense.notes || null,
    expensePeriod: newExpense.expensePeriod || null,
    unit: newExpense.unit || null,
    quantity: newExpense.quantity || null,
    unitPrice: newExpense.unitPrice || null,
  });

  return newExpense;
}
