/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Synchronization Controller
 */

import type { Request, Response } from 'express';
import * as syncService from './sync.service.ts';
import { sendServerError } from '../../common/responseHelper.ts';
import type { SyncPayloadDto } from '../../../types/apiContracts.ts';

export async function syncData(req: Request, res: Response) {
  try {
    const payload = req.body as SyncPayloadDto;
    const result = await syncService.processSync(payload);
    // Respond directly with the sync result for zero-overhead client parsing
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    return sendServerError(res, err);
  }
}
