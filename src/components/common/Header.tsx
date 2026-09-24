/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import { useTheme } from '../../theme/useTheme.tsx';
import { PhoneCall, Globe, ShieldCheck, Plus, AlertCircle, Sun, Moon } from 'lucide-react';
import { UserRole } from '../../types/domain.ts';

interface HeaderProps {
  onOpenQuickOrder: () => void;
  activeSearch: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickOrder,
  activeSearch,
  onSearchChange,
}) => {
  const { language, toggleLanguage, t, role, setRole } = useLanguage();
  const { pendingVerificationCount, openComplaintsCount } = useBakeryStore();
  const { theme, isDark, toggleTheme } = useTheme();

  const roleLabels: Record<UserRole, { en: string; am: string }> = {
    OWNER: { en: 'Owner (Full Access)', am: 'ባለቤት (ሙሉ ፈቃድ)' },
    MANAGER: { en: 'Manager', am: 'ስራ አስኪያጅ' },
    ORDER_STAFF: { en: 'Order Staff', am: 'ትዕዛዝ ተቀባይ' },
    DELIVERY_STAFF: { en: 'Delivery Staff', am: 'አከፋፋይ' },
    ACCOUNTANT: { en: 'Accountant', am: 'የሂሳብ ባለሙያ' },
  };

  return (
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-stone-950 flex items-center justify-center font-bold text-xl shadow-inner shrink-0">
              ዳ
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-amber-500 truncate">
                  {language === 'am' ? 'መሰረተ ዳቦ ቤት' : 'Meserete Bakery'}
                </h1>
                <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-stone-400 hidden sm:inline-block">
                  {t.tagline}
                </span>
              </div>
              <p className="text-xs text-stone-400 truncate">
                {language === 'am' ? 'የዳቦ ቤት ማኔጅመንት ሲስተም' : 'Bakery Operations Management System'}
              </p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <input
              type="text"
              value={activeSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={language === 'am' ? 'ደንበኛ፣ ስልክ፣ ወይም የትዕዛዝ ቁጥር ይፈልጉ...' : 'Search customer, phone, or order #...'}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3.5 py-1.5 text-sm text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Alerts indicators */}
            {(pendingVerificationCount > 0 || openComplaintsCount > 0) && (
              <div className="hidden lg:flex items-center gap-2 text-xs">
                {pendingVerificationCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-1 rounded-md">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{pendingVerificationCount} SMS</span>
                  </span>
                )}
                {openComplaintsCount > 0 && (
                  <span className="flex items-center gap-1 text-rose-400 bg-rose-950/60 border border-rose-800/80 px-2 py-1 rounded-md">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{openComplaintsCount} {t.navComplaints}</span>
                  </span>
                )}
              </div>
            )}

            {/* Role Switcher */}
            <div className="hidden sm:flex items-center gap-1 bg-stone-800 border border-stone-700 rounded-lg px-2 py-1 text-xs">
              <span className="text-stone-400">Role:</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="bg-transparent text-amber-400 font-medium focus:outline-none cursor-pointer"
              >
                <option value="OWNER" className="bg-stone-900 text-stone-100">{roleLabels.OWNER[language]}</option>
                <option value="MANAGER" className="bg-stone-900 text-stone-100">{roleLabels.MANAGER[language]}</option>
                <option value="ORDER_STAFF" className="bg-stone-900 text-stone-100">{roleLabels.ORDER_STAFF[language]}</option>
                <option value="ACCOUNTANT" className="bg-stone-900 text-stone-100">{roleLabels.ACCOUNTANT[language]}</option>
                <option value="DELIVERY_STAFF" className="bg-stone-900 text-stone-100">{roleLabels.DELIVERY_STAFF[language]}</option>
              </select>
            </div>

            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              title={isDark ? t.themeSwitchToLight : t.themeSwitchToDark}
              aria-label={isDark ? t.themeSwitchToLight : t.themeSwitchToDark}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold transition cursor-pointer"
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">{language === 'am' ? 'ብርሃን' : 'Light'}</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">{language === 'am' ? 'ጨለማ' : 'Dark'}</span>
                </>
              )}
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              title="Switch Language / ቋንቋ ቀይር"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'am' ? 'English' : 'አማርኛ'}</span>
            </button>

            {/* Primary Action: Phone Order */}
            <button
              onClick={onOpenQuickOrder}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs sm:text-sm shadow transition cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span className="whitespace-nowrap">{t.newOrder}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
