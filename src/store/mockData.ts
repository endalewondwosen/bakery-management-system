/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  Customer,
  CustomerPricingAgreement,
  Product,
  Order,
  OrderItem,
  Payment,
  Expense,
  Complaint
} from '../types/domain.ts';

// Standard bakery product catalog
export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    nameEn: 'Burger Bread With Egg',
    nameAm: 'እንቁላል የተቀባ',
    descriptionEn: 'Golden glazed soft bun with egg wash finish',
    descriptionAm: 'ለስላሳ በእንቁላል የተቀባ የበርገር ዳቦ',
    basePrice: 25,
    category: 'Burger Bread',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'prod-2',
    nameEn: 'Burger Bread Without Egg',
    nameAm: 'እንቁላል ያልተቀባ',
    descriptionEn: 'Standard burger bun without egg wash',
    descriptionAm: 'እንቁላል ያልተቀባ መደበኛ የበርገር ዳቦ',
    basePrice: 22,
    category: 'Burger Bread',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'prod-3',
    nameEn: 'Normal Bread',
    nameAm: 'መደበኛ ዳቦ',
    descriptionEn: 'Traditional daily table bread loaf',
    descriptionAm: 'የዕለት መደበኛ የጠረጴዛ ዳቦ',
    basePrice: 15,
    category: 'Table Bread',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'prod-4',
    nameEn: 'Feta Bread',
    nameAm: 'ፈታ ዳቦ',
    descriptionEn: 'Artisanal loaf baked with savory feta cheese filling',
    descriptionAm: 'በጣፋጭ ፈታ አይብ የተዘጋጀ ልዩ ዳቦ',
    basePrice: 35,
    category: 'Specialty Bread',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'prod-5',
    nameEn: 'Sesame Bun',
    nameAm: 'ሰሊጥ ያለበት ዳቦ',
    descriptionEn: 'Aromatic burger bun topped with roasted sesame',
    descriptionAm: 'በጥብስ ሰሊጥ ያጌጠ ለስላሳ ዳቦ',
    basePrice: 28,
    category: 'Burger Bread',
    isActive: true,
    createdAt: '2026-02-15T00:00:00Z',
  },
];

// Clean slate: empty transactional lists ready for real bakery operations
export const initialCustomers: Customer[] = [];
export const initialPricingAgreements: CustomerPricingAgreement[] = [];
export const initialOrders: Order[] = [];
export const initialOrderItems: OrderItem[] = [];
export const initialPayments: Payment[] = [];
export const initialExpenses: Expense[] = [];
export const initialComplaints: Complaint[] = [];
