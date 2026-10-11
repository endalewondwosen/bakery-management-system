/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Expense Domain Service
 * Tracks operational costs: Flour, Yeast, Fuel, Maintenance, Salaries, Utilities.
 */

import { db } from '../../db/index.ts';
import * as schema from '../../db/schema.ts';
import { desc, eq } from 'drizzle-orm';
import type { Expense } from '../../../types/domain.ts';
import type { CreateExpenseDto, UpdateExpenseDto } from '../../../types/apiContracts.ts';

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
  const id = dto.id?.trim() || `exp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  // Idempotency: if expense already exists by ID, return existing
  const [existingById] = await db.select().from(schema.expenses).where(eq(schema.expenses.id, id));
  if (existingById) {
    return {
      ...existingById,
      referenceNumber: existingById.referenceNumber ?? undefined,
      notes: existingById.notes ?? undefined,
      expensePeriod: (existingById.expensePeriod as any) ?? undefined,
      unit: (existingById.unit as any) ?? undefined,
      quantity: existingById.quantity ?? undefined,
      unitPrice: existingById.unitPrice ?? undefined,
      category: existingById.category as any,
      paymentMethod: existingById.paymentMethod as any,
    };
  }

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

export async function getExpenseById(id: string): Promise<Expense | null> {
  const [row] = await db.select().from(schema.expenses).where(eq(schema.expenses.id, id));
  if (!row) return null;
  return {
    ...row,
    referenceNumber: row.referenceNumber ?? undefined,
    notes: row.notes ?? undefined,
    expensePeriod: (row.expensePeriod as any) ?? undefined,
    unit: (row.unit as any) ?? undefined,
    quantity: row.quantity ?? undefined,
    unitPrice: row.unitPrice ?? undefined,
    category: row.category as any,
    paymentMethod: row.paymentMethod as any,
  };
}

export async function updateExpense(id: string, dto: UpdateExpenseDto): Promise<Expense | null> {
  const existing = await getExpenseById(id);
  if (!existing) return null;

  const updateValues: Record<string, any> = {};
  if (dto.date !== undefined) updateValues.date = dto.date;
  if (dto.amount !== undefined) updateValues.amount = dto.amount;
  if (dto.category !== undefined) updateValues.category = dto.category;
  if (dto.description !== undefined) updateValues.description = dto.description;
  if (dto.paymentMethod !== undefined) updateValues.paymentMethod = dto.paymentMethod;
  if (dto.referenceNumber !== undefined) updateValues.referenceNumber = dto.referenceNumber || null;
  if (dto.notes !== undefined) updateValues.notes = dto.notes || null;
  if (dto.expensePeriod !== undefined) updateValues.expensePeriod = dto.expensePeriod || null;
  if (dto.unit !== undefined) updateValues.unit = dto.unit || null;
  if (dto.quantity !== undefined) updateValues.quantity = dto.quantity || null;
  if (dto.unitPrice !== undefined) updateValues.unitPrice = dto.unitPrice || null;

  await db.update(schema.expenses).set(updateValues).where(eq(schema.expenses.id, id));
  return getExpenseById(id);
}

export async function deleteExpense(id: string): Promise<boolean> {
  const existing = await getExpenseById(id);
  if (!existing) return false;
  await db.delete(schema.expenses).where(eq(schema.expenses.id, id));
  return true;
}

