/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Complaint Routes Definition
 */

import { Router } from 'express';
import * as complaintController from './complaint.controller.ts';

export const complaintRouter = Router();

// GET /api/complaints
complaintRouter.get('/', complaintController.getComplaints);

// GET /api/complaints/:id
complaintRouter.get('/:id', complaintController.getComplaint);

// POST /api/complaints
complaintRouter.post('/', complaintController.createComplaint);

// POST or PATCH /api/complaints/:id/resolve
complaintRouter.post('/:id/resolve', complaintController.resolveComplaint);
complaintRouter.patch('/:id/resolve', complaintController.resolveComplaint);
