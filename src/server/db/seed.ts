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

export const initialExpenseCategories = [
  { id: 'cat-raw-flour', code: 'RAW_FLOUR', name: 'Flour (ዱቄት)', isSystem: true },
  { id: 'cat-raw-eggs', code: 'RAW_EGGS', name: 'Eggs (እንቁላል)', isSystem: true },
  { id: 'cat-raw-cheese', code: 'RAW_CHEESE_FETA', name: 'Cheese / Feta (አይብ)', isSystem: true },
  { id: 'cat-raw-sugar-oil', code: 'RAW_SUGAR_OIL', name: 'Sugar & Oil (ስኳርና ዘይት)', isSystem: true },
  { id: 'cat-packaging', code: 'PACKAGING', name: 'Packaging & Bags (ማሸጊያ ፌስታል)', isSystem: true },
  { id: 'cat-transport-fuel', code: 'TRANSPORT_FUEL', name: 'Fuel & Transport (ነዳጅና ትራንስፖርት)', isSystem: true },
  { id: 'cat-utilities', code: 'UTILITIES', name: 'Utilities - Electric & Water (የውሃና መብራት)', isSystem: true },
  { id: 'cat-rent', code: 'RENT', name: 'Bakery Premises Rent (የህንፃ ኪራይ)', isSystem: true },
  { id: 'cat-salaries', code: 'SALARIES', name: 'Staff Salaries (የሰራተኞች ደመወዝ)', isSystem: true },
  { id: 'cat-maintenance', code: 'MAINTENANCE', name: 'Machinery Maintenance (ጥገና)', isSystem: true },
  { id: 'cat-other', code: 'OTHER', name: 'Other / Miscellaneous (ልዩ ልዩ)', isSystem: true },
];

export async function seedDatabaseIfEmpty(): Promise<void> {
  const [productCount] = await db.select({ val: count() }).from(schema.products);
  if (!productCount || productCount.val === 0) {
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

  // Seed standard expense categories
  const [categoryCount] = await db.select({ val: count() }).from(schema.expenseCategories);
  if (!categoryCount || categoryCount.val === 0) {
    const now = new Date().toISOString();
    for (const cat of initialExpenseCategories) {
      await db.insert(schema.expenseCategories).values({
        id: cat.id,
        code: cat.code,
        name: cat.name,
        isSystem: cat.isSystem,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing();
    }
  }
}
