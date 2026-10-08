/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import { useTheme } from '../../theme/useTheme.tsx';
import { PhoneCall, Globe, ShieldCheck, Plus, AlertCircle, Sun, Moon, WifiOff, ChevronRight, LayoutDashboard, ShoppingBag, Users, CreditCard, BookOpenText, BadgeDollarSign, Receipt, MessageSquareWarning, Package, BarChart3 } from 'lucide-react';
import { UserRole } from '../../types/domain.ts';
import { TabType } from './Navigation.tsx';

interface HeaderProps {
  currentTab?: TabType;
  onOpenQuickOrder: () => void;
  activeSearch: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab = 'dashboard',
  onOpenQuickOrder,
  activeSearch,
  onSearchChange,
}) => {
  const { language, toggleLanguage, t, role, setRole } = useLanguage();
  const { pendingVerificationCount, openComplaintsCount } = useBakeryStore();
  const { theme, isDark, toggleTheme } = useTheme();

  const [isOnline, setIsOnline] = React.useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const roleLabels: Record<UserRole, { en: string; am: string }> = {
    OWNER: { en: 'Owner (Full Access)', am: 'ባለቤት (ሙሉ ፈቃድ)' },
    MANAGER: { en: 'Manager', am: 'ስራ አስኪያጅ' },
    ORDER_STAFF: { en: 'Order Staff', am: 'ትዕዛዝ ተቀባይ' },
    DELIVERY_STAFF: { en: 'Delivery Staff', am: 'አከፋፋይ' },
    ACCOUNTANT: { en: 'Accountant', am: 'የሂሳብ ባለሙያ' },
  };

  const tabMetadata: Record<TabType, { group: string; label: string; icon: React.ReactNode }> = {
    dashboard: { group: t.navGroupDailyOps, label: t.navDashboard, icon: <LayoutDashboard className="w-4 h-4 text-amber-400" /> },
    orders: { group: t.navGroupDailyOps, label: t.navOrders, icon: <ShoppingBag className="w-4 h-4 text-amber-400" /> },
    collections: { group: t.navGroupDailyOps, label: t.navDailyCollections, icon: <BadgeDollarSign className="w-4 h-4 text-amber-400" /> },
    customers: { group: t.navGroupFinance, label: t.navCustomers, icon: <Users className="w-4 h-4 text-amber-400" /> },
    payments: { group: t.navGroupFinance, label: t.navPayments, icon: <CreditCard className="w-4 h-4 text-amber-400" /> },
    debt: { group: t.navGroupFinance, label: t.navDebtLedger, icon: <BookOpenText className="w-4 h-4 text-amber-400" /> },
    complaints: { group: t.navGroupFinance, label: t.navComplaints, icon: <MessageSquareWarning className="w-4 h-4 text-amber-400" /> },
    expenses: { group: t.navGroupManagement, label: t.navExpenses, icon: <Receipt className="w-4 h-4 text-amber-400" /> },
    products: { group: t.navGroupManagement, label: t.navProductsPricing, icon: <Package className="w-4 h-4 text-amber-400" /> },
    reports: { group: t.navGroupManagement, label: t.navReports, icon: <BarChart3 className="w-4 h-4 text-amber-400" /> },
  };

  const currentMeta = tabMetadata[currentTab] || tabMetadata.dashboard;

  return (
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-20 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Mobile Brand Title (Mobile-only, since Left Sidebar handles desktop) */}
          <div className="flex md:hidden items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-lg shadow-sm shrink-0">
              ይ
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-tight text-amber-500 truncate leading-tight">
                {language === 'am' ? 'ይበልጣል ዳቦ ቤት' : 'Yibeltal Bakery'}
              </h1>
              <p className="text-[10px] text-stone-400 truncate leading-tight">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Desktop Breadcrumbs (Contextual orientation for bakery operators) */}
          <div className="hidden md:flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-stone-400 truncate">
              {currentMeta.group}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-500 shrink-0" />
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-stone-800/80 border border-stone-700/60 text-stone-100 text-sm font-bold shadow-xs">
              {currentMeta.icon}
              <span className="truncate">{currentMeta.label}</span>
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
            {/* Alerts indicators - Commented out for now */}
            {/*
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
            */}

            {/* Offline Status Badge */}
            {!isOnline && (
              <div
                title={language === 'am' ? 'ኢንተርኔት ተቋርጧል፡ ዳታ በስልኩ ላይ ተቀምጧል' : 'No internet: all changes safely saved on this device'}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold shadow-sm animate-pulse shrink-0"
              >
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">
                  {language === 'am' ? 'ከመስመር ውጭ (ተቀምጧል)' : 'Offline (Saved)'}
                </span>
                <span className="sm:hidden text-[10px]">Offline</span>
              </div>
            )}

            {/* Role Switcher - Commented out for now */}
            {/*
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
            */}

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
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-xs sm:text-sm shadow-md transition cursor-pointer shrink-0"
            >
              <PhoneCall className="w-4 h-4 text-stone-950" />
              <span className="whitespace-nowrap font-bold">{t.newOrder}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
