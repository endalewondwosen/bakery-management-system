/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Authentication Service
 * Manages user credentials, password hashing, session tokens, and security.
 */

import crypto from 'crypto';
import { db } from '../../db/index.ts';
import * as schema from '../../db/schema.ts';
import { eq, and, gt } from 'drizzle-orm';
import type { UserRole } from '../../../types/domain.ts';

const HASH_ITERATIONS = 10000;
const HASH_KEYLEN = 64;
const HASH_DIGEST = 'sha512';

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEYLEN, HASH_DIGEST).toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Normalizes phone numbers (handles leading zero, Ethiopian country code +251)
 */
export function normalizePhone(phone: string): string {
  const clean = phone.replace(/[^\d+]/g, '');
  if (clean.startsWith('+251')) {
    return '0' + clean.slice(4);
  }
  if (clean.startsWith('251')) {
    return '0' + clean.slice(3);
  }
  return clean;
}

export interface ClientInfo {
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthResult {
  user: {
    id: string;
    phone: string;
    name: string;
    role: UserRole;
    isActive: boolean;
    createdAt: string;
    lastLoginAt?: string | null;
  };
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

/**
 * Ensures default owner exists in the database
 */
export async function seedDefaultOwner(): Promise<void> {
  const defaultPhone = '0955143592';
  const defaultPassword = 'Yibe51@@';

  try {
    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.phone, defaultPhone))
      .limit(1);

    if (existing.length === 0) {
      const salt = generateSalt();
      const passwordHash = hashPassword(defaultPassword, salt);
      const now = new Date().toISOString();

      await db.insert(schema.users).values({
        id: 'usr_owner_default',
        phone: defaultPhone,
        name: 'ይበልጣል (Owner)',
        passwordHash,
        salt,
        role: 'OWNER',
        isActive: true,
        createdAt: now,
      });

      console.log(`[Auth] Default owner account created for phone ${defaultPhone}`);
    } else {
      // In case password was updated in prompt, sync hash if needed
      const current = existing[0];
      const testHash = hashPassword(defaultPassword, current.salt);
      if (testHash !== current.passwordHash) {
        const newSalt = generateSalt();
        const newHash = hashPassword(defaultPassword, newSalt);
        await db.update(schema.users).set({
          passwordHash: newHash,
          salt: newSalt,
          name: 'ይበልጣል (Owner)',
        }).where(eq(schema.users.id, current.id));
        console.log(`[Auth] Default owner credentials refreshed for ${defaultPhone}`);
      }
    }
  } catch (err) {
    console.error('[Auth] Error seeding default owner:', err);
  }
}

/**
 * Authenticates user by phone and password
 */
export async function login(
  rawPhone: string,
  rawPassword: string,
  rememberMe: boolean = true,
  clientInfo?: ClientInfo
): Promise<AuthResult> {
  const phone = normalizePhone(rawPhone.trim());
  const password = rawPassword.trim();

  if (!phone || !password) {
    throw new Error('Phone number and password are required');
  }

  // Find user
  const users = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.phone, phone))
    .limit(1);

  if (users.length === 0) {
    throw new Error('Invalid phone number or password');
  }

  const user = users[0];

  if (!user.isActive) {
    throw new Error('This account has been deactivated. Please contact support.');
  }

  // Verify hash
  const computedHash = hashPassword(password, user.salt);
  if (computedHash !== user.passwordHash) {
    throw new Error('Invalid phone number or password');
  }

  // Session duration: 30 days if rememberMe, otherwise 7 days
  const sessionDays = rememberMe ? 30 : 7;
  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + sessionDays);
  const expiresAt = expiresDate.toISOString();

  const accessToken = generateToken();
  const refreshToken = generateToken();
  const now = new Date().toISOString();

  // Create session
  await db.insert(schema.userSessions).values({
    id: 'sess_' + crypto.randomUUID(),
    userId: user.id,
    accessToken,
    refreshToken,
    expiresAt,
    createdAt: now,
    userAgent: clientInfo?.userAgent || null,
    ipAddress: clientInfo?.ipAddress || null,
  });

  // Update last login
  await db.update(schema.users).set({
    lastLoginAt: now,
  }).where(eq(schema.users.id, user.id));

  return {
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role as UserRole,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: now,
    },
    accessToken,
    refreshToken,
    expiresAt,
  };
}

/**
 * Validates session token and returns current user
 */
export async function getUserBySessionToken(accessToken: string): Promise<AuthResult['user'] | null> {
  if (!accessToken) return null;

  const now = new Date().toISOString();
  // Check active session by accessToken
  let sessions = await db
    .select()
    .from(schema.userSessions)
    .where(
      and(
        eq(schema.userSessions.accessToken, accessToken),
        gt(schema.userSessions.expiresAt, now)
      )
    )
    .limit(1);

  // Fallback check by refreshToken in case access token was rotated
  if (sessions.length === 0) {
    sessions = await db
      .select()
      .from(schema.userSessions)
      .where(
        and(
          eq(schema.userSessions.refreshToken, accessToken),
          gt(schema.userSessions.expiresAt, now)
        )
      )
      .limit(1);
  }

  if (sessions.length === 0) return null;

  const session = sessions[0];
  const users = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .limit(1);

  if (users.length === 0 || !users[0].isActive) return null;

  // Auto-extend active session if expiration is within 14 days
  try {
    const expiresDate = new Date(session.expiresAt);
    if (expiresDate.getTime() - Date.now() < 14 * 24 * 60 * 60 * 1000) {
      const extended = new Date();
      extended.setDate(extended.getDate() + 30);
      await db
        .update(schema.userSessions)
        .set({ expiresAt: extended.toISOString() })
        .where(eq(schema.userSessions.id, session.id));
    }
  } catch {
    // Non-fatal
  }

  const user = users[0];
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role as UserRole,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

/**
 * Refreshes an expired access token using a valid refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: string }> {
  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  const now = new Date().toISOString();
  const sessions = await db
    .select()
    .from(schema.userSessions)
    .where(
      and(
        eq(schema.userSessions.refreshToken, refreshToken),
        gt(schema.userSessions.expiresAt, now)
      )
    )
    .limit(1);

  if (sessions.length === 0) {
    throw new Error('Session expired or invalid. Please sign in again.');
  }

  const session = sessions[0];
  const newAccessToken = generateToken();
  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + 14);
  const expiresAt = expiresDate.toISOString();

  await db.update(schema.userSessions).set({
    accessToken: newAccessToken,
    expiresAt,
  }).where(eq(schema.userSessions.id, session.id));

  return {
    accessToken: newAccessToken,
    expiresAt,
  };
}

/**
 * Terminates session by access or refresh token
 */
export async function logout(token: string): Promise<boolean> {
  if (!token) return true;

  await db
    .delete(schema.userSessions)
    .where(eq(schema.userSessions.accessToken, token));

  await db
    .delete(schema.userSessions)
    .where(eq(schema.userSessions.refreshToken, token));

  return true;
}
