/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Customer Domain Service
 * Pure business logic and database access for customers and statements.
 */

import { db } from '../../db/index.ts';
import * as schema from '../../db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import type { Customer, CustomerStatementEntry } from '../../../types/domain.ts';
import type { CreateCustomerDto, UpdateCustomerDto, CustomerStatementResponseDto } from '../../../types/apiContracts.ts';

export async function getAllCustomers(): Promise<Customer[]> {
  const rows = await db.select().from(schema.customers).orderBy(desc(schema.customers.createdAt));
  return rows.map((r) => ({
    ...r,
    branch: r.branch ?? undefined,
    managerPhone: r.managerPhone ?? undefined,
    notes: r.notes ?? undefined,
    preferredDeliveryTime: r.preferredDeliveryTime ?? undefined,
    customerType: r.customerType as any,
    status: r.status as any,
    regularPreferences: r.regularPreferences ? JSON.parse(r.regularPreferences) : undefined,
  }));
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const [row] = await db.select().from(schema.customers).where(eq(schema.customers.id, id));
  if (!row) return null;
  return {
    ...row,
    branch: row.branch ?? undefined,
    managerPhone: row.managerPhone ?? undefined,
    notes: row.notes ?? undefined,
    preferredDeliveryTime: row.preferredDeliveryTime ?? undefined,
    customerType: row.customerType as any,
    status: row.status as any,
    regularPreferences: row.regularPreferences ? JSON.parse(row.regularPreferences) : undefined,
  };
}

export async function createCustomer(dto: CreateCustomerDto): Promise<Customer> {
  const now = new Date().toISOString();
  const id = `cust-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  
  const newCustomer: Customer = {
    ...dto,
    id,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.customers).values({
    id: newCustomer.id,
    name: newCustomer.name,
    organizationName: newCustomer.organizationName,
    branch: newCustomer.branch || null,
    customerType: newCustomer.customerType,
    phone: newCustomer.phone,
    managerPhone: newCustomer.managerPhone || null,
    address: newCustomer.address,
    status: newCustomer.status,
    notes: newCustomer.notes || null,
    preferredDeliveryTime: newCustomer.preferredDeliveryTime || null,
    regularPreferences: newCustomer.regularPreferences ? JSON.stringify(newCustomer.regularPreferences) : null,
    createdAt: newCustomer.createdAt,
    updatedAt: newCustomer.updatedAt,
  });

  return newCustomer;
}

export async function updateCustomer(id: string, patch: UpdateCustomerDto): Promise<Customer | null> {
  const now = new Date().toISOString();
  const updateValues: Record<string, any> = { updatedAt: now };

  if (patch.name !== undefined) updateValues.name = patch.name;
  if (patch.organizationName !== undefined) updateValues.organizationName = patch.organizationName;
  if (patch.branch !== undefined) updateValues.branch = patch.branch;
  if (patch.customerType !== undefined) updateValues.customerType = patch.customerType;
  if (patch.phone !== undefined) updateValues.phone = patch.phone;
  if (patch.managerPhone !== undefined) updateValues.managerPhone = patch.managerPhone;
  if (patch.address !== undefined) updateValues.address = patch.address;
  if (patch.status !== undefined) updateValues.status = patch.status;
  if (patch.notes !== undefined) updateValues.notes = patch.notes;
  if (patch.preferredDeliveryTime !== undefined) updateValues.preferredDeliveryTime = patch.preferredDeliveryTime;
  if (patch.regularPreferences !== undefined) updateValues.regularPreferences = JSON.stringify(patch.regularPreferences);

  await db.update(schema.customers).set(updateValues).where(eq(schema.customers.id, id));
  return getCustomerById(id);
}

export async function getCustomerStatement(
  customerId: string,
  startDate?: string,
  endDate?: string
): Promise<CustomerStatementResponseDto | null> {
  const customer = await getCustomerById(customerId);
  if (!customer) return null;

  const orders = await db.select().from(schema.orders).where(eq(schema.orders.customerId, customerId));
  const payments = await db.select().from(schema.payments).where(eq(schema.payments.customerId, customerId));

  const allEntries: CustomerStatementEntry[] = [];

  for (const o of orders) {
    if (o.status !== 'CANCELLED') {
      allEntries.push({
        date: o.orderDate,
        type: 'ORDER',
        referenceId: o.orderNumber,
        description: `Order #${o.orderNumber}`,
        debit: o.totalAmount,
        credit: 0,
        runningBalance: 0,
        status: o.status,
      });
    }
  }

  for (const p of payments) {
    if (p.verificationStatus !== 'REJECTED') {
      allEntries.push({
        date: p.paymentDate,
        type: 'PAYMENT',
        referenceId: p.receiptNumber,
        description: `Payment via ${p.paymentMethod}${p.transactionReference ? ` (Ref: ${p.transactionReference})` : ''}`,
        debit: 0,
        credit: p.amount,
        runningBalance: 0,
        status: p.verificationStatus,
      });
    }
  }

  // Sort ascending by date
  allEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let running = 0;
  for (const entry of allEntries) {
    running += (entry.debit - entry.credit);
    entry.runningBalance = Math.round(running * 100) / 100;
  }

  // Filter within date range if specified
  let filteredEntries = allEntries;
  if (startDate || endDate) {
    filteredEntries = allEntries.filter((e) => {
      const entryDate = e.date.slice(0, 10);
      if (startDate && entryDate < startDate) return false;
      if (endDate && entryDate > endDate) return false;
      return true;
    });
  }

  const totalOrders = orders.filter((o) => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPayments = payments.filter((p) => p.verificationStatus !== 'REJECTED').reduce((sum, p) => sum + p.amount, 0);

  return {
    customer,
    currentBalance: Math.round((totalOrders - totalPayments) * 100) / 100,
    totalOrders,
    totalPayments,
    statement: filteredEntries,
  };
}
