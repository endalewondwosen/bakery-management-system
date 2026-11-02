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
import { recordTombstone, getAllDeletedEntityIds } from '../../common/tombstones.ts';
import type { SyncPayloadDto, SyncResponseDto } from '../../../types/apiContracts.ts';

export async function processSync(payload: SyncPayloadDto): Promise<SyncResponseDto> {
  const now = new Date().toISOString();

  // 0. Ingest any deletions reported by the client
  if (payload.deletedIds) {
    if (payload.deletedIds.customers && Array.isArray(payload.deletedIds.customers)) {
      for (const id of payload.deletedIds.customers) {
        await customerService.deleteCustomer(id);
      }
    }
    if (payload.deletedIds.orders && Array.isArray(payload.deletedIds.orders)) {
      for (const id of payload.deletedIds.orders) {
        await orderService.deleteOrder(id);
      }
    }
    if (payload.deletedIds.expenses && Array.isArray(payload.deletedIds.expenses)) {
      for (const id of payload.deletedIds.expenses) {
        await expenseService.deleteExpense(id);
      }
    }
    if (payload.deletedIds.complaints && Array.isArray(payload.deletedIds.complaints)) {
      for (const id of payload.deletedIds.complaints) {
        await complaintService.deleteComplaint(id);
      }
    }
    if (payload.deletedIds.products && Array.isArray(payload.deletedIds.products)) {
      for (const id of payload.deletedIds.products) {
        await productService.deleteProduct(id);
      }
    }
    if (payload.deletedIds.pricingAgreements && Array.isArray(payload.deletedIds.pricingAgreements)) {
      for (const id of payload.deletedIds.pricingAgreements) {
        await productService.deletePricingAgreement(id);
      }
    }
  }

  // Load canonical tombstones to protect against zombie resurrection
  const tombstones = await getAllDeletedEntityIds();
  const deletedCustomerIds = new Set(tombstones.customers);
  const deletedOrderIds = new Set(tombstones.orders);
  const deletedExpenseIds = new Set(tombstones.expenses);
  const deletedComplaintIds = new Set(tombstones.complaints);
  const deletedProductIds = new Set(tombstones.products);
  const deletedAgreementIds = new Set(tombstones.pricingAgreements);

  // 1. Process incoming customer updates / creations
  if (payload.customers && Array.isArray(payload.customers)) {
    for (const c of payload.customers) {
      // If customer has been explicitly deleted, NEVER resurrect
      if (deletedCustomerIds.has(c.id)) {
        continue;
      }

      let [existing] = await db.select().from(schema.customers).where(eq(schema.customers.id, c.id));
      if (!existing && c.phone && c.phone !== '-') {
        const matches = await db.select().from(schema.customers).where(eq(schema.customers.phone, c.phone.trim()));
        const cleanOrg = (c.organizationName || '').trim().toLowerCase();
        existing = matches.find((m) => m.organizationName.trim().toLowerCase() === cleanOrg) as typeof existing;
      }

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
          .where(eq(schema.customers.id, existing.id));
      }
    }
  }

  // 1.5. Process incoming product updates / creations
  if (payload.products && Array.isArray(payload.products)) {
    for (const p of payload.products) {
      if (deletedProductIds.has(p.id)) {
        continue;
      }
      let [existing] = await db.select().from(schema.products).where(eq(schema.products.id, p.id));
      if (!existing && p.nameEn) {
        const matches = await db.select().from(schema.products).where(eq(schema.products.nameEn, p.nameEn.trim()));
        existing = matches[0] as typeof existing;
      }

      if (!existing) {
        await db.insert(schema.products).values({
          id: p.id,
          nameEn: p.nameEn,
          nameAm: p.nameAm,
          descriptionEn: p.descriptionEn || null,
          descriptionAm: p.descriptionAm || null,
          basePrice: p.basePrice,
          category: p.category,
          isActive: p.isActive,
          createdAt: p.createdAt || now,
          updatedAt: p.updatedAt || now,
        });
      } else if (
        (p.updatedAt && (!existing.updatedAt || p.updatedAt > existing.updatedAt)) ||
        (p.basePrice !== undefined && p.basePrice !== existing.basePrice)
      ) {
        await db
          .update(schema.products)
          .set({
            nameEn: p.nameEn || existing.nameEn,
            nameAm: p.nameAm || existing.nameAm,
            descriptionEn: p.descriptionEn !== undefined ? (p.descriptionEn || null) : existing.descriptionEn,
            descriptionAm: p.descriptionAm !== undefined ? (p.descriptionAm || null) : existing.descriptionAm,
            basePrice: p.basePrice !== undefined ? p.basePrice : existing.basePrice,
            category: p.category || existing.category,
            isActive: p.isActive !== undefined ? p.isActive : existing.isActive,
            updatedAt: p.updatedAt || now,
          })
          .where(eq(schema.products.id, existing.id));
      }
    }
  }

  // 2. Process incoming pricing agreements
  if (payload.pricingAgreements && Array.isArray(payload.pricingAgreements)) {
    for (const a of payload.pricingAgreements) {
      if (deletedAgreementIds.has(a.id) || deletedCustomerIds.has(a.customerId) || deletedProductIds.has(a.productId)) {
        continue;
      }
      let [existing] = await db.select().from(schema.pricingAgreements).where(eq(schema.pricingAgreements.id, a.id));
      if (!existing) {
        const matches = await db.select().from(schema.pricingAgreements).where(eq(schema.pricingAgreements.customerId, a.customerId));
        existing = matches.find((m) => m.productId === a.productId) as typeof existing;
      }

      if (!existing) {
        await db.insert(schema.pricingAgreements).values({
          id: a.id,
          customerId: a.customerId,
          productId: a.productId,
          agreedPrice: a.agreedPrice,
          effectiveDate: a.effectiveDate || now.slice(0, 10),
          isActive: a.isActive,
          notes: a.notes || null,
          updatedAt: a.updatedAt || now,
        });
      } else if (
        (a.updatedAt && (!existing.updatedAt || a.updatedAt > existing.updatedAt)) ||
        (a.agreedPrice !== undefined && a.agreedPrice !== existing.agreedPrice)
      ) {
        await db
          .update(schema.pricingAgreements)
          .set({
            agreedPrice: a.agreedPrice,
            effectiveDate: a.effectiveDate || existing.effectiveDate,
            isActive: a.isActive !== undefined ? a.isActive : existing.isActive,
            notes: a.notes !== undefined ? a.notes : existing.notes,
            updatedAt: a.updatedAt || now,
          })
          .where(eq(schema.pricingAgreements.id, existing.id));
      }
    }
  }

  // 3. Process incoming orders
  if (payload.orders && Array.isArray(payload.orders)) {
    for (const o of payload.orders) {
      if (deletedOrderIds.has(o.id) || deletedCustomerIds.has(o.customerId)) {
        continue;
      }
      let [existing] = await db.select().from(schema.orders).where(eq(schema.orders.id, o.id));
      if (!existing && o.orderNumber) {
        const [byNum] = await db.select().from(schema.orders).where(eq(schema.orders.orderNumber, o.orderNumber.trim()));
        existing = byNum as typeof existing;
      }

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
          .where(eq(schema.orders.id, existing.id));
      }
    }
  }

  // 4. Process incoming order items
  if (payload.orderItems && Array.isArray(payload.orderItems)) {
    for (const item of payload.orderItems) {
      if (deletedOrderIds.has(item.orderId)) {
        continue;
      }
      let [existing] = await db.select().from(schema.orderItems).where(eq(schema.orderItems.id, item.id));
      if (!existing) {
        const matches = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, item.orderId));
        existing = matches.find((m) => m.productId === item.productId) as typeof existing;
      }

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
      if (deletedCustomerIds.has(p.customerId) || (p.orderId && deletedOrderIds.has(p.orderId))) {
        continue;
      }
      let [existing] = await db.select().from(schema.payments).where(eq(schema.payments.id, p.id));
      if (!existing && p.receiptNumber) {
        const [byRec] = await db.select().from(schema.payments).where(eq(schema.payments.receiptNumber, p.receiptNumber.trim()));
        existing = byRec as typeof existing;
      }

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
          .where(eq(schema.payments.id, existing.id));
      }
    }
  }

  // 6. Process incoming expenses
  if (payload.expenses && Array.isArray(payload.expenses)) {
    for (const e of payload.expenses) {
      if (deletedExpenseIds.has(e.id)) {
        continue;
      }
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
      if (deletedComplaintIds.has(c.id) || deletedCustomerIds.has(c.customerId)) {
        continue;
      }
      let [existing] = await db.select().from(schema.complaints).where(eq(schema.complaints.id, c.id));
      if (!existing && c.complaintNumber) {
        const [byNum] = await db.select().from(schema.complaints).where(eq(schema.complaints.complaintNumber, c.complaintNumber.trim()));
        existing = byNum as typeof existing;
      }

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
          .where(eq(schema.complaints.id, existing.id));
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
    deletedIds: tombstones as any,
  };
}
