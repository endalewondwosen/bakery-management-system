/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import {
  TrendingUp,
  Wallet,
  Receipt,
  AlertTriangle,
  CheckCircle,
  Truck,
  PhoneCall,
  Clock,
  ShieldAlert,
  ArrowRight,
  Plus
} from 'lucide-react';
import { OrderStatus } from '../../types/domain.ts';
import { DashboardAnalyticsCharts } from './DashboardAnalyticsCharts.tsx';
import { useToast } from '../common/ToastContext.tsx';

interface DashboardViewProps {
  onOpenQuickOrder: () => void;
  onOpenRecordPayment: (orderId?: string, customerId?: string) => void;
  onOpenRecordExpense: () => void;
  onSelectCustomer: (customerId: string) => void;
  onSelectOrder: (orderId: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenQuickOrder,
  onOpenRecordPayment,
  onOpenRecordExpense,
  onSelectCustomer,
  onSelectOrder,
  onNavigateTab,
}) => {
  const { t, formatCurrency, language } = useLanguage();
  const { showSuccess, showWarning } = useToast();
  const {
    todaySales,
    todayCollections,
    todayExpensesTotal,
    totalOutstandingDebt,
    orders,
    payments,
    complaints,
    verifyPayment,
    rejectPayment,
    updateOrderStatus,
    getOrderOutstandingAmount,
  } = useBakeryStore();

  const pendingPayments = payments.filter((p) => p.verificationStatus === 'PENDING_VERIFICATION');
  const activeDeliveries = orders.filter(
    (o) => o.status === 'PREPARING' || o.status === 'READY' || o.status === 'OUT_FOR_DELIVERY'
  );
  const openComplaints = complaints.filter((c) => c.status === 'OPEN' || c.status === 'UNDER_REVIEW');
  const recentOrders = orders.slice(0, 6);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Action Bar */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-stone-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-100">
                {language === 'am' ? 'የዛሬ የስራ እንቅስቃሴ ዳሽቦርድ' : "Today's Bakery Operations"}
              </h2>
            </div>
            <p className="text-sm text-stone-400 mt-1">
              {t.salesVsCashExplanation}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenQuickOrder}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow transition"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{t.newOrder}</span>
            </button>
            <button
              onClick={() => onOpenRecordPayment()}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-sm font-medium transition"
            >
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>{t.recordPayment}</span>
            </button>
            <button
              onClick={onOpenRecordExpense}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-sm font-medium transition"
            >
              <Receipt className="w-4 h-4 text-rose-400" />
              <span>{t.logExpense}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Financial Metrics - Ergonomic High Glanceability Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today's Sales */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm hover:border-amber-500/50 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-stone-300 dark:text-stone-300">{t.todaySales}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-100 font-mono tracking-tight">
            {formatCurrency(todaySales)}
          </div>
          <p className="text-xs text-stone-400 font-medium mt-1">
            {language === 'am' ? 'የተመዘገቡ የዕለቱ ትዕዛዞች ድምር' : 'Total value of orders logged today'}
          </p>
        </div>

        {/* Metric 2: Today's Collections */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm hover:border-emerald-500/50 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-stone-300 dark:text-stone-300">{t.todayCollections}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
            {formatCurrency(todayCollections.total)}
          </div>
          <p className="text-xs text-stone-400 font-medium mt-1">
            {language === 'am' ? 'በጥሬ እና በተረጋገጠ ባንክ/ቴሌብር የገባ' : 'Cash + Verified Telebirr/Bank'}
          </p>
        </div>

        {/* Metric 3: Total Outstanding Debt */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm hover:border-amber-500/50 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-stone-300 dark:text-stone-300">{t.outstandingReceivables}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tracking-tight">
            {formatCurrency(totalOutstandingDebt)}
          </div>
          <p className="text-xs text-stone-400 font-medium mt-1">
            {language === 'am' ? 'በደንበኞች ላይ ያለ ቀሪ የብድር ሂሳብ' : 'Total uncollected customer balances'}
          </p>
        </div>

        {/* Metric 4: Today's Expenses */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm hover:border-rose-500/50 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-stone-300 dark:text-stone-300">{t.todayExpenses}</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono tracking-tight">
            {formatCurrency(todayExpensesTotal)}
          </div>
          <p className="text-xs text-stone-400 font-medium mt-1">
            {language === 'am' ? 'ዱቄት፣ እንቁላል፣ ነዳጅ እና ሌሎች ወጪዎች' : 'Flour, eggs, fuel & operations'}
          </p>
        </div>
      </div>

      {/* Visual Analytics & Graphs Section */}
      <DashboardAnalyticsCharts />

      {/* Daily Collections Breakdown Box (Section 21 in Requirements) */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            {t.dailyFinancialReconciliation}
          </h3>
          <button
            onClick={() => onNavigateTab('collections')}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
          >
            {language === 'am' ? 'ሙሉ የቀን ገቢ ይመልከቱ' : 'View Detailed Collections'}
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-stone-800/80 border border-stone-700/80 rounded-lg p-3">
            <div className="text-xs text-stone-400">{t.cashCollection}</div>
            <div className="text-lg font-bold text-stone-100 mt-0.5">
              {formatCurrency(todayCollections.cash)}
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              {language === 'am' ? 'በእጅ የተሰበሰበ ጥሬ ገንዘብ' : 'Physical cash drawer'}
            </div>
          </div>

          <div className="bg-stone-800/80 border border-stone-700/80 rounded-lg p-3">
            <div className="text-xs text-stone-400">{t.telebirrCollection}</div>
            <div className="text-lg font-bold text-stone-100 mt-0.5">
              {formatCurrency(todayCollections.telebirr)}
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              {language === 'am' ? 'የተረጋገጠ የቴሌብር ዝውውር' : 'Verified Telebirr transactions'}
            </div>
          </div>

          <div className="bg-stone-800/80 border border-stone-700/80 rounded-lg p-3">
            <div className="text-xs text-stone-400">{t.bankCollection}</div>
            <div className="text-lg font-bold text-stone-100 mt-0.5">
              {formatCurrency(todayCollections.bankTransfer)}
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              {language === 'am' ? 'CBE እና ሌሎች የባንክ ዝውውሮች' : 'Direct bank deposits & CBE'}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Verification Queue + Active Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Verification Queue (Telebirr/Bank SMS) */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-stone-200">
                  {t.pendingVerificationNotice} ({pendingPayments.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('payments')}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium"
              >
                {t.all}
              </button>
            </div>

            {pendingPayments.length === 0 ? (
              <div className="py-8 text-center text-stone-500 text-xs">
                <CheckCircle className="w-7 h-7 mx-auto text-emerald-500/50 mb-1.5" />
                {language === 'am'
                  ? 'ሁሉም የቴሌብር እና የባንክ ክፍያዎች ተረጋግጠዋል።'
                  : 'All Telebirr and bank payments have been verified.'}
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-3 rounded-lg bg-stone-800/70 border border-amber-900/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-stone-200">
                        {payment.customerName}
                      </div>
                      <div className="text-stone-400 flex items-center gap-2 mt-0.5">
                        <span className="text-amber-400 font-mono font-medium">
                          {formatCurrency(payment.amount)}
                        </span>
                        <span>·</span>
                        <span>{payment.paymentMethod}</span>
                        {payment.transactionReference && (
                          <>
                            <span>·</span>
                            <span className="font-mono bg-stone-900 px-1 py-0.5 rounded text-stone-300">
                              {payment.transactionReference}
                            </span>
                          </>
                        )}
                      </div>
                      {payment.notes && (
                        <div className="text-[11px] text-stone-400 italic mt-0.5">
                          {payment.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          verifyPayment(payment.id, 'Bakery Owner');
                          showSuccess(
                            language === 'am' ? 'ክፍያ ተረጋገጠ!' : 'Payment Verified!',
                            language === 'am'
                              ? `የ${formatCurrency(payment.amount)} ክፍያ ተረጋግጧል (${payment.customerName})`
                              : `Payment of ${formatCurrency(payment.amount)} for ${payment.customerName} verified & confirmed`
                          );
                        }}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition"
                      >
                        {t.verify}
                      </button>
                      <button
                        onClick={() => {
                          rejectPayment(payment.id);
                          showWarning(
                            language === 'am' ? 'ክፍያ ውድቅ ተደረገ' : 'Payment Rejected',
                            language === 'am'
                              ? `የ${formatCurrency(payment.amount)} ክፍያ ውድቅ ተደርጓል`
                              : `Payment of ${formatCurrency(payment.amount)} rejected`
                          );
                        }}
                        className="px-2 py-1 rounded bg-stone-700 hover:bg-stone-600 text-stone-300 text-xs transition"
                      >
                        {t.reject}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Deliveries */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-stone-200">
                {t.activeDeliveries} ({activeDeliveries.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium"
            >
              {t.all}
            </button>
          </div>

          {activeDeliveries.length === 0 ? (
            <div className="py-8 text-center text-stone-500 text-xs">
              <CheckCircle className="w-7 h-7 mx-auto text-stone-600 mb-1.5" />
              {language === 'am' ? 'በአሁኑ ሰዓት በማድረስ ላይ ያለ ትዕዛዝ የለም' : 'No active deliveries in queue'}
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeDeliveries.map((order) => (
                <div
                  key={order.id}
                  className="p-3 rounded-lg bg-stone-800/70 border border-stone-700/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-200 truncate">
                        {order.organizationName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-700 text-stone-300 font-mono">
                        {order.orderNumber}
                      </span>
                    </div>
                    <div className="text-stone-400 mt-0.5 truncate">
                      {order.deliveryAddress || order.branch}
                    </div>
                    <div className="text-[11px] text-amber-400/90 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{order.scheduledTime}</span>
                      {order.driverName && <span>· {order.driverName}</span>}
                    </div>
                  </div>

                  {/* Status transition dropdown/button */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'READY')}
                        className="px-2.5 py-1 rounded bg-stone-700 hover:bg-stone-600 text-stone-200 font-medium"
                      >
                        {language === 'am' ? 'ዝግጁ አድርግ' : 'Mark Ready'}
                      </button>
                    )}
                    {order.status === 'READY' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'OUT_FOR_DELIVERY')}
                        className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold"
                      >
                        {language === 'am' ? 'አከፋፍል' : 'Dispatch'}
                      </button>
                    )}
                    {order.status === 'OUT_FOR_DELIVERY' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'DELIVERED', new Date().toLocaleTimeString())}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                      >
                        {language === 'am' ? 'ደርሷል' : 'Delivered'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-stone-200">
            {t.recentOrders}
          </h3>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
          >
            {language === 'am' ? 'ሁሉንም ትዕዛዞች ይመልከቱ' : 'View All Orders'}
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-800/80 text-stone-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Order #</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Total</th>
                <th className="py-2.5 px-3">Outstanding</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {recentOrders.map((ord) => {
                const outstanding = getOrderOutstandingAmount(ord.id);
                return (
                  <tr key={ord.id} className="hover:bg-stone-800/40 transition">
                    <td className="py-2.5 px-3 font-mono font-medium text-amber-400">
                      {ord.orderNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => onSelectCustomer(ord.customerId)}
                        className="font-medium text-stone-200 hover:text-amber-400 text-left cursor-pointer"
                      >
                        {ord.organizationName}
                      </button>
                      <div className="text-[11px] text-stone-500">{ord.branch || ord.customerName}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-stone-300">
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium">
                      {formatCurrency(ord.totalAmount)}
                    </td>
                    <td className="py-2.5 px-3">
                      {outstanding > 0 ? (
                        <span className="text-amber-400 font-medium">
                          {formatCurrency(outstanding)}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium">
                          {language === 'am' ? 'ሙሉ ተከፍሏል' : 'Paid in Full'}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-2">
                      <button
                        onClick={() => onSelectOrder(ord.id)}
                        className="text-stone-300 hover:text-amber-400 font-medium"
                      >
                        {t.view}
                      </button>
                      {outstanding > 0 && (
                        <button
                          onClick={() => onOpenRecordPayment(ord.id, ord.customerId)}
                          className="text-emerald-400 hover:text-emerald-300 font-medium"
                        >
                          {t.recordPayment}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
