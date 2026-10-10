/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Modular API Router Entry Point
 * Aggregates all domain module routers (Customers, Products, Orders, Payments, Expenses, Complaints, Analytics, Sync).
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { customerRouter } from '../modules/customer/customer.routes.ts';
import { productRouter } from '../modules/product/product.routes.ts';
import { orderRouter } from '../modules/order/order.routes.ts';
import { paymentRouter } from '../modules/payment/payment.routes.ts';
import { expenseRouter } from '../modules/expense/expense.routes.ts';
import { complaintRouter } from '../modules/complaint/complaint.routes.ts';
import { analyticsRouter } from '../modules/analytics/analytics.routes.ts';
import { syncRouter } from '../modules/sync/sync.routes.ts';
import * as productService from '../modules/product/product.service.ts';
import { sendSuccess, sendError, sendServerError } from '../common/responseHelper.ts';

export const apiRouter = Router();

// ============================================================================
// SYSTEM & HEALTH CHECK
// ============================================================================
apiRouter.get('/health', async (_req: Request, res: Response) => {
  return sendSuccess(res, {
    status: 'healthy',
    architecture: 'Modular 3-Tier (Routes -> Controllers -> Services -> Drizzle SQLite)',
    engine: 'SQLite + LibSQL',
    timestamp: new Date().toISOString(),
  }, 'Bakery API Server operational');
});

// ============================================================================
// DOMAIN FEATURE MODULES
// ============================================================================
apiRouter.use('/customers', customerRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/payments', paymentRouter);
apiRouter.use('/expenses', expenseRouter);
apiRouter.use('/complaints', complaintRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/sync', syncRouter);

// ============================================================================
// COMPATIBILITY ALIASES
// ============================================================================
// Allows direct GET /api/pricing-agreements and POST /api/pricing-agreements
apiRouter.get('/pricing-agreements', async (_req: Request, res: Response) => {
  try {
    const agreements = await productService.getAllPricingAgreements();
    return sendSuccess(res, agreements);
  } catch (err: any) {
    return sendServerError(res, err);
  }
});

apiRouter.post('/pricing-agreements', async (req: Request, res: Response) => {
  try {
    const { customerId, productId, agreedPrice, notes } = req.body;
    if (!customerId || !productId || agreedPrice === undefined) {
      return sendError(res, 'Missing required fields: customerId, productId, agreedPrice');
    }
    const agreement = await productService.setCustomerPricingAgreement({
      customerId,
      productId,
      agreedPrice,
      notes,
    });
    return sendSuccess(res, agreement, 'Pricing agreement saved');
  } catch (err: any) {
    return sendServerError(res, err);
  }
});
