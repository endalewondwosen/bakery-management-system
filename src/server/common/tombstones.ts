/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Tombstone Management Service
 * Records deleted entities to prevent zombie resurrections during distributed offline sync.
 */

import { db } from '../db/index.ts';
import * as schema from '../db/schema.ts';
import { eq, inArray } from 'drizzle-orm';

export type TombstoneEntityType = 'CUSTOMER' | 'ORDER' | 'EXPENSE' | 'COMPLAINT' | 'PRODUCT' | 'PRICING_AGREEMENT';

/**
 * Persists a deletion tombstone so any device attempting to sync this record will skip it.
 */
export async function recordTombstone(entityType: TombstoneEntityType, entityId: string): Promise<void> {
  if (!entityId) return;
  const now = new Date().toISOString();
  const id = `del-${entityType.toLowerCase()}-${entityId}`;

  try {
    const [existing] = await db.select().from(schema.deletedRecords).where(eq(schema.deletedRecords.id, id));
    if (!existing) {
      await db.insert(schema.deletedRecords).values({
        id,
        entityType,
        entityId,
        deletedAt: now,
      });
    }
  } catch (err) {
    console.warn(`[Tombstone] Failed to record deletion for ${entityType} ${entityId}:`, err);
  }
}

/**
 * Returns a set of all deleted entity IDs for a specific entity type.
 */
export async function getDeletedEntityIds(entityType: TombstoneEntityType): Promise<Set<string>> {
  try {
    const rows = await db
      .select({ entityId: schema.deletedRecords.entityId })
      .from(schema.deletedRecords)
      .where(eq(schema.deletedRecords.entityType, entityType));
    return new Set(rows.map((r) => r.entityId));
  } catch (err) {
    console.warn(`[Tombstone] Failed to fetch deleted IDs for ${entityType}:`, err);
    return new Set();
  }
}

/**
 * Returns all deleted entity IDs grouped by type.
 */
export async function getAllDeletedEntityIds(): Promise<Record<string, string[]>> {
  try {
    const rows = await db.select().from(schema.deletedRecords);
    const result: Record<string, string[]> = {
      customers: [],
      orders: [],
      expenses: [],
      complaints: [],
      products: [],
      pricingAgreements: [],
    };

    for (const r of rows) {
      if (r.entityType === 'CUSTOMER') result.customers.push(r.entityId);
      else if (r.entityType === 'ORDER') result.orders.push(r.entityId);
      else if (r.entityType === 'EXPENSE') result.expenses.push(r.entityId);
      else if (r.entityType === 'COMPLAINT') result.complaints.push(r.entityId);
      else if (r.entityType === 'PRODUCT') result.products.push(r.entityId);
      else if (r.entityType === 'PRICING_AGREEMENT') result.pricingAgreements.push(r.entityId);
    }

    return result;
  } catch (err) {
    console.warn('[Tombstone] Failed to fetch all deleted IDs:', err);
    return {
      customers: [],
      orders: [],
      expenses: [],
      complaints: [],
      products: [],
      pricingAgreements: [],
    };
  }
}
