/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Analytics Controller
 */

import type { Request, Response } from 'express';
import * as analyticsService from './analytics.service.ts';
import { sendSuccess, sendServerError } from '../../common/responseHelper.ts';

export async function getDashboardMetrics(req: Request, res: Response) {
  try {
    const metrics = await analyticsService.getDashboardMetrics();
    return sendSuccess(res, metrics);
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function getPnLReport(req: Request, res: Response) {
  try {
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const pnl = await analyticsService.getPnLReport(startDate, endDate);
    return sendSuccess(res, pnl);
  } catch (err: any) {
    return sendServerError(res, err);
  }
}
