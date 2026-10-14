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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem(USER_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await authApi.getCurrentUser();
        if (mounted && response?.user) {
          setUser(response.user);
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(response.user));
          localStorage.setItem('bakery_user_role', response.user.role);
        }
      } catch (err: any) {
        // If offline / network error, retain cached user profile for uninterrupted work
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          console.warn('[Auth] Offline mode active: retaining cached credentials.');
        } else if (err.message?.includes('401') || err.message?.includes('expired') || err.message?.includes('Not authenticated')) {
          // Attempt refresh
          const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
          if (refreshToken) {
            try {
              const refreshed = await authApi.refreshToken({ refreshToken });
              localStorage.setItem(TOKEN_KEY, refreshed.accessToken);
              const meRes = await authApi.getCurrentUser();
              if (mounted && meRes?.user) {
                setUser(meRes.user);
                localStorage.setItem(USER_CACHE_KEY, JSON.stringify(meRes.user));
                localStorage.setItem('bakery_user_role', meRes.user.role);
                setIsLoading(false);
                return;
              }
            } catch {
              // Refresh failed, session genuinely expired
            }
          }
          // Clear invalid session
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem(USER_CACHE_KEY);
          if (mounted) setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (phone: string, password: string, rememberMe = true) => {
    setIsLoading(true);
    try {
      const result = await authApi.login({ phone, password, rememberMe });
      localStorage.setItem(TOKEN_KEY, result.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(result.user));
      localStorage.setItem('bakery_user_role', result.user.role);
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
      setUser(null);
    }
  }, []);

  const updateUserRole = useCallback((role: UserRole) => {
    if (user) {
      const updated = { ...user, role };
      setUser(updated);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updated));
      localStorage.setItem('bakery_user_role', role);
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
