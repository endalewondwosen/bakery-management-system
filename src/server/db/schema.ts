/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Database Schema for Bakery Management System
 * Built with Drizzle ORM for SQLite / LibSQL
 * 
 * Features:
 * - Clean domain entities with strict typing
 * - Foreign keys & relational mapping
 * - ISO-8601 text timestamps for consistent cross-platform querying
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// 1. CUSTOMERS TABLE
// ============================================================================
export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  organizationName: text('organization_name').notNull(),
  branch: text('branch'),
  customerType: text('customer_type').notNull(), // RESTAURANT, CAFE, BURGER_HOUSE, SHOP, HOTEL, OTHER
  phone: text('phone').notNull(),
  managerPhone: text('manager_phone'),
  address: text('address').notNull(),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, INACTIVE
  notes: text('notes'),
  preferredDeliveryTime: text('preferred_delivery_time'),
  regularPreferences: text('regular_preferences'), // JSON serialized CustomerPreference[]
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [
  index('idx_customers_phone').on(table.phone),
  index('idx_customers_status').on(table.status),
  index('idx_customers_org').on(table.organizationName),
]);

// ============================================================================
// 2. PRODUCTS TABLE
// ============================================================================
export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  nameEn: text('name_en').notNull(),
  nameAm: text('name_am').notNull(),
  descriptionEn: text('description_en'),
  descriptionAm: text('description_am'),
  basePrice: real('base_price').notNull(),
  category: text('category').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('idx_products_category').on(table.category),
  index('idx_products_active').on(table.isActive),
]);

// ============================================================================
// 3. CUSTOMER PRICING AGREEMENTS TABLE (B2B Price Customization)
// ============================================================================
export const pricingAgreements = sqliteTable('pricing_agreements', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  agreedPrice: real('agreed_price').notNull(),
  effectiveDate: text('effective_date').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  notes: text('notes'),
}, (table) => [
  index('idx_agreements_customer').on(table.customerId),
  index('idx_agreements_product').on(table.productId),
]);

// ============================================================================
// 4. ORDERS TABLE
// ============================================================================
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  customerId: text('customer_id').notNull().references(() => customers.id),
  customerName: text('customer_name').notNull(),
  organizationName: text('organization_name').notNull(),
  branch: text('branch'),
  customerPhone: text('customer_phone').notNull(),
  orderSource: text('order_source').notNull().default('PHONE'), // PHONE, WALK_IN, TELEGRAM, etc.
  status: text('status').notNull().default('PENDING'), // PENDING, CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
  orderDate: text('order_date').notNull(),
  totalAmount: real('total_amount').notNull().default(0),
  deliveryType: text('delivery_type').notNull().default('DELIVERY'), // DELIVERY, PICKUP
  deliveryAddress: text('delivery_address'),
  scheduledTime: text('scheduled_time'),
  actualDeliveryTime: text('actual_delivery_time'),
  driverName: text('driver_name'),
  deliveryNotes: text('delivery_notes'),
  notes: text('notes'),
  createdBy: text('created_by').notNull().default('System'),
  updatedAt: text('updated_at').notNull(),
}, (table) => [
  index('idx_orders_customer').on(table.customerId),
  index('idx_orders_status').on(table.status),
  index('idx_orders_date').on(table.orderDate),
]);

// ============================================================================
// 5. ORDER ITEMS TABLE (Line Items with Historical Price Preservation)
// ============================================================================
export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id),
  productNameEn: text('product_name_en').notNull(),
  productNameAm: text('product_name_am').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  subtotal: real('subtotal').notNull(),
}, (table) => [
  index('idx_items_order').on(table.orderId),
  index('idx_items_product').on(table.productId),
]);

// ============================================================================
// 6. PAYMENTS TABLE (With Ethiopian Telebirr / Bank Verification Flow)
// ============================================================================
export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  receiptNumber: text('receipt_number').notNull().unique(),
  orderId: text('order_id').notNull(),
  customerId: text('customer_id').notNull().references(() => customers.id),
  customerName: text('customer_name').notNull(),
  amount: real('amount').notNull(),
  paymentMethod: text('payment_method').notNull(), // CASH, TELEBIRR, BANK_TRANSFER, OTHER
  transactionReference: text('transaction_reference'),
  verificationStatus: text('verification_status').notNull().default('PENDING_VERIFICATION'), // VERIFIED, PENDING_VERIFICATION, REJECTED
  verifiedBy: text('verified_by'),
  verifiedAt: text('verified_at'),
  paymentDate: text('payment_date').notNull(),
  notes: text('notes'),
  recordedBy: text('recorded_by').notNull().default('System'),
}, (table) => [
  index('idx_payments_order').on(table.orderId),
  index('idx_payments_customer').on(table.customerId),
  index('idx_payments_date').on(table.paymentDate),
  index('idx_payments_status').on(table.verificationStatus),
]);

// ============================================================================
// 7. EXPENSES TABLE (Cost of Goods & Operational Overhead Tracking)
// ============================================================================
export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  amount: real('amount').notNull(),
  category: text('category').notNull(), // RAW_FLOUR, RAW_EGGS, TRANSPORT_FUEL, etc.
  description: text('description').notNull(),
  paymentMethod: text('payment_method').notNull().default('CASH'),
  referenceNumber: text('reference_number'),
  recordedBy: text('recorded_by').notNull().default('System'),
  notes: text('notes'),
  expensePeriod: text('expense_period').default('DAILY'), // DAILY, MONTHLY, YEARLY
  unit: text('unit'), // QUINTAL, KG, LITER, CRATE, PIECE, etc.
  quantity: real('quantity'),
  unitPrice: real('unit_price'),
}, (table) => [
  index('idx_expenses_date').on(table.date),
  index('idx_expenses_category').on(table.category),
]);

// ============================================================================
// 8. COMPLAINTS TABLE (Customer Feedback & Quality Assurance)
// ============================================================================
export const complaints = sqliteTable('complaints', {
  id: text('id').primaryKey(),
  complaintNumber: text('complaint_number').notNull().unique(),
  customerId: text('customer_id').notNull().references(() => customers.id),
  customerName: text('customer_name').notNull(),
  orderId: text('order_id'),
  orderNumber: text('order_number'),
  productId: text('product_id'),
  productName: text('product_name'),
  category: text('category').notNull(),
  description: text('description').notNull(),
  quantityAffected: integer('quantity_affected'),
  priority: text('priority').notNull().default('MEDIUM'), // LOW, MEDIUM, HIGH, URGENT
  status: text('status').notNull().default('OPEN'), // OPEN, UNDER_REVIEW, ACTION_TAKEN, RESOLVED, CLOSED
  resolutionType: text('resolution_type'),
  resolutionNotes: text('resolution_notes'),
  resolvedBy: text('resolved_by'),
  resolvedAt: text('resolved_at'),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('idx_complaints_customer').on(table.customerId),
  index('idx_complaints_status').on(table.status),
]);

// ============================================================================
// 9. DRIZZLE RELATIONS (For ergonomic and type-safe query joins)
// ============================================================================
export const customerRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  payments: many(payments),
  pricingAgreements: many(pricingAgreements),
  complaints: many(complaints),
}));

export const productRelations = relations(products, ({ many }) => ({
  pricingAgreements: many(pricingAgreements),
  orderItems: many(orderItems),
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const paymentRelations = relations(payments, ({ one }) => ({
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),
}));

export const complaintRelations = relations(complaints, ({ one }) => ({
  customer: one(customers, {
    fields: [complaints.customerId],
    references: [customers.id],
  }),
}));
