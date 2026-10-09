/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Payment Routes Definition
 */

import { Router } from 'express';
import * as paymentController from './payment.controller.ts';

export const paymentRouter = Router();

// GET /api/payments
paymentRouter.get('/', paymentController.getPayments);

// GET /api/payments/verify-ref (before /:id)
paymentRouter.get('/verify-ref', paymentController.checkDuplicateReference);

// POST /api/payments/parse-telebirr
paymentRouter.post('/parse-telebirr', paymentController.parseTelebirrSms);

// GET /api/payments/:id
paymentRouter.get('/:id', paymentController.getPayment);

// POST /api/payments
paymentRouter.post('/', paymentController.recordPayment);

// POST or PATCH /api/payments/:id/verify
paymentRouter.post('/:id/verify', paymentController.verifyPayment);
paymentRouter.patch('/:id/verify', paymentController.verifyPayment);

// POST or PATCH /api/payments/:id/reject
paymentRouter.post('/:id/reject', paymentController.rejectPayment);
paymentRouter.patch('/:id/reject', paymentController.rejectPayment);
