/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import { TabType } from './Navigation.tsx';
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
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { UserRole } from '../../types/domain.ts';

interface SidebarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItemConfig {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  badgeColor?: 'amber' | 'rose';
}

interface NavGroupConfig {
  title: string;
  items: NavItemConfig[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
}) => {
  const { language, t, role } = useLanguage();
  const { pendingVerificationCount, openComplaintsCount } = useBakeryStore();

  const roleLabels: Record<UserRole, { en: string; am: string }> = {
    OWNER: { en: 'Owner', am: 'ባለቤት' },
    MANAGER: { en: 'Manager', am: 'ስራ አስኪያጅ' },
    ORDER_STAFF: { en: 'Order Staff', am: 'ትዕዛዝ ተቀባይ' },
    DELIVERY_STAFF: { en: 'Delivery Staff', am: 'አከፋፋይ' },
    ACCOUNTANT: { en: 'Accountant', am: 'የሂሳብ ባለሙያ' },
  };

  const navGroups: NavGroupConfig[] = [
    {
      title: t.navGroupDailyOps,
      items: [
        {
          id: 'dashboard',
          label: t.navDashboard,
          icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
        },
        {
          id: 'orders',
          label: t.navOrders,
          icon: <ShoppingBag className="w-5 h-5 shrink-0" />,
        },
        {
          id: 'collections',
          label: t.navDailyCollections,
          icon: <BadgeDollarSign className="w-5 h-5 shrink-0" />,
          badge: pendingVerificationCount > 0 ? pendingVerificationCount : undefined,
          badgeColor: 'amber',
        },
      ],
    },
    {
      title: t.navGroupFinance,
      items: [
        {
          id: 'customers',
          label: t.navCustomers,
          icon: <Users className="w-5 h-5 shrink-0" />,
        },
        {
          id: 'payments',
          label: t.navPayments,
          icon: <CreditCard className="w-5 h-5 shrink-0" />,
          badge: pendingVerificationCount > 0 ? pendingVerificationCount : undefined,
          badgeColor: 'amber',
        },
        {
          id: 'debt',
          label: t.navDebtLedger,
          icon: <BookOpenText className="w-5 h-5 shrink-0" />,
        },
        {
          id: 'complaints',
          label: t.navComplaints,
          icon: <MessageSquareWarning className="w-5 h-5 shrink-0" />,
          badge: openComplaintsCount > 0 ? openComplaintsCount : undefined,
          badgeColor: 'rose',
        },
      ],
    },
    {
      title: t.navGroupManagement,
      items: [
        {
          id: 'expenses',
          label: t.navExpenses,
          icon: <Receipt className="w-5 h-5 shrink-0" />,
        },
        {
          id: 'products',
          label: t.navProductsPricing,
          icon: <Package className="w-5 h-5 shrink-0" />,
        },
        {
          id: 'reports',
          label: t.navReports,
          icon: <BarChart3 className="w-5 h-5 shrink-0" />,
        },
      ],
    },
  ];

  return (
    <aside
      aria-label="Main Navigation Sidebar"
      className={`hidden md:flex flex-col bg-stone-900 border-r border-stone-800 text-stone-300 transition-all duration-200 select-none shrink-0 z-30 h-screen sticky top-0 ${
        collapsed ? 'w-20' : 'w-64 lg:w-72'
      }`}
    >
      {/* Sidebar Top: Bakery Brand & Collapse Button */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-stone-800 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-xl shadow-md shrink-0">
            ይ
          </div>
          {!collapsed && (
            <div className="min-w-0 overflow-hidden animate-fadeIn">
              <h1 className="text-base font-bold text-amber-500 tracking-tight truncate leading-tight">
                {language === 'am' ? 'ይበልጣል ዳቦ ቤት' : 'Yibeltal Bakery'}
              </h1>
              <p className="text-[11px] text-stone-400 truncate leading-tight">
                {language === 'am' ? 'የዳቦ ቤት ማኔጅመንት' : 'Bakery Operations'}
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? t.expandSidebar : t.collapseSidebar}
          aria-label={collapsed ? t.expandSidebar : t.collapseSidebar}
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition cursor-pointer shrink-0"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-amber-400" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation Group Items - Scrollable */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5 scrollbar-thin scrollbar-thumb-stone-800">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-1">
            {/* Group Title (hidden when collapsed) */}
            {!collapsed ? (
              <div className="px-3 pt-1 pb-1.5 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                {group.title}
              </div>
            ) : (
              <div className="h-px bg-stone-800 my-2 mx-2" />
            )}

            {/* Group Navigation Links */}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onTabChange(item.id)}
                    title={collapsed ? item.label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center transition-all duration-150 rounded-xl text-left cursor-pointer group relative ${
                      collapsed
                        ? 'justify-center h-11 px-0'
                        : 'gap-3 px-3.5 py-2.5 text-sm font-medium'
                    } ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-400 font-semibold shadow-xs border border-amber-500/30'
                        : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/70 border border-transparent'
                    }`}
                  >
                    {/* Active Indicator Bar on Left */}
                    {isActive && (
                      <span className="absolute left-0 inset-y-1.5 w-1 bg-amber-500 rounded-r-full" />
                    )}

                    {/* Icon */}
                    <div
                      className={`transition-colors shrink-0 ${
                        isActive
                          ? 'text-amber-400'
                          : 'text-stone-400 group-hover:text-stone-200'
                      }`}
                    >
                      {item.icon}
                    </div>

                    {/* Label & Badges */}
                    {!collapsed && (
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <span className="truncate">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span
                            className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full tabular-nums shrink-0 ${
                              item.badgeColor === 'rose'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-amber-500 text-stone-950'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Collapsed Badge Pill */}
                    {collapsed && item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-stone-900 ${
                          item.badgeColor === 'rose' ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer: Current User Role & Status */}
      <div className="p-3 border-t border-stone-800 bg-stone-900/90 shrink-0">
        {!collapsed ? (
          <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-stone-850 border border-stone-800/80 text-xs">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                {language === 'am' ? 'የስራ ድርሻ' : 'Active Role'}
              </span>
              <span className="font-semibold text-amber-400 truncate block">
                {roleLabels[role][language]}
              </span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20 shrink-0" title="System Online" />
          </div>
        ) : (
          <div className="flex justify-center py-1" title={`${roleLabels[role][language]} (Online)`}>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" />
          </div>
        )}
      </div>
    </aside>
  );
};
