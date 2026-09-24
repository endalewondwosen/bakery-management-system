/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import {
  BarChart3,
  TrendingUp,
  Receipt,
  Wallet,
  AlertTriangle,
  Package,
  Layers,
  Download,
  RotateCcw
} from 'lucide-react';

export const FinancialReportsView: React.FC = () => {
  const { t, formatCurrency, language } = useLanguage();
  const {
    orders,
    payments,
    expenses,
    orderItems,
    products,
    customers,
    getCustomerBalance,
    totalOutstandingDebt,
    resetToInitialData,
  } = useBakeryStore();

  const [dateRange, setDateRange] = useState<'ALL' | 'TODAY'>('ALL');

  const totalSalesInvoiced = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orders]);

  const totalVerifiedCollections = useMemo(() => {
    return payments
      .filter((p) => p.verificationStatus === 'VERIFIED')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // Product sales performance breakdown
  const productPerformance = useMemo(() => {
    const map: Record<string, { qty: number; revenue: number }> = {};
    products.forEach((p) => {
      map[p.id] = { qty: 0, revenue: 0 };
    });

    orderItems.forEach((item) => {
      if (!map[item.productId]) {
        map[item.productId] = { qty: 0, revenue: 0 };
      }
      map[item.productId].qty += item.quantity;
      map[item.productId].revenue += item.subtotal;
    });

    return products.map((p) => ({
      product: p,
      qty: map[p.id]?.qty || 0,
      revenue: map[p.id]?.revenue || 0,
    })).sort((a, b) => b.revenue - a.revenue);
  }, [products, orderItems]);

  // Payment method breakdown
  const paymentMethodBreakdown = useMemo(() => {
    let cash = 0;
    let telebirr = 0;
    let bank = 0;
    payments.forEach((p) => {
      if (p.verificationStatus === 'VERIFIED') {
        if (p.paymentMethod === 'CASH') cash += p.amount;
        else if (p.paymentMethod === 'TELEBIRR') telebirr += p.amount;
        else if (p.paymentMethod === 'BANK_TRANSFER') bank += p.amount;
      }
    });
    return { cash, telebirr, bank, total: cash + telebirr + bank };
  }, [payments]);

  // Operational Profit vs Realized Liquidity
  const operatingProfit = totalSalesInvoiced - totalExpenses;
  const realizedNetCash = totalVerifiedCollections - totalExpenses;

  // Top Debtors
  const topDebtors = useMemo(() => {
    return customers
      .map((c) => ({
        customer: c,
        ...getCustomerBalance(c.id),
      }))
      .filter((item) => item.outstandingBalance > 0)
      .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
      .slice(0, 5);
  }, [customers, getCustomerBalance]);

  const handleExportJSON = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      orders,
      payments,
      expenses,
      customers,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bakery-system-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <span>{t.navReports}</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            {language === 'am'
              ? 'የሽያጭ፣ የገንዘብ ስብስብ፣ የወጪ እና የትርፍ አጠቃላይ የፋይናንስ ሪፖርት'
              : 'Holistic revenue, collection liquidity, profit margins and debt exposure'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'am' ? 'ዳታ አስቀምጥ (Export)' : 'Export Backup'}</span>
          </button>
          <button
            onClick={() => {
              if (confirm(language === 'am' ? 'ሁሉንም ዳታ ወደ መጀመሪያው ሁኔታ መመለስ ይፈልጋሉ?' : 'Reset to original seed demo data?')) {
                resetToInitialData();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-rose-950/60 text-stone-400 hover:text-rose-400 border border-stone-700 text-xs transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'am' ? 'ዳታ አድስ (Reset)' : 'Reset Demo'}</span>
          </button>
        </div>
      </div>

      {/* Main KPI Quad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-stone-400 font-semibold mb-1">
            {language === 'am' ? 'ጠቅላላ የተሸጠ (Invoiced)' : 'Total Sales Invoiced'}
          </div>
          <div className="text-2xl font-bold text-stone-100 font-mono">
            {formatCurrency(totalSalesInvoiced)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {orders.length} {language === 'am' ? 'ጠቅላላ ትዕዛዞች' : 'total orders placed'}
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-stone-400 font-semibold mb-1">
            {language === 'am' ? 'ጠቅላላ የተሰበሰበ (Collections)' : 'Total Collections'}
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {formatCurrency(totalVerifiedCollections)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {language === 'am' ? 'የተረጋገጠ በእጅ የገባ ገንዘብ' : 'Verified collected cash & digital'}
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-stone-400 font-semibold mb-1">{t.outstandingReceivables}</div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {formatCurrency(totalOutstandingDebt)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {topDebtors.length} {language === 'am' ? 'ባለዕዳ ደንበኞች' : 'active debtor accounts'}
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-stone-400 font-semibold mb-1">
            {language === 'am' ? 'ጠቅላላ ወጪዎች (Expenses)' : 'Total Expenses'}
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">
            {formatCurrency(totalExpenses)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {expenses.length} {language === 'am' ? 'የተመዘገቡ ወጪዎች' : 'expense entries'}
          </div>
        </div>
      </div>

      {/* Financial Realization Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Accrual Operating Profit */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-stone-200 text-sm">
              {language === 'am' ? 'የትርፍ ስሌት (Sales - Expenses)' : 'Accrual Operating Profit (Sales - Expenses)'}
            </h3>
            <span className="text-[10px] bg-stone-800 text-stone-400 px-2 py-0.5 rounded font-mono">
              Invoiced Based
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-stone-400">
              <span>{language === 'am' ? 'የሽያጭ ድምር:' : 'Total Sales:'}</span>
              <span className="font-mono text-stone-200">{formatCurrency(totalSalesInvoiced)}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>{language === 'am' ? 'የወጪ ድምር:' : 'Total Expenses:'}</span>
              <span className="font-mono text-rose-400">- {formatCurrency(totalExpenses)}</span>
            </div>
            <div className="pt-2 border-t border-stone-800 flex justify-between text-sm font-bold">
              <span className="text-stone-200">{language === 'am' ? 'የስራ ማስኬጃ ትርፍ:' : 'Operating Profit:'}</span>
              <span className={`font-mono ${operatingProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(operatingProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Realized Cash In Hand */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-stone-200 text-sm">
              {language === 'am' ? 'ትክክለኛ የተጣራ ፈሳሽ ገቢ (Collections - Expenses)' : 'Realized Liquidity (Collected - Expenses)'}
            </h3>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded font-mono">
              Cash Realized
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-stone-400">
              <span>{language === 'am' ? 'የተሰበሰበ ገቢ:' : 'Total Collected:'}</span>
              <span className="font-mono text-emerald-400">{formatCurrency(totalVerifiedCollections)}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>{language === 'am' ? 'የወጪ ድምር:' : 'Total Expenses:'}</span>
              <span className="font-mono text-rose-400">- {formatCurrency(totalExpenses)}</span>
            </div>
            <div className="pt-2 border-t border-stone-800 flex justify-between text-sm font-bold">
              <span className="text-stone-200">{language === 'am' ? 'በእጅ የቀረ የተጣራ ገንዘብ:' : 'Net Liquidity in Hand:'}</span>
              <span className={`font-mono ${realizedNetCash >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(realizedNetCash)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Performance Table & Channel Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Products Sold Table */}
        <div className="lg:col-span-2 bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3.5 bg-stone-850/60 border-b border-stone-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-stone-200 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-amber-500" />
              <span>{language === 'am' ? 'የዳቦ ሽያጭ አፈጻጸም በዓይነት' : 'Product Sales Volume & Revenue'}</span>
            </span>
          </div>

          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-800/80 text-stone-400 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Bread Variety</th>
                <th className="py-2.5 px-3 text-center">Total Quantity</th>
                <th className="py-2.5 px-3 text-right">Standard Price</th>
                <th className="py-2.5 px-3 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {productPerformance.map(({ product, qty, revenue }) => (
                <tr key={product.id} className="hover:bg-stone-800/30">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-stone-100">
                      {language === 'am' ? product.nameAm : product.nameEn}
                    </div>
                    <div className="text-[10px] text-stone-500">
                      {language === 'am' ? product.nameEn : product.nameAm}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-400">
                    {qty} pcs
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-stone-400">
                    {formatCurrency(product.basePrice)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-100">
                    {formatCurrency(revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payment Channels & Top Debtors */}
        <div className="space-y-4">
          
          {/* Payment Methods */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-3 text-xs">
            <h4 className="font-semibold text-stone-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-500" />
              <span>{language === 'am' ? 'የገንዘብ መሰብሰቢያ ቻናሎች' : 'Collection Channels'}</span>
            </h4>

            <div className="space-y-2">
              <div className="flex justify-between items-center bg-stone-850 p-2.5 rounded-lg border border-stone-800">
                <span className="text-stone-300">{t.methodCash}</span>
                <span className="font-mono font-bold text-stone-100">{formatCurrency(paymentMethodBreakdown.cash)}</span>
              </div>
              <div className="flex justify-between items-center bg-stone-850 p-2.5 rounded-lg border border-stone-800">
                <span className="text-stone-300">{t.methodTelebirr}</span>
                <span className="font-mono font-bold text-emerald-400">{formatCurrency(paymentMethodBreakdown.telebirr)}</span>
              </div>
              <div className="flex justify-between items-center bg-stone-850 p-2.5 rounded-lg border border-stone-800">
                <span className="text-stone-300">{t.methodBankTransfer}</span>
                <span className="font-mono font-bold text-sky-400">{formatCurrency(paymentMethodBreakdown.bank)}</span>
              </div>
            </div>
          </div>

          {/* Top 5 Debtors List */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-3 text-xs">
            <h4 className="font-semibold text-stone-200 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>{language === 'am' ? 'ከፍተኛ ዕዳ ያለባቸው ደንበኞች' : 'Top Debt Balances'}</span>
            </h4>

            <div className="space-y-1.5">
              {topDebtors.map(({ customer, outstandingBalance }) => (
                <div key={customer.id} className="flex justify-between items-center p-2 rounded bg-stone-850 border border-stone-800">
                  <div className="truncate mr-2">
                    <span className="font-medium text-stone-200">{customer.organizationName}</span>
                    <span className="text-[10px] text-stone-500 block">{customer.branch || customer.phone}</span>
                  </div>
                  <span className="font-mono font-bold text-amber-400 shrink-0">
                    {formatCurrency(outstandingBalance)}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
