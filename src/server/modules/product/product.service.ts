/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Product & Pricing Agreement Service
 * Handles catalog items and wholesale customized pricing contracts.
 */

import { db } from '../../db/index.ts';
import * as schema from '../../db/schema.ts';
import { eq, and } from 'drizzle-orm';
import type { Product, CustomerPricingAgreement } from '../../../types/domain.ts';
import type { CreateProductDto, UpdateProductDto, SetPricingAgreementDto } from '../../../types/apiContracts.ts';

export async function getAllProducts(): Promise<Product[]> {
  const rows = await db.select().from(schema.products).orderBy(schema.products.nameEn);
  return rows.map((r) => ({
    ...r,
    descriptionEn: r.descriptionEn ?? undefined,
    descriptionAm: r.descriptionAm ?? undefined,
    isActive: Boolean(r.isActive),
  }));
}

export async function getProductById(id: string): Promise<Product | null> {
  const [row] = await db.select().from(schema.products).where(eq(schema.products.id, id));
  if (!row) return null;
  return {
    ...row,
    descriptionEn: row.descriptionEn ?? undefined,
    descriptionAm: row.descriptionAm ?? undefined,
    isActive: Boolean(row.isActive),
  };
}

export async function createProduct(dto: CreateProductDto): Promise<Product> {
  const now = new Date().toISOString();
  const id = `prod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  const newProduct: Product = {
    ...dto,
    id,
    createdAt: now,
  };

  await db.insert(schema.products).values({
    id: newProduct.id,
    nameEn: newProduct.nameEn,
    nameAm: newProduct.nameAm,
    descriptionEn: newProduct.descriptionEn || null,
    descriptionAm: newProduct.descriptionAm || null,
    basePrice: newProduct.basePrice,
    category: newProduct.category,
    isActive: newProduct.isActive,
    createdAt: newProduct.createdAt,
  });

  return newProduct;
}

export async function updateProduct(id: string, patch: UpdateProductDto): Promise<Product | null> {
  const updateValues: Record<string, any> = {};

  if (patch.nameEn !== undefined) updateValues.nameEn = patch.nameEn;
  if (patch.nameAm !== undefined) updateValues.nameAm = patch.nameAm;
  if (patch.descriptionEn !== undefined) updateValues.descriptionEn = patch.descriptionEn;
  if (patch.descriptionAm !== undefined) updateValues.descriptionAm = patch.descriptionAm;
  if (patch.basePrice !== undefined) updateValues.basePrice = patch.basePrice;
  if (patch.category !== undefined) updateValues.category = patch.category;
  if (patch.isActive !== undefined) updateValues.isActive = patch.isActive;

  await db.update(schema.products).set(updateValues).where(eq(schema.products.id, id));
  return getProductById(id);
}

export async function getAllPricingAgreements(): Promise<CustomerPricingAgreement[]> {
  const rows = await db.select().from(schema.pricingAgreements);
  return rows.map((r) => ({
    ...r,
    notes: r.notes ?? undefined,
    isActive: Boolean(r.isActive),
  }));
}

export async function setCustomerPricingAgreement(dto: SetPricingAgreementDto): Promise<CustomerPricingAgreement> {
  const { customerId, productId, agreedPrice, notes, effectiveDate, isActive } = dto;
  const now = new Date().toISOString().slice(0, 10);

  const [existing] = await db
    .select()
    .from(schema.pricingAgreements)
    .where(and(eq(schema.pricingAgreements.customerId, customerId), eq(schema.pricingAgreements.productId, productId)));

  if (existing) {
    await db
      .update(schema.pricingAgreements)
      .set({
        agreedPrice,
        effectiveDate: effectiveDate || existing.effectiveDate,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        notes: notes !== undefined ? notes : existing.notes,
      })
      .where(eq(schema.pricingAgreements.id, existing.id));

    return {
      id: existing.id,
      customerId,
      productId,
      agreedPrice,
      effectiveDate: effectiveDate || existing.effectiveDate,
      isActive: isActive !== undefined ? isActive : Boolean(existing.isActive),
      notes: notes !== undefined ? notes : (existing.notes ?? undefined),
    };
  }

  const id = `agr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const newAgreement: CustomerPricingAgreement = {
    id,
    customerId,
    productId,
    agreedPrice,
    effectiveDate: effectiveDate || now,
    isActive: isActive !== undefined ? isActive : true,
    notes,
  };

  await db.insert(schema.pricingAgreements).values({
    id: newAgreement.id,
    customerId: newAgreement.customerId,
    productId: newAgreement.productId,
    agreedPrice: newAgreement.agreedPrice,
    effectiveDate: newAgreement.effectiveDate,
    isActive: newAgreement.isActive,
    notes: newAgreement.notes || null,
  });

  return newAgreement;
}
