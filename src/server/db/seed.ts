/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Database Seeder for Initial Bakery Records
 * Seeds the initial bakery bread catalog if empty.
 */

import { db } from './index.ts';
import * as schema from './schema.ts';
import { count } from 'drizzle-orm';
import { initialProducts } from '../../store/mockData.ts';

export async function seedDatabaseIfEmpty(): Promise<void> {
  const [productCount] = await db.select({ val: count() }).from(schema.products);
  if (productCount && productCount.val > 0) {
    // Products already seeded
    return;
  }

  // Seed standard bakery products catalog
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
}
