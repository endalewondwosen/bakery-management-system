/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Offline-First Bidirectional Synchronization Service
 * Merges browser-stored mutations into the server relational database and returns canonical state.
 */

import { db } from '../../db/index.ts';
import * as schema from '../../db/schema.ts';
import { eq } from 'drizzle-orm';
import * as customerService from '../customer/customer.service.ts';
import * as productService from '../product/product.service.ts';
import * as orderService from '../order/order.service.ts';
import * as paymentService from '../payment/payment.service.ts';
import * as expenseService from '../expense/expense.service.ts';
import * as complaintService from '../complaint/complaint.service.ts';
import type { SyncPayloadDto, SyncResponseDto } from '../../../types/apiContracts.ts';

export async function processSync(payload: SyncPayloadDto): Promise<SyncResponseDto> {
  const now = new Date().toISOString();

  // 1. Process incoming customer updates / creations
  if (payload.customers && Array.isArray(payload.customers)) {
    for (const c of payload.customers) {
      const [existing] = await db.select().from(schema.customers).where(eq(schema.customers.id, c.id));
      if (!existing) {
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
          createdAt: c.createdAt || now,
          updatedAt: c.updatedAt || now,
        });
      } else if (c.updatedAt && (!existing.updatedAt || c.updatedAt > existing.updatedAt)) {
        await db
          .update(schema.customers)
          .set({
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
            updatedAt: c.updatedAt,
          })
          .where(eq(schema.customers.id, c.id));
      }
    }
  }

  // 2. Process incoming pricing agreements
  if (payload.pricingAgreements && Array.isArray(payload.pricingAgreements)) {
    for (const a of payload.pricingAgreements) {
      const [existing] = await db.select().from(schema.pricingAgreements).where(eq(schema.pricingAgreements.id, a.id));
      if (!existing) {
        await db.insert(schema.pricingAgreements).values({
          id: a.id,
          customerId: a.customerId,
          productId: a.productId,
          agreedPrice: a.agreedPrice,
          effectiveDate: a.effectiveDate || now.slice(0, 10),
          isActive: a.isActive,
          notes: a.notes || null,
        });
      }
    }
  }

  // 3. Process incoming orders
  if (payload.orders && Array.isArray(payload.orders)) {
    for (const o of payload.orders) {
      const [existing] = await db.select().from(schema.orders).where(eq(schema.orders.id, o.id));
      if (!existing) {
        await db.insert(schema.orders).values({
          id: o.id,
          orderNumber: o.orderNumber,
          customerId: o.customerId,
          customerName: o.customerName,
          organizationName: o.organizationName,
          branch: o.branch || null,
          customerPhone: o.customerPhone,
          orderSource: o.orderSource || 'PHONE',
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
          createdBy: o.createdBy || 'Staff',
          updatedAt: o.updatedAt || now,
        });
      } else if (o.updatedAt && (!existing.updatedAt || o.updatedAt > existing.updatedAt)) {
        await db
          .update(schema.orders)
          .set({
            status: o.status,
            deliveryAddress: o.deliveryAddress || null,
            scheduledTime: o.scheduledTime || null,
            actualDeliveryTime: o.actualDeliveryTime || null,
            driverName: o.driverName || null,
            deliveryNotes: o.deliveryNotes || null,
            notes: o.notes || null,
            updatedAt: o.updatedAt,
          })
          .where(eq(schema.orders.id, o.id));
      }
    }
  }

  // 4. Process incoming order items
  if (payload.orderItems && Array.isArray(payload.orderItems)) {
    for (const item of payload.orderItems) {
      const [existing] = await db.select().from(schema.orderItems).where(eq(schema.orderItems.id, item.id));
      if (!existing) {
        await db.insert(schema.orderItems).values({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          productNameEn: item.productNameEn,
          productNameAm: item.productNameAm,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        });
      }
    }
  }

  // 5. Process incoming payments
  if (payload.payments && Array.isArray(payload.payments)) {
    for (const p of payload.payments) {
      const [existing] = await db.select().from(schema.payments).where(eq(schema.payments.id, p.id));
      if (!existing) {
        await db.insert(schema.payments).values({
          id: p.id,
          receiptNumber: p.receiptNumber,
          orderId: p.orderId,
          customerId: p.customerId,
          customerName: p.customerName,
          amount: p.amount,
          paymentMethod: p.paymentMethod,
          transactionReference: p.transactionReference || null,
          verificationStatus: p.verificationStatus,
          verifiedBy: p.verifiedBy || null,
          verifiedAt: p.verifiedAt || null,
          paymentDate: p.paymentDate,
          notes: p.notes || null,
          recordedBy: p.recordedBy || 'Staff',
        });
      } else {
        await db
          .update(schema.payments)
          .set({
            verificationStatus: p.verificationStatus,
            verifiedBy: p.verifiedBy || null,
            verifiedAt: p.verifiedAt || null,
            notes: p.notes || null,
          })
          .where(eq(schema.payments.id, p.id));
      }
    }
  }

  // 6. Process incoming expenses
  if (payload.expenses && Array.isArray(payload.expenses)) {
    for (const e of payload.expenses) {
      const [existing] = await db.select().from(schema.expenses).where(eq(schema.expenses.id, e.id));
      if (!existing) {
        await db.insert(schema.expenses).values({
          id: e.id,
          date: e.date,
          amount: e.amount,
          category: e.category,
          description: e.description,
          paymentMethod: e.paymentMethod,
          referenceNumber: e.referenceNumber || null,
          recordedBy: e.recordedBy || 'Staff',
          notes: e.notes || null,
          expensePeriod: e.expensePeriod || null,
          unit: e.unit || null,
          quantity: e.quantity || null,
          unitPrice: e.unitPrice || null,
        });
      }
    }
  }

  // 7. Process incoming complaints
  if (payload.complaints && Array.isArray(payload.complaints)) {
    for (const c of payload.complaints) {
      const [existing] = await db.select().from(schema.complaints).where(eq(schema.complaints.id, c.id));
      if (!existing) {
        await db.insert(schema.complaints).values({
          id: c.id,
          complaintNumber: c.complaintNumber,
          customerId: c.customerId,
          customerName: c.customerName,
          orderId: c.orderId || null,
          orderNumber: c.orderNumber || null,
          productId: c.productId || null,
          productName: c.productName || null,
          category: c.category,
          description: c.description,
          quantityAffected: c.quantityAffected || null,
          priority: c.priority,
          status: c.status,
          resolutionType: c.resolutionType || null,
          resolutionNotes: c.resolutionNotes || null,
          resolvedAt: c.resolvedAt || null,
          resolvedBy: c.resolvedBy || null,
          createdAt: c.createdAt || now,
        });
      } else {
        await db
          .update(schema.complaints)
          .set({
            status: c.status,
            resolutionType: c.resolutionType || null,
            resolutionNotes: c.resolutionNotes || null,
            resolvedAt: c.resolvedAt || null,
            resolvedBy: c.resolvedBy || null,
          })
          .where(eq(schema.complaints.id, c.id));
      }
    }
  }

  // Retrieve current database state across all tables
  const customers = await customerService.getAllCustomers();
  const products = await productService.getAllProducts();
  const pricingAgreements = await productService.getAllPricingAgreements();
  const fullOrders = await orderService.getAllOrders();
  const payments = await paymentService.getAllPayments();
  const expenses = await expenseService.getAllExpenses();
  const complaints = await complaintService.getAllComplaints();

  const orders = fullOrders.map(({ items, ...o }) => o);
  const orderItems = fullOrders.flatMap((o) => o.items);

  return {
    syncedAt: now,
    customers,
    products,
    pricingAgreements,
    orders,
    orderItems,
    payments,
    expenses,
    complaints,
  };
}
