/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Order Controller
 */

import type { Request, Response } from 'express';
import * as orderService from './order.service.ts';
import { sendSuccess, sendCreated, sendNotFound, sendError, sendServerError } from '../../common/responseHelper.ts';
import type { CreateOrderDto, UpdateOrderStatusDto } from '../../../types/apiContracts.ts';

export async function getOrders(req: Request, res: Response) {
  try {
    const orders = await orderService.getAllOrders();
    return sendSuccess(res, orders);
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function getOrder(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);
    if (!order) {
      return sendNotFound(res, `Order with id "${id}"`);
    }
    return sendSuccess(res, order);
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function createOrder(req: Request, res: Response) {
  try {
    const body = req.body as CreateOrderDto;
    if (!body.customerId || !body.orderDate || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return sendError(res, 'Invalid order payload: customerId, orderDate, and items array are required');
    }
    const order = await orderService.createOrder(body);
    return sendCreated(res, order, 'Order created successfully');
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const body = req.body as UpdateOrderStatusDto;
    if (!body.status) {
      return sendError(res, 'Status is required');
    }
    const updated = await orderService.updateOrderStatus(id, body);
    if (!updated) {
      return sendNotFound(res, `Order with id "${id}"`);
    }
    return sendSuccess(res, updated, 'Order status updated');
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function getProductionSheet(req: Request, res: Response) {
  try {
    const targetDate = (req.query.date as string) || new Date().toISOString().slice(0, 10);
    const sheet = await orderService.getProductionSheet(targetDate);
    return sendSuccess(res, sheet);
  } catch (err: any) {
    return sendServerError(res, err);
  }
}
