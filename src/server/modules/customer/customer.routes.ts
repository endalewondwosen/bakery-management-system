/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Customer Routes Definition
 */

import { Router } from 'express';
import * as customerController from './customer.controller.ts';

export const customerRouter = Router();

// GET /api/customers - List all customers
customerRouter.get('/', customerController.getCustomers);

// GET /api/customers/:id - Retrieve single customer
customerRouter.get('/:id', customerController.getCustomer);

// POST /api/customers - Create new customer
customerRouter.post('/', customerController.createCustomer);

// PUT /api/customers/:id - Update existing customer
customerRouter.put('/:id', customerController.updateCustomer);

// GET /api/customers/:id/statement - Get customer debt ledger and transactions
customerRouter.get('/:id/statement', customerController.getCustomerStatement);
