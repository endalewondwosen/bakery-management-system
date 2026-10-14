/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Authentication Routes
 */

import { Router } from 'express';
import * as authController from './auth.controller.ts';

export const authRouter = Router();

authRouter.post('/login', authController.login);
authRouter.get('/me', authController.getCurrentUser);
authRouter.post('/refresh', authController.refreshToken);
authRouter.post('/logout', authController.logout);
