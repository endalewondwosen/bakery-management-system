/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Complaint Controller
 */

import type { Request, Response } from 'express';
import * as complaintService from './complaint.service.ts';
import { sendSuccess, sendCreated, sendNotFound, sendError, sendServerError } from '../../common/responseHelper.ts';
import type { CreateComplaintDto, ResolveComplaintDto } from '../../../types/apiContracts.ts';

export async function getComplaints(req: Request, res: Response) {
  try {
    const complaints = await complaintService.getAllComplaints();
    return sendSuccess(res, complaints);
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function getComplaint(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const complaint = await complaintService.getComplaintById(id);
    if (!complaint) {
      return sendNotFound(res, `Complaint with id "${id}"`);
    }
    return sendSuccess(res, complaint);
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function createComplaint(req: Request, res: Response) {
  try {
    const body = req.body as CreateComplaintDto;
    if (!body.customerId || !body.customerName || !body.category || !body.description || !body.priority) {
      return sendError(res, 'Missing required complaint fields: customerId, customerName, category, description, priority');
    }
    const complaint = await complaintService.createComplaint(body);
    return sendCreated(res, complaint, 'Complaint logged successfully');
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function resolveComplaint(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const body = req.body as ResolveComplaintDto;
    if (!body.status || !body.resolutionNotes) {
      return sendError(res, 'Missing required resolution fields: status, resolutionNotes');
    }
    const updated = await complaintService.resolveComplaint(id, {
      status: body.status,
      resolutionType: body.resolutionType || 'EXPLANATION',
      resolutionNotes: body.resolutionNotes,
      resolvedBy: body.resolvedBy || 'Supervisor',
    });
    if (!updated) {
      return sendNotFound(res, `Complaint with id "${id}"`);
    }
    return sendSuccess(res, updated, 'Complaint resolved');
  } catch (err: any) {
    return sendServerError(res, err);
  }
}
