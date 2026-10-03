/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  CreditCard,
  BookOpenText,
  BadgeDollarSign,
  Receipt,
  MessageSquareWarning,
  Package,
  BarChart3
} from 'lucide-react';

export type TabType = 
  | 'dashboard'
  | 'orders'
  | 'customers'
  | 'payments'
  | 'debt'
  | 'collections'
  | 'expenses'
  | 'complaints'
  | 'products'
  | 'reports';

interface NavigationProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const { t } = useLanguage();
  const { pendingVerificationCount, openComplaintsCount } = useBakeryStore();

  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: t.navDashboard, icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'orders', label: t.navOrders, icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'customers', label: t.navCustomers, icon: <Users className="w-4 h-4" /> },
    { 
      id: 'payments', 
      label: t.navPayments, 
      icon: <CreditCard className="w-4 h-4" />, 
      badge: pendingVerificationCount > 0 ? pendingVerificationCount : undefined 
    },
    { id: 'debt', label: t.navDebtLedger, icon: <BookOpenText className="w-4 h-4" /> },
    { id: 'collections', label: t.navDailyCollections, icon: <BadgeDollarSign className="w-4 h-4" /> },
    { id: 'expenses', label: t.navExpenses, icon: <Receipt className="w-4 h-4" /> },
    { 
      id: 'complaints', 
      label: t.navComplaints, 
      icon: <MessageSquareWarning className="w-4 h-4" />,
      badge: openComplaintsCount > 0 ? openComplaintsCount : undefined
    },
    { id: 'products', label: t.navProductsPricing, icon: <Package className="w-4 h-4" /> },
    { id: 'reports', label: t.navReports, icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <nav className="hidden sm:block bg-stone-900/95 border-b border-stone-800 text-stone-300 overflow-x-auto scrollbar-none sticky top-16 z-20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 py-1 min-w-max">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition relative ${
                  isActive
                    ? 'bg-amber-600/20 text-amber-400 font-semibold border-b-2 border-amber-500'
                    : 'text-stone-400 hover:text-stone-100 hover:bg-stone-800/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-amber-500 text-stone-950 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
