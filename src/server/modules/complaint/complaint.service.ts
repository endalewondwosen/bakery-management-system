/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Customer Complaints & Quality Feedback Service
 */

import { db } from '../../db/index.ts';
import * as schema from '../../db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import type { Complaint } from '../../../types/domain.ts';
import type { CreateComplaintDto, ResolveComplaintDto, UpdateComplaintDto } from '../../../types/apiContracts.ts';

export async function getAllComplaints(): Promise<Complaint[]> {
  const rows = await db.select().from(schema.complaints).orderBy(desc(schema.complaints.createdAt));
  return rows.map((r) => ({
    ...r,
    orderId: r.orderId ?? undefined,
    orderNumber: r.orderNumber ?? undefined,
    productId: r.productId ?? undefined,
    productName: r.productName ?? undefined,
    quantityAffected: r.quantityAffected ?? undefined,
    resolutionType: (r.resolutionType as any) ?? undefined,
    resolutionNotes: r.resolutionNotes ?? undefined,
    resolvedAt: r.resolvedAt ?? undefined,
    resolvedBy: r.resolvedBy ?? undefined,
    category: r.category as any,
    priority: r.priority as any,
    status: r.status as any,
  }));
}

export async function getComplaintById(id: string): Promise<Complaint | null> {
  const [row] = await db.select().from(schema.complaints).where(eq(schema.complaints.id, id));
  if (!row) return null;
  return {
    ...row,
    orderId: row.orderId ?? undefined,
    orderNumber: row.orderNumber ?? undefined,
    productId: row.productId ?? undefined,
    productName: row.productName ?? undefined,
    quantityAffected: row.quantityAffected ?? undefined,
    resolutionType: (row.resolutionType as any) ?? undefined,
    resolutionNotes: row.resolutionNotes ?? undefined,
    resolvedAt: row.resolvedAt ?? undefined,
    resolvedBy: row.resolvedBy ?? undefined,
    category: row.category as any,
    priority: row.priority as any,
    status: row.status as any,
  };
}

export async function createComplaint(dto: CreateComplaintDto): Promise<Complaint> {
  const now = new Date().toISOString();
  const id = dto.id?.trim() || `cmp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const dateStr = now.slice(0, 10).replace(/-/g, '');
  const randSeq = Math.floor(100 + Math.random() * 900);
  const complaintNumber = dto.complaintNumber?.trim() || `CMP-${dateStr}-${randSeq}`;

  // Idempotency: if complaint already exists by ID or complaintNumber, return existing
  const [existingById] = await db.select().from(schema.complaints).where(eq(schema.complaints.id, id));
  if (existingById) {
    return {
      ...existingById,
      orderId: existingById.orderId ?? undefined,
      orderNumber: existingById.orderNumber ?? undefined,
      productId: existingById.productId ?? undefined,
      productName: existingById.productName ?? undefined,
      quantityAffected: existingById.quantityAffected ?? undefined,
      resolutionType: (existingById.resolutionType as any) ?? undefined,
      resolutionNotes: existingById.resolutionNotes ?? undefined,
      resolvedAt: existingById.resolvedAt ?? undefined,
      resolvedBy: existingById.resolvedBy ?? undefined,
      category: existingById.category as any,
      priority: existingById.priority as any,
      status: existingById.status as any,
    };
  }

  const newComplaint: Complaint = {
    id,
    complaintNumber,
    customerId: dto.customerId,
    customerName: dto.customerName,
    orderId: dto.orderId,
    orderNumber: dto.orderNumber,
    productId: dto.productId,
    productName: dto.productName,
    category: dto.category,
    description: dto.description,
    quantityAffected: dto.quantityAffected,
    priority: dto.priority,
    status: 'OPEN',
    createdAt: now,
  };

  await db.insert(schema.complaints).values({
    id: newComplaint.id,
    complaintNumber: newComplaint.complaintNumber,
    customerId: newComplaint.customerId,
    customerName: newComplaint.customerName,
    orderId: newComplaint.orderId || null,
    orderNumber: newComplaint.orderNumber || null,
    productId: newComplaint.productId || null,
    productName: newComplaint.productName || null,
    category: newComplaint.category,
    description: newComplaint.description,
    quantityAffected: newComplaint.quantityAffected || null,
    priority: newComplaint.priority,
    status: newComplaint.status,
    createdAt: newComplaint.createdAt,
  });

  return newComplaint;
}

export async function resolveComplaint(id: string, dto: ResolveComplaintDto): Promise<Complaint | null> {
  const now = new Date().toISOString();
  await db
    .update(schema.complaints)
    .set({
      status: dto.status,
      resolutionType: dto.resolutionType || 'EXPLANATION',
      resolutionNotes: dto.resolutionNotes,
      resolvedBy: dto.resolvedBy,
      resolvedAt: now,
    })
    .where(eq(schema.complaints.id, id));

  return getComplaintById(id);
}

export async function updateComplaint(id: string, dto: UpdateComplaintDto): Promise<Complaint | null> {
  const existing = await getComplaintById(id);
  if (!existing) return null;

  const updateValues: Record<string, any> = {};
  if (dto.category !== undefined) updateValues.category = dto.category;
  if (dto.description !== undefined) updateValues.description = dto.description;
  if (dto.quantityAffected !== undefined) updateValues.quantityAffected = dto.quantityAffected;
  if (dto.priority !== undefined) updateValues.priority = dto.priority;
  if (dto.status !== undefined) updateValues.status = dto.status;
  if (dto.resolutionType !== undefined) updateValues.resolutionType = dto.resolutionType;
  if (dto.resolutionNotes !== undefined) updateValues.resolutionNotes = dto.resolutionNotes;

  await db.update(schema.complaints).set(updateValues).where(eq(schema.complaints.id, id));
  return getComplaintById(id);
}

export async function deleteComplaint(id: string): Promise<boolean> {
  const existing = await getComplaintById(id);
  if (!existing) return false;
  await db.delete(schema.complaints).where(eq(schema.complaints.id, id));
  return true;
}

