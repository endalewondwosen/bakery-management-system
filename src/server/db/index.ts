/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Database connection and initialization manager
 * Powered by LibSQL & Drizzle ORM
 */

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema.ts';
import fs from 'fs';
import path from 'path';

// Ensure data directory exists
const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'bakery.db');
const dbUrl = `file:${dbPath}`;

export const client = createClient({
  url: dbUrl,
});

export const db = drizzle(client, { schema });

/**
 * Initializes database tables and indices idempotently on startup.
 */
export async function initializeDatabase(): Promise<void> {
  // Execute DDL statements
  await client.execute(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      organization_name TEXT NOT NULL,
      branch TEXT,
      customer_type TEXT NOT NULL,
      phone TEXT NOT NULL,
      manager_phone TEXT,
      address TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      notes TEXT,
      preferred_delivery_time TEXT,
      regular_preferences TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
    CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(organization_name);
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name_en TEXT NOT NULL,
      name_am TEXT NOT NULL,
      description_en TEXT,
      description_am TEXT,
      base_price REAL NOT NULL,
      category TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS pricing_agreements (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      agreed_price REAL NOT NULL,
      effective_date TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      notes TEXT
    );
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_agreements_customer ON pricing_agreements(customer_id);
    CREATE INDEX IF NOT EXISTS idx_agreements_product ON pricing_agreements(product_id);
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      customer_id TEXT NOT NULL REFERENCES customers(id),
      customer_name TEXT NOT NULL,
      organization_name TEXT NOT NULL,
      branch TEXT,
      customer_phone TEXT NOT NULL,
      order_source TEXT NOT NULL DEFAULT 'PHONE',
      status TEXT NOT NULL DEFAULT 'PENDING',
      order_date TEXT NOT NULL,
      total_amount REAL NOT NULL DEFAULT 0,
      delivery_type TEXT NOT NULL DEFAULT 'DELIVERY',
      delivery_address TEXT,
      scheduled_time TEXT,
      actual_delivery_time TEXT,
      driver_name TEXT,
      delivery_notes TEXT,
      notes TEXT,
      created_by TEXT NOT NULL DEFAULT 'System',
      updated_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      product_name_en TEXT NOT NULL,
      product_name_am TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL
    );
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_items_product ON order_items(product_id);
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      receipt_number TEXT NOT NULL UNIQUE,
      order_id TEXT NOT NULL,
      customer_id TEXT NOT NULL REFERENCES customers(id),
      customer_name TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      transaction_reference TEXT,
      verification_status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
      verified_by TEXT,
      verified_at TEXT,
      payment_date TEXT NOT NULL,
      notes TEXT,
      recorded_by TEXT NOT NULL DEFAULT 'System'
    );
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
    CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(verification_status);
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'CASH',
      reference_number TEXT,
      recorded_by TEXT NOT NULL DEFAULT 'System',
      notes TEXT,
      expense_period TEXT DEFAULT 'DAILY',
      unit TEXT,
      quantity REAL,
      unit_price REAL
    );
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      complaint_number TEXT NOT NULL UNIQUE,
      customer_id TEXT NOT NULL REFERENCES customers(id),
      customer_name TEXT NOT NULL,
      order_id TEXT,
      order_number TEXT,
      product_id TEXT,
      product_name TEXT,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      quantity_affected INTEGER,
      priority TEXT NOT NULL DEFAULT 'MEDIUM',
      status TEXT NOT NULL DEFAULT 'OPEN',
      resolution_type TEXT,
      resolution_notes TEXT,
      resolved_by TEXT,
      resolved_at TEXT,
      created_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_complaints_customer ON complaints(customer_id);
    CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
  `);
}
