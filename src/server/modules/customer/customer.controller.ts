/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Customer Controller
 * Handles HTTP requests, parameter validation, and formats standard API responses.
 */

import type { Request, Response } from 'express';
import * as customerService from './customer.service.ts';
import { sendSuccess, sendCreated, sendNotFound, sendError, sendServerError } from '../../common/responseHelper.ts';
import type { CreateCustomerDto, UpdateCustomerDto } from '../../../types/apiContracts.ts';

export async function getCustomers(req: Request, res: Response) {
  try {
    const customers = await customerService.getAllCustomers();
    return sendSuccess(res, customers);
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function getCustomer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const customer = await customerService.getCustomerById(id);
    if (!customer) {
      return sendNotFound(res, `Customer with id "${id}"`);
    }
    return sendSuccess(res, customer);
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function createCustomer(req: Request, res: Response) {
  try {
    const body = req.body as CreateCustomerDto;
    
    // Contract validation
    if (!body.name || !body.phone || !body.address || !body.customerType) {
      return sendError(res, 'Missing required fields: name, phone, address, customerType');
    }

    const customer = await customerService.createCustomer(body);
    return sendCreated(res, customer, 'Customer created successfully');
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function updateCustomer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const patch = req.body as UpdateCustomerDto;

    const updated = await customerService.updateCustomer(id, patch);
    if (!updated) {
      return sendNotFound(res, `Customer with id "${id}"`);
    }
    return sendSuccess(res, updated, 'Customer updated successfully');
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function getCustomerStatement(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const statement = await customerService.getCustomerStatement(id, startDate, endDate);
    if (!statement) {
      return sendNotFound(res, `Customer with id "${id}"`);
    }
    return sendSuccess(res, statement);
  } catch (err: any) {
    return sendServerError(res, err);
  }
}
