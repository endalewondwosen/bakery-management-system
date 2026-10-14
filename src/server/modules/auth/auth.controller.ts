/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Authentication Controller
 * Handles HTTP requests for login, logout, token verification, and refresh.
 */

import type { Request, Response } from 'express';
import * as authService from './auth.service.ts';
import { sendSuccess, sendError, sendServerError } from '../../common/responseHelper.ts';

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // Fallback to cookie
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    for (const c of cookies) {
      if (c.startsWith('bakery_token=')) {
        return c.substring('bakery_token='.length).trim();
      }
      if (c.startsWith('auth_token=')) {
        return c.substring('auth_token='.length).trim();
      }
    }
  }

  return null;
}

export async function login(req: Request, res: Response): Promise<Response> {
  try {
    const { phone, password, rememberMe } = req.body;
    if (!phone || !password) {
      return sendError(res, 'Phone number and password are required', 400);
    }

    const clientInfo = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    };

    const result = await authService.login(phone, password, rememberMe !== false, clientInfo);

    // Set secure HttpOnly cookie for web browser session protection
    const maxAge = (rememberMe !== false ? 30 : 7) * 24 * 60 * 60;
    res.setHeader(
      'Set-Cookie',
      `bakery_token=${result.accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`
    );

    return sendSuccess(res, result, 'Successfully authenticated');
  } catch (err: any) {
    if (err.message?.includes('Invalid') || err.message?.includes('deactivated')) {
      return sendError(res, err.message, 401);
    }
    return sendServerError(res, err);
  }
}

export async function getCurrentUser(req: Request, res: Response): Promise<Response> {
  try {
    const token = extractToken(req);
    if (!token) {
      return sendError(res, 'Not authenticated', 401);
    }

    const user = await authService.getUserBySessionToken(token);
    if (!user) {
      return sendError(res, 'Session expired or invalid', 401);
    }

    return sendSuccess(res, { user }, 'Session active');
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function refreshToken(req: Request, res: Response): Promise<Response> {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return sendError(res, 'Refresh token required', 400);
    }

    const result = await authService.refreshAccessToken(refreshToken);

    // Update cookie
    res.setHeader(
      'Set-Cookie',
      `bakery_token=${result.accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${14 * 24 * 60 * 60}`
    );

    return sendSuccess(res, result, 'Token refreshed');
  } catch (err: any) {
    return sendError(res, err.message, 401);
  }
}

export async function logout(req: Request, res: Response): Promise<Response> {
  try {
    const token = extractToken(req);
    if (token) {
      await authService.logout(token);
    }

    // Expire cookie
    res.setHeader(
      'Set-Cookie',
      `bakery_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
    );

    return sendSuccess(res, { loggedOut: true }, 'Successfully logged out');
  } catch (err: any) {
    return sendServerError(res, err);
  }
}
