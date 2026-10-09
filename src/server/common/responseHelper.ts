/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Standard HTTP Response Utilities
 * Enforces consistent API envelopes and status code mapping.
 */

import type { Response } from 'express';
import type { ApiResponse, ApiErrorResponse } from '../../types/apiContracts.ts';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(payload);
}

export function sendCreated<T>(
  res: Response,
  data: T,
  message?: string
): Response {
  return sendSuccess(res, data, message, 201);
}

export function sendError(
  res: Response,
  error: string,
  statusCode = 400,
  details?: Record<string, any>,
  code?: string
): Response {
  const payload: ApiErrorResponse = {
    success: false,
    error,
    code,
    details,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(payload);
}

export function sendNotFound(
  res: Response,
  entityName = 'Resource'
): Response {
  return sendError(res, `${entityName} not found`, 404, undefined, 'NOT_FOUND');
}

export function sendServerError(
  res: Response,
  err: any
): Response {
  console.error('[API Server Error]:', err);
  const message = err instanceof Error ? err.message : 'An unexpected server error occurred';
  return sendError(res, message, 500, undefined, 'INTERNAL_SERVER_ERROR');
}
