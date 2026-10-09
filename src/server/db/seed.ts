/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Database Seeder for Initial Bakery Records
 */

import { db } from './index.ts';
import * as schema from './schema.ts';
import { count } from 'drizzle-orm';
import {
  initialProducts,
  initialCustomers,
  initialPricingAgreements,
  initialOrders,
  initialOrderItems,
  initialPayments,
  initialExpenses,
  initialComplaints,
} from '../../store/mockData.ts';

export async function seedDatabaseIfEmpty(): Promise<void> {
  const [productCount] = await db.select({ val: count() }).from(schema.products);
  if (productCount && productCount.val > 0) {
    // Database already seeded
    return;
  }

  // 1. Seed Products
  for (const p of initialProducts) {
    await db.insert(schema.products).values({
      id: p.id,
      nameEn: p.nameEn,
      nameAm: p.nameAm,
      descriptionEn: p.descriptionEn || null,
      descriptionAm: p.descriptionAm || null,
      basePrice: p.basePrice,
      category: p.category,
      isActive: p.isActive,
      createdAt: p.createdAt,
    }).onConflictDoNothing();
  }

  // 2. Seed Customers
  for (const c of initialCustomers) {
    await db.insert(schema.customers).values({
      id: c.id,
      name: c.name,
      organizationName: c.organizationName,
      branch: c.branch || null,
      customerType: c.customerType,
      phone: c.phone,
      managerPhone: c.managerPhone || null,
      address: c.address,
      status: c.status,
      notes: c.notes || null,
      preferredDeliveryTime: c.preferredDeliveryTime || null,
      regularPreferences: c.regularPreferences ? JSON.stringify(c.regularPreferences) : null,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }).onConflictDoNothing();
  }

  // 3. Seed Pricing Agreements
  for (const pa of initialPricingAgreements) {
    await db.insert(schema.pricingAgreements).values({
      id: pa.id,
      customerId: pa.customerId,
      productId: pa.productId,
      agreedPrice: pa.agreedPrice,
      effectiveDate: pa.effectiveDate,
      isActive: pa.isActive,
      notes: pa.notes || null,
    }).onConflictDoNothing();
  }

  // 4. Seed Orders
  for (const o of initialOrders) {
    await db.insert(schema.orders).values({
      id: o.id,
      orderNumber: o.orderNumber,
      customerId: o.customerId,
      customerName: o.customerName,
      organizationName: o.organizationName,
      branch: o.branch || null,
      customerPhone: o.customerPhone,
      orderSource: o.orderSource,
      status: o.status,
      orderDate: o.orderDate,
      totalAmount: o.totalAmount,
      deliveryType: o.deliveryType,
      deliveryAddress: o.deliveryAddress || null,
      scheduledTime: o.scheduledTime || null,
      actualDeliveryTime: o.actualDeliveryTime || null,
      driverName: o.driverName || null,
      deliveryNotes: o.deliveryNotes || null,
      notes: o.notes || null,
      createdBy: o.createdBy,
      updatedAt: o.updatedAt,
    }).onConflictDoNothing();
  }

  // 5. Seed Order Items
  for (const item of initialOrderItems) {
    await db.insert(schema.orderItems).values({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      productNameEn: item.productNameEn,
      productNameAm: item.productNameAm,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    }).onConflictDoNothing();
  }

  // 6. Seed Payments
  for (const pay of initialPayments) {
    await db.insert(schema.payments).values({
      id: pay.id,
      receiptNumber: pay.receiptNumber,
      orderId: pay.orderId,
      customerId: pay.customerId,
      customerName: pay.customerName,
      amount: pay.amount,
      paymentMethod: pay.paymentMethod,
      transactionReference: pay.transactionReference || null,
      verificationStatus: pay.verificationStatus,
      verifiedBy: pay.verifiedBy || null,
      verifiedAt: pay.verifiedAt || null,
      paymentDate: pay.paymentDate,
      notes: pay.notes || null,
      recordedBy: pay.recordedBy,
    }).onConflictDoNothing();
  }

  // 7. Seed Expenses
  for (const exp of initialExpenses) {
    await db.insert(schema.expenses).values({
      id: exp.id,
      date: exp.date,
      amount: exp.amount,
      category: exp.category,
      description: exp.description,
      paymentMethod: exp.paymentMethod,
      referenceNumber: exp.referenceNumber || null,
      recordedBy: exp.recordedBy,
      notes: exp.notes || null,
      expensePeriod: exp.expensePeriod || 'DAILY',
      unit: exp.unit || null,
      quantity: exp.quantity || null,
      unitPrice: exp.unitPrice || null,
    }).onConflictDoNothing();
  }

  // 8. Seed Complaints
  for (const comp of initialComplaints) {
    await db.insert(schema.complaints).values({
      id: comp.id,
      complaintNumber: comp.complaintNumber,
      customerId: comp.customerId,
      customerName: comp.customerName,
      orderId: comp.orderId || null,
      orderNumber: comp.orderNumber || null,
      productId: comp.productId || null,
      productName: comp.productName || null,
      category: comp.category,
      description: comp.description,
      quantityAffected: comp.quantityAffected || null,
      priority: comp.priority,
      status: comp.status,
      resolutionType: comp.resolutionType || null,
      resolutionNotes: comp.resolutionNotes || null,
      resolvedBy: comp.resolvedBy || null,
      resolvedAt: comp.resolvedAt || null,
      createdAt: comp.createdAt,
    }).onConflictDoNothing();
  }
}
