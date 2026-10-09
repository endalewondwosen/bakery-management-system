/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Analytics Routes Definition
 */

import { Router } from 'express';
import * as analyticsController from './analytics.controller.ts';

export const analyticsRouter = Router();

// GET /api/analytics/metrics
analyticsRouter.get('/metrics', analyticsController.getDashboardMetrics);

// GET /api/analytics/pnl
analyticsRouter.get('/pnl', analyticsController.getPnLReport);
