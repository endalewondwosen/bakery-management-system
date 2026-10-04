/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import { useTheme } from '../../theme/useTheme.tsx';
import { TabType } from './Navigation.tsx';
import {
  ShoppingBag,
  BadgeDollarSign,
  BookOpenText,
  Menu,
  PhoneCall,
  X,
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  MessageSquareWarning,
  Package,
  BarChart3,
  Globe,
  Sun,
  Moon,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { UserRole } from '../../types/domain.ts';

interface MobileBottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenQuickOrder: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenQuickOrder,
}) => {
  const { language, toggleLanguage, t, role, setRole } = useLanguage();
  const { pendingVerificationCount, openComplaintsCount } = useBakeryStore();
  const { theme, toggleTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const roleLabels: Record<UserRole, { en: string; am: string }> = {
    OWNER: { en: 'Owner (Full Access)', am: 'ባለቤት (ሙሉ ፈቃድ)' },
    MANAGER: { en: 'Manager', am: 'ስራ አስኪያጅ' },
    ORDER_STAFF: { en: 'Order Staff', am: 'ትዕዛዝ ተቀባይ' },
    DELIVERY_STAFF: { en: 'Delivery Staff', am: 'አከፋፋይ' },
    ACCOUNTANT: { en: 'Accountant', am: 'የሂሳብ ባለሙያ' },
  };

  const allTabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: t.navDashboard, icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'orders', label: t.navOrders, icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'customers', label: t.navCustomers, icon: <Users className="w-5 h-5" /> },
    {
      id: 'payments',
      label: t.navPayments,
      icon: <CreditCard className="w-5 h-5" />,
      badge: pendingVerificationCount > 0 ? pendingVerificationCount : undefined,
    },
    { id: 'debt', label: t.navDebtLedger, icon: <BookOpenText className="w-5 h-5" /> },
    { id: 'collections', label: t.navDailyCollections, icon: <BadgeDollarSign className="w-5 h-5" /> },
    { id: 'expenses', label: t.navExpenses, icon: <Receipt className="w-5 h-5" /> },
    {
      id: 'complaints',
      label: t.navComplaints,
      icon: <MessageSquareWarning className="w-5 h-5" />,
      badge: openComplaintsCount > 0 ? openComplaintsCount : undefined,
    },
    { id: 'products', label: t.navProductsPricing, icon: <Package className="w-5 h-5" /> },
    { id: 'reports', label: t.navReports, icon: <BarChart3 className="w-5 h-5" /> },
  ];

  const handleSelectTab = (tab: TabType) => {
    onTabChange(tab);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Fixed Bottom Navigation Bar - Only on Mobile */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-stone-900/98 border-t border-stone-800 backdrop-blur-lg sm:hidden shadow-2xl safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          
          {/* Orders */}
          <button
            type="button"
            onClick={() => onTabChange('orders')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition ${
              currentTab === 'orders'
                ? 'text-amber-400 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">
              {language === 'am' ? 'ትዕዛዞች' : 'Orders'}
            </span>
          </button>

          {/* Collections */}
          <button
            type="button"
            onClick={() => onTabChange('collections')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition ${
              currentTab === 'collections'
                ? 'text-amber-400 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <div className="relative">
              <BadgeDollarSign className="w-5 h-5" />
              {pendingVerificationCount > 0 && (
                <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-amber-500 text-stone-950 font-bold text-[9px] rounded-full flex items-center justify-center">
                  {pendingVerificationCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">
              {language === 'am' ? 'የቀን ገቢ' : 'Collect'}
            </span>
          </button>

          {/* Center Floating Quick Order Action */}
          <div className="flex-1 flex justify-center -mt-5">
            <button
              type="button"
              onClick={onOpenQuickOrder}
              className="w-13 h-13 rounded-full bg-linear-to-tr from-amber-600 to-amber-400 text-stone-950 flex flex-col items-center justify-center shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition cursor-pointer border-4 border-stone-950"
              title={t.quickOrderTitle}
            >
              <PhoneCall className="w-5 h-5" />
              <span className="text-[8px] font-black tracking-tight leading-none mt-0.5">
                {language === 'am' ? '+ትዕዛዝ' : '+Order'}
              </span>
            </button>
          </div>

          {/* Debt Ledger */}
          <button
            type="button"
            onClick={() => onTabChange('debt')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition ${
              currentTab === 'debt'
                ? 'text-amber-400 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <BookOpenText className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">
              {language === 'am' ? 'ብድር' : 'Debts'}
            </span>
          </button>

          {/* More Menu Drawer Trigger */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition ${
              drawerOpen || !['orders', 'collections', 'debt'].includes(currentTab)
                ? 'text-amber-400 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <div className="relative">
              <Menu className="w-5 h-5" />
              {openComplaintsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">
              {language === 'am' ? 'ተጨማሪ' : 'More'}
            </span>
          </button>

        </div>
      </nav>

      {/* Slide-Up Mobile "More" Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-stone-950/80 backdrop-blur-sm sm:hidden animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setDrawerOpen(false)}
          />

          <div className="relative bg-stone-900 border-t border-stone-800 rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-sm">
                  ይ
                </div>
                <div>
                  <h3 className="font-bold text-stone-100 text-sm">
                    {language === 'am' ? 'ሁሉንም ክፍሎች እና መቼቶች' : 'All Modules & Settings'}
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    {roleLabels[role][language]}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={toggleLanguage}
                className="flex items-center justify-center gap-2 p-2.5 bg-stone-800 border border-stone-700 rounded-xl text-xs font-semibold text-stone-200 transition"
              >
                <Globe className="w-4 h-4 text-amber-400" />
                <span>{language === 'am' ? 'English' : 'አማርኛ'}</span>
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center justify-center gap-2 p-2.5 bg-stone-800 border border-stone-700 rounded-xl text-xs font-semibold text-stone-200 transition"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>{language === 'am' ? 'ቀላል ሞድ' : 'Light Mode'}</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-amber-400" />
                    <span>{language === 'am' ? 'ጨለማ ሞድ' : 'Dark Mode'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Role Switcher in Drawer */}
            <div className="bg-stone-850 border border-stone-800 rounded-xl p-3 space-y-1.5">
              <label className="text-[11px] font-semibold text-stone-400">
                {language === 'am' ? 'የስራ ድርሻ ምረጥ (Role)' : 'Switch Operating Role'}
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs text-amber-400 font-semibold focus:outline-none"
              >
                <option value="OWNER">{roleLabels.OWNER[language]}</option>
                <option value="MANAGER">{roleLabels.MANAGER[language]}</option>
                <option value="ORDER_STAFF">{roleLabels.ORDER_STAFF[language]}</option>
                <option value="DELIVERY_STAFF">{roleLabels.DELIVERY_STAFF[language]}</option>
                <option value="ACCOUNTANT">{roleLabels.ACCOUNTANT[language]}</option>
              </select>
            </div>

            {/* Grid of All Application Modules */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {allTabs.map((tItem) => {
                const isActive = currentTab === tItem.id;
                return (
                  <button
                    key={tItem.id}
                    type="button"
                    onClick={() => handleSelectTab(tItem.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs transition cursor-pointer ${
                      isActive
                        ? 'bg-amber-600/20 border-amber-500/80 text-amber-400 font-bold'
                        : 'bg-stone-850/70 border-stone-800 text-stone-200 hover:bg-stone-800'
                    }`}
                  >
                    <div className={`${isActive ? 'text-amber-400' : 'text-stone-400'}`}>
                      {tItem.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{tItem.label}</div>
                      {tItem.badge !== undefined && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-stone-950">
                          {tItem.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
