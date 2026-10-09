/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Bakery Analytics & Reporting Service
 */

import { db } from '../../db/index.ts';
import * as schema from '../../db/schema.ts';
import type { DashboardMetricsDto, DailyPnLDto } from '../../../types/apiContracts.ts';

export async function getDashboardMetrics(): Promise<DashboardMetricsDto> {
  const allCustomers = await db.select().from(schema.customers);
  const allOrders = await db.select().from(schema.orders);
  const allPayments = await db.select().from(schema.payments);
  const allComplaints = await db.select().from(schema.complaints);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = allOrders.filter((o) => o.orderDate === todayStr && o.status !== 'CANCELLED');
  const todaySalesAmount = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Total receivables = valid orders total - non-rejected payments
  const totalBilled = allOrders.filter((o) => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCollected = allPayments.filter((p) => p.verificationStatus !== 'REJECTED').reduce((sum, p) => sum + p.amount, 0);
  const totalReceivables = Math.max(0, Math.round((totalBilled - totalCollected) * 100) / 100);

  const pendingPaymentVerifications = allPayments.filter((p) => p.verificationStatus === 'PENDING_VERIFICATION').length;
  const openComplaints = allComplaints.filter((c) => c.status === 'OPEN' || c.status === 'UNDER_REVIEW').length;

  return {
    totalCustomers: allCustomers.length,
    activeCustomers: allCustomers.filter((c) => c.status === 'ACTIVE').length,
    todayOrdersCount: todayOrders.length,
    todaySalesAmount,
    totalReceivables,
    pendingPaymentVerifications,
    openComplaints,
  };
}

/**
 * Computes Profit & Loss (P&L) and operational margins for a date period
 */
export async function getPnLReport(startDate?: string, endDate?: string): Promise<DailyPnLDto> {
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const defaultEnd = now.toISOString().slice(0, 10);

  const start = startDate || defaultStart;
  const end = endDate || defaultEnd;

  const allOrders = await db.select().from(schema.orders);
  const allPayments = await db.select().from(schema.payments);
  const allExpenses = await db.select().from(schema.expenses);

  // Filter within date range
  const rangeOrders = allOrders.filter(
    (o) => o.orderDate >= start && o.orderDate <= end && o.status !== 'CANCELLED'
  );
  const rangePayments = allPayments.filter(
    (p) => p.paymentDate.slice(0, 10) >= start && p.paymentDate.slice(0, 10) <= end && p.verificationStatus === 'VERIFIED'
  );
  const rangeExpenses = allExpenses.filter(
    (e) => e.date.slice(0, 10) >= start && e.date.slice(0, 10) <= end
  );

  // Revenue calculation
  const invoicedTotal = rangeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  let collectedCash = 0;
  let collectedTelebirr = 0;
  let collectedBank = 0;

  for (const p of rangePayments) {
    if (p.paymentMethod === 'CASH') collectedCash += p.amount;
    else if (p.paymentMethod === 'TELEBIRR') collectedTelebirr += p.amount;
    else collectedBank += p.amount;
  }
  const collectedTotal = collectedCash + collectedTelebirr + collectedBank;

  // Total balance across all time
  const allValidBilled = allOrders.filter((o) => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.totalAmount, 0);
  const allValidPaid = allPayments.filter((p) => p.verificationStatus === 'VERIFIED').reduce((sum, p) => sum + p.amount, 0);
  const outstandingReceivables = Math.max(0, Math.round((allValidBilled - allValidPaid) * 100) / 100);

  // Expenses categorization (COGS vs Operational Overhead)
  const cogsCategories = new Set([
    'RAW_FLOUR',
    'RAW_EGGS',
    'RAW_CHEESE_FETA',
    'RAW_SUGAR_OIL',
    'PACKAGING',
  ]);

  let cogsTotal = 0;
  let operatingOverheadTotal = 0;
  const categoryMap = new Map<string, number>();

  for (const e of rangeExpenses) {
    if (cogsCategories.has(e.category)) {
      cogsTotal += e.amount;
    } else {
      operatingOverheadTotal += e.amount;
    }
    const current = categoryMap.get(e.category) || 0;
    categoryMap.set(e.category, current + e.amount);
  }

  const grandExpenseTotal = cogsTotal + operatingOverheadTotal;

  const byCategory = Array.from(categoryMap.entries()).map(([cat, amt]) => ({
    category: cat,
    amount: amt,
    percentage: grandExpenseTotal > 0 ? Math.round((amt / grandExpenseTotal) * 1000) / 10 : 0,
  }));

  // Profitability margins
  const grossProfit = Math.round((invoicedTotal - cogsTotal) * 100) / 100;
  const netProfit = Math.round((invoicedTotal - grandExpenseTotal) * 100) / 100;
  const operatingMarginPercent = invoicedTotal > 0 ? Math.round((netProfit / invoicedTotal) * 1000) / 10 : 0;

  return {
    startDate: start,
    endDate: end,
    revenue: {
      invoicedTotal: Math.round(invoicedTotal * 100) / 100,
      collectedTotal: Math.round(collectedTotal * 100) / 100,
      collectedCash: Math.round(collectedCash * 100) / 100,
      collectedTelebirr: Math.round(collectedTelebirr * 100) / 100,
      collectedBank: Math.round(collectedBank * 100) / 100,
      outstandingReceivables,
    },
    expenses: {
      cogsTotal: Math.round(cogsTotal * 100) / 100,
      operatingOverheadTotal: Math.round(operatingOverheadTotal * 100) / 100,
      grandTotal: Math.round(grandExpenseTotal * 100) / 100,
      byCategory,
    },
    profitability: {
      grossProfit,
      netProfit,
      operatingMarginPercent,
    },
  };
}
