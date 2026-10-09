/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Payment & Ledger Service
 * Handles multi-channel payments (Cash, Telebirr, CBE Bank Transfer),
 * verification auditing, and customer balance recalculation.
 */

import { db } from '../../db/index.ts';
import * as schema from '../../db/schema.ts';
import { eq, desc, and, ne } from 'drizzle-orm';
import type { Payment } from '../../../types/domain.ts';
import type {
  RecordPaymentDto,
  VerifyPaymentDto,
  VerifyReferenceResultDto,
  ParsedTelebirrResultDto,
} from '../../../types/apiContracts.ts';

export async function getAllPayments(): Promise<Payment[]> {
  const rows = await db.select().from(schema.payments).orderBy(desc(schema.payments.paymentDate));
  return rows.map((r) => ({
    ...r,
    transactionReference: r.transactionReference ?? undefined,
    verifiedBy: r.verifiedBy ?? undefined,
    verifiedAt: r.verifiedAt ?? undefined,
    notes: r.notes ?? undefined,
    paymentMethod: r.paymentMethod as any,
    verificationStatus: r.verificationStatus as any,
  }));
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  const [row] = await db.select().from(schema.payments).where(eq(schema.payments.id, id));
  if (!row) return null;
  return {
    ...row,
    transactionReference: row.transactionReference ?? undefined,
    verifiedBy: row.verifiedBy ?? undefined,
    verifiedAt: row.verifiedAt ?? undefined,
    notes: row.notes ?? undefined,
    paymentMethod: row.paymentMethod as any,
    verificationStatus: row.verificationStatus as any,
  };
}

/**
 * Checks if a transaction reference (e.g. Telebirr code or CBE reference) was already registered
 */
export async function checkDuplicateReference(
  transactionReference: string,
  excludePaymentId?: string
): Promise<VerifyReferenceResultDto> {
  const cleanRef = transactionReference.trim();
  if (!cleanRef) return { isDuplicate: false };

  const [existing] = await db
    .select()
    .from(schema.payments)
    .where(
      excludePaymentId
        ? and(eq(schema.payments.transactionReference, cleanRef), ne(schema.payments.id, excludePaymentId))
        : eq(schema.payments.transactionReference, cleanRef)
    );

  if (!existing) {
    return { isDuplicate: false };
  }

  return {
    isDuplicate: true,
    existingPayment: {
      id: existing.id,
      receiptNumber: existing.receiptNumber,
      customerName: existing.customerName,
      amount: existing.amount,
      paymentDate: existing.paymentDate,
    },
  };
}

/**
 * Intelligent Ethiopian Telebirr SMS text parser
 */
export function parseTelebirrSms(smsText: string): ParsedTelebirrResultDto {
  if (!smsText || typeof smsText !== 'string') {
    return { isValidTelebirrSms: false };
  }

  const text = smsText.trim();

  // Pattern 1: English Telebirr SMS
  // "You have received ETB 1,500.00 from 0911223344 (Abebe). Transaction number: TB26092490812 on..."
  const amountMatch = text.match(/(?:ETB|birr|ብር)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i) ||
                      text.match(/([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:ETB|birr|ብር)/i);
  
  const refMatch = text.match(/(?:transaction\s*(?:number|id|no\.?)|የግብይት\s*ቁጥር)\s*[:\-]?\s*([A-Za-z0-9]+)/i) ||
                   text.match(/\b(TB[0-9A-Za-z]+)\b/i);

  const phoneMatch = text.match(/\b(09[0-9]{8}|07[0-9]{8}|\+2519[0-9]{8}|\+2517[0-9]{8})\b/);

  const nameMatch = text.match(/\(([^)]+)\)/);

  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : undefined;
  const transactionReference = refMatch ? refMatch[1].trim() : undefined;
  const customerPhone = phoneMatch ? phoneMatch[1] : undefined;
  const payerName = nameMatch ? nameMatch[1].trim() : undefined;

  const isValidTelebirrSms = Boolean(amount || transactionReference);

  return {
    transactionReference,
    amount,
    customerPhone,
    payerName,
    isValidTelebirrSms,
  };
}

export async function recordPayment(dto: RecordPaymentDto): Promise<Payment> {
  const now = new Date().toISOString();
  const id = `pay-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const dateStr = now.slice(0, 10).replace(/-/g, '');
  const randSeq = Math.floor(1000 + Math.random() * 9000);
  const receiptNumber = `REC-${dateStr}-${randSeq}`;

  // Duplicate reference validation
  if (dto.transactionReference && dto.transactionReference.trim()) {
    const dupCheck = await checkDuplicateReference(dto.transactionReference);
    if (dupCheck.isDuplicate && dupCheck.existingPayment) {
      throw new Error(
        `Duplicate payment reference "${dto.transactionReference}"! It was already recorded on ${dupCheck.existingPayment.paymentDate} for ${dupCheck.existingPayment.customerName} (${dupCheck.existingPayment.amount} ETB, Receipt #${dupCheck.existingPayment.receiptNumber}).`
      );
    }
  }

  const initialStatus = dto.verificationStatus || (dto.paymentMethod === 'CASH' ? 'VERIFIED' : 'PENDING_VERIFICATION');

  const newPayment: Payment = {
    id,
    receiptNumber,
    orderId: dto.orderId || 'direct-payment',
    customerId: dto.customerId,
    customerName: dto.customerName,
    amount: dto.amount,
    paymentMethod: dto.paymentMethod,
    transactionReference: dto.transactionReference,
    verificationStatus: initialStatus,
    verifiedBy: initialStatus === 'VERIFIED' ? (dto.recordedBy || 'Staff') : undefined,
    verifiedAt: initialStatus === 'VERIFIED' ? now : undefined,
    paymentDate: dto.paymentDate || now,
    notes: dto.notes,
    recordedBy: dto.recordedBy || 'Staff',
  };

  await db.insert(schema.payments).values({
    id: newPayment.id,
    receiptNumber: newPayment.receiptNumber,
    orderId: newPayment.orderId,
    customerId: newPayment.customerId,
    customerName: newPayment.customerName,
    amount: newPayment.amount,
    paymentMethod: newPayment.paymentMethod,
    transactionReference: newPayment.transactionReference || null,
    verificationStatus: newPayment.verificationStatus,
    verifiedBy: newPayment.verifiedBy || null,
    verifiedAt: newPayment.verifiedAt || null,
    paymentDate: newPayment.paymentDate,
    notes: newPayment.notes || null,
    recordedBy: newPayment.recordedBy,
  });

  return newPayment;
}

export async function verifyPayment(id: string, dto: VerifyPaymentDto): Promise<Payment | null> {
  const now = new Date().toISOString();
  await db
    .update(schema.payments)
    .set({
      verificationStatus: 'VERIFIED',
      verifiedBy: dto.verifiedBy,
      verifiedAt: now,
      notes: dto.notes || undefined,
    })
    .where(eq(schema.payments.id, id));

  return getPaymentById(id);
}

export async function rejectPayment(id: string, reason: string): Promise<Payment | null> {
  await db
    .update(schema.payments)
    .set({
      verificationStatus: 'REJECTED',
      notes: reason,
    })
    .where(eq(schema.payments.id, id));

  return getPaymentById(id);
}
