/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Compact Avatar Pill with Profile Dropdown Card
 * Standard SaaS pattern designed to conserve header real estate.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext.tsx';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useTheme } from '../../theme/useTheme.tsx';
import {
  Crown,
  ChevronDown,
  LogOut,
  Sun,
  Moon,
  Globe,
  Phone,
  CheckCircle2,
  AlertTriangle,
  User as UserIcon,
  RotateCcw,
} from 'lucide-react';

export const ProfileDropdown: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handlePurgeCacheAndReload = async () => {
    try {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('yibeltal_auth_token');
        const rToken = localStorage.getItem('yibeltal_auth_refresh_token');
        const userJson = localStorage.getItem('yibeltal_auth_user');

        localStorage.clear();

        if (token) localStorage.setItem('yibeltal_auth_token', token);
        if (rToken) localStorage.setItem('yibeltal_auth_refresh_token', rToken);
        if (userJson) localStorage.setItem('yibeltal_auth_user', userJson);

        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }

        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  };

  // Close dropdown on outside click or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowConfirmLogout(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setShowConfirmLogout(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    setShowConfirmLogout(false);
    await logout();
  };

  const displayName = user?.name || (language === 'am' ? 'ባለቤት' : 'Owner');
  const displayPhone = user?.phone || '0955143592';

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* 1. Compact Avatar Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={language === 'am' ? 'የመለያ መረጃ እና መውጫ' : 'Account profile and settings'}
        className={`flex items-center gap-2 p-1 sm:pl-1.5 sm:pr-2.5 rounded-full sm:rounded-xl border transition cursor-pointer select-none ${
          isOpen
            ? 'bg-stone-800 border-amber-500/60 shadow-md ring-2 ring-amber-500/20'
            : 'bg-stone-850 hover:bg-stone-800 border-stone-750 text-stone-200'
        }`}
      >
        {/* Avatar Circle with Online Dot */}
        <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 font-black flex items-center justify-center text-sm shadow-xs shrink-0 ring-1 ring-amber-300/40">
          ይ
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-stone-900 rounded-full" />
        </div>

        {/* Desktop Name & Role Badge */}
        <div className="hidden lg:flex flex-col text-left leading-tight min-w-0 max-w-[110px]">
          <span className="text-xs font-bold text-stone-100 truncate flex items-center gap-1">
            <Crown className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">{displayName}</span>
          </span>
          <span className="text-[10px] text-amber-400/90 font-medium truncate">
            {displayPhone}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 hidden sm:block ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      {/* 2. Profile Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-stone-900 border border-stone-750 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
          
          {/* Header Card: User Identity */}
          <div className="p-4 bg-gradient-to-b from-stone-850 to-stone-900 border-b border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 font-black text-xl flex items-center justify-center shadow-md ring-2 ring-amber-500/30 shrink-0">
                ይ
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-stone-100 truncate">
                    {displayName}
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    OWNER
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-stone-300 mt-0.5">
                  <Phone className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="font-mono">{displayPhone}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  <span>{t.activeSession}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences Group (Theme & Language quick controls) */}
          <div className="p-3 border-b border-stone-800/80 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2 py-0.5">
              {language === 'am' ? 'ምርጫዎች' : 'Preferences'}
            </div>

            {/* Language toggle row */}
            <button
              onClick={toggleLanguage}
              type="button"
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-stone-200 hover:bg-stone-800 hover:text-stone-100 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>{language === 'am' ? 'ቋንቋ (Language)' : 'Language'}</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-stone-800 border border-stone-700 text-stone-300 font-bold text-[11px]">
                {language === 'am' ? 'አማርኛ' : 'English'}
              </span>
            </button>

            {/* Theme toggle row */}
            <button
              onClick={toggleTheme}
              type="button"
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-stone-200 hover:bg-stone-800 hover:text-stone-100 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-amber-500" />
                )}
                <span>{isDark ? t.themeSwitchToLight : t.themeSwitchToDark}</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-stone-800 border border-stone-700 text-stone-300 font-bold text-[11px]">
                {isDark ? 'Dark' : 'Light'}
              </span>
            </button>

            {/* Clear Browser Cache & Clean Slate row */}
            <button
              onClick={handlePurgeCacheAndReload}
              type="button"
              title={language === 'am' ? 'የአሳሽ መሸጎጫን አጽዳ እና ዳግም ጫን' : 'Clear browser cache and reload'}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-stone-200 hover:bg-stone-800 hover:text-stone-100 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>{language === 'am' ? 'መሸጎጫ አጽዳ (Reload)' : 'Clean Cache & Resync'}</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-stone-800 border border-stone-700 text-amber-400 font-bold text-[11px]">
                {language === 'am' ? 'አድስ' : 'Reset'}
              </span>
            </button>
          </div>

          {/* Logout Action Area */}
          <div className="p-3 bg-stone-900/60">
            {!showConfirmLogout ? (
              <button
                onClick={() => setShowConfirmLogout(true)}
                type="button"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/40 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.logout}</span>
              </button>
            ) : (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-center animate-in fade-in">
                <p className="text-xs text-rose-200 font-semibold mb-2">
                  {t.logoutConfirm}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowConfirmLogout(false)}
                    type="button"
                    className="flex-1 py-1.5 px-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleLogout}
                    type="button"
                    className="flex-1 py-1.5 px-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    {t.logout}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
