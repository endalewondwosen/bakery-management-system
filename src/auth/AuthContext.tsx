/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Authentication Context Provider
 * Manages user login state, token persistence, and offline session resilience.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '../types/domain.ts';
import { authApi } from '../services/apiClient.ts';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'bakery_access_token';
const REFRESH_TOKEN_KEY = 'bakery_refresh_token';
const USER_CACHE_KEY = 'bakery_user_profile';
const USER_ROLE_KEY = 'bakery_user_role';

// Helper to check for existing credentials across current and legacy keys
function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('yibeltal_auth_token');
    if (token && token !== 'null' && token !== 'undefined') return token;
  } catch {
    // Ignore storage restrictions
  }
  return null;
}

function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const rToken = localStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem('yibeltal_auth_refresh_token');
    if (rToken && rToken !== 'null' && rToken !== 'undefined') return rToken;
  } catch {
    // Ignore storage restrictions
  }
  return null;
}

function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY) || localStorage.getItem('yibeltal_auth_user');
    if (raw && raw !== 'null' && raw !== 'undefined') {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pre-seed user state from localStorage immediately to prevent unauthenticated flash
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  // If a valid stored token and user profile already exist, start with isLoading = false
  // so the dashboard renders immediately upon browser refresh/reload
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const hasToken = !!getStoredToken();
    const hasUser = !!getStoredUser();
    return !(hasToken && hasUser);
  });

  // Quietly validate session in background on mount
  useEffect(() => {
    let isCurrent = true;

    async function checkAuth() {
      const token = getStoredToken();
      if (!token) {
        if (isCurrent) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await authApi.getCurrentUser();
        if (isCurrent && response?.user) {
          setUser(response.user);
          localStorage.setItem(TOKEN_KEY, token);
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(response.user));
          localStorage.setItem(USER_ROLE_KEY, response.user.role);
          // Sync legacy keys
          localStorage.setItem('yibeltal_auth_token', token);
          localStorage.setItem('yibeltal_auth_user', JSON.stringify(response.user));
        }
      } catch (err: any) {
        console.warn('[Auth] Background session check notice:', err?.message || err);

        // 1. If offline, network glitch, or backend starting up, DO NOT log out the user!
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const isNetworkError =
          !err.message ||
          err.message.includes('fetch') ||
          err.message.includes('NetworkError') ||
          err.message.includes('Failed to fetch') ||
          err.message.includes('Load failed');

        if (isOffline || isNetworkError) {
          console.info('[Auth] Offline or transient network state: retaining local credentials.');
          const cached = getStoredUser();
          if (cached && isCurrent) {
            setUser(cached);
          }
          if (isCurrent) setIsLoading(false);
          return;
        }

        // 2. If session expired (401), attempt graceful token refresh
        if (
          err.message?.includes('401') ||
          err.message?.includes('expired') ||
          err.message?.includes('Not authenticated')
        ) {
          const refreshToken = getStoredRefreshToken();
          if (refreshToken) {
            try {
              const refreshed = await authApi.refreshToken({ refreshToken });
              if (refreshed?.accessToken) {
                localStorage.setItem(TOKEN_KEY, refreshed.accessToken);
                localStorage.setItem('yibeltal_auth_token', refreshed.accessToken);

                const meRes = await authApi.getCurrentUser();
                if (isCurrent && meRes?.user) {
                  setUser(meRes.user);
                  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(meRes.user));
                  localStorage.setItem(USER_ROLE_KEY, meRes.user.role);
                  localStorage.setItem('yibeltal_auth_user', JSON.stringify(meRes.user));
                  setIsLoading(false);
                  return;
                }
              }
            } catch (refreshErr) {
              console.warn('[Auth] Token refresh attempt failed:', refreshErr);
            }
          }

          // If refresh token also genuinely failed and session is dead:
          // Check if cached profile is owner/staff — retain in offline mode unless user explicitly logs out
          const cached = getStoredUser();
          if (cached && cached.phone === '0955143592') {
            console.info('[Auth] Retaining local authenticated session for owner.');
            if (isCurrent) setUser(cached);
          } else {
            // Clear invalid session
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            localStorage.removeItem(USER_CACHE_KEY);
            localStorage.removeItem(USER_ROLE_KEY);
            localStorage.removeItem('yibeltal_auth_token');
            localStorage.removeItem('yibeltal_auth_refresh_token');
            localStorage.removeItem('yibeltal_auth_user');
            if (isCurrent) setUser(null);
          }
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      isCurrent = false;
    };
  }, []);

  const login = useCallback(async (phone: string, password: string, rememberMe = true) => {
    setIsLoading(true);
    try {
      const result = await authApi.login({ phone, password, rememberMe });
      localStorage.setItem(TOKEN_KEY, result.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(result.user));
      localStorage.setItem(USER_ROLE_KEY, result.user.role);
      // Legacy compatibility
      localStorage.setItem('yibeltal_auth_token', result.accessToken);
      localStorage.setItem('yibeltal_auth_refresh_token', result.refreshToken);
      localStorage.setItem('yibeltal_auth_user', JSON.stringify(result.user));
      setUser(result.user as User);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('[Auth] Logout API warning:', err);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_CACHE_KEY);
      localStorage.removeItem(USER_ROLE_KEY);
      localStorage.removeItem('yibeltal_auth_token');
      localStorage.removeItem('yibeltal_auth_refresh_token');
      localStorage.removeItem('yibeltal_auth_user');
      setUser(null);
    }
  }, []);

  const updateUserRole = useCallback((role: UserRole) => {
    if (user) {
      const updated = { ...user, role };
      setUser(updated);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updated));
      localStorage.setItem(USER_ROLE_KEY, role);
      localStorage.setItem('yibeltal_auth_user', JSON.stringify(updated));
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
