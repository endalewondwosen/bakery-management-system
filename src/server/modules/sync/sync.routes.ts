/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Synchronization Routes Definition
 */

import { Router } from 'express';
import * as syncController from './sync.controller.ts';

export const syncRouter = Router();

// POST /api/sync
syncRouter.post('/', syncController.syncData);
