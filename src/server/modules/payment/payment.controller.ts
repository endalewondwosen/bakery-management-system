/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Payment Controller
 */

import type { Request, Response } from 'express';
import * as paymentService from './payment.service.ts';
import { sendSuccess, sendCreated, sendNotFound, sendError, sendServerError } from '../../common/responseHelper.ts';
import type { RecordPaymentDto, VerifyPaymentDto } from '../../../types/apiContracts.ts';

export async function getPayments(req: Request, res: Response) {
  try {
    const payments = await paymentService.getAllPayments();
    return sendSuccess(res, payments);
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function getPayment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPaymentById(id);
    if (!payment) {
      return sendNotFound(res, `Payment with id "${id}"`);
    }
    return sendSuccess(res, payment);
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function recordPayment(req: Request, res: Response) {
  try {
    const body = req.body as RecordPaymentDto;
    if (!body.customerId || !body.customerName || !body.amount || !body.paymentMethod) {
      return sendError(res, 'Missing required fields: customerId, customerName, amount, paymentMethod');
    }
    const payment = await paymentService.recordPayment(body);
    return sendCreated(res, payment, 'Payment recorded successfully');
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function verifyPayment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const body = req.body as VerifyPaymentDto;
    const updated = await paymentService.verifyPayment(id, {
      verifiedBy: body.verifiedBy || 'Auditor',
      notes: body.notes,
    });
    if (!updated) {
      return sendNotFound(res, `Payment with id "${id}"`);
    }
    return sendSuccess(res, updated, 'Payment verified successfully');
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function rejectPayment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const updated = await paymentService.rejectPayment(id, reason || 'Transaction could not be reconciled');
    if (!updated) {
      return sendNotFound(res, `Payment with id "${id}"`);
    }
    return sendSuccess(res, updated, 'Payment rejected');
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function checkDuplicateReference(req: Request, res: Response) {
  try {
    const ref = req.query.ref as string;
    const excludeId = req.query.excludeId as string | undefined;
    if (!ref) {
      return sendError(res, 'Query parameter "ref" is required');
    }
    const result = await paymentService.checkDuplicateReference(ref, excludeId);
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function parseTelebirrSms(req: Request, res: Response) {
  try {
    const { smsText } = req.body;
    if (!smsText) {
      return sendError(res, 'smsText field is required in request body');
    }
    const parsed = paymentService.parseTelebirrSms(smsText);
    return sendSuccess(res, parsed);
  } catch (err: any) {
    return sendServerError(res, err);
  }
}
