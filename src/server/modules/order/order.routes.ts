/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Order Routes Definition
 */

import { Router } from 'express';
import * as orderController from './order.controller.ts';

export const orderRouter = Router();

// GET /api/orders
orderRouter.get('/', orderController.getOrders);

// GET /api/orders/production-sheet (placed before /:id to prevent slug collision)
orderRouter.get('/production-sheet', orderController.getProductionSheet);

// GET /api/orders/:id
orderRouter.get('/:id', orderController.getOrder);

// POST /api/orders
orderRouter.post('/', orderController.createOrder);

// PATCH or PUT /api/orders/:id/status
orderRouter.patch('/:id/status', orderController.updateOrderStatus);
orderRouter.put('/:id/status', orderController.updateOrderStatus);
