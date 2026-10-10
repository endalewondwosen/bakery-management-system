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
  RotateCcw,
  FileSpreadsheet,
  Printer
} from 'lucide-react';
import { CashierHandoverModal } from './CashierHandoverModal.tsx';

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

  // Expense breakdown by recurrence period
  const expensePeriodBreakdown = useMemo(() => {
    let daily = 0;
    let monthly = 0;
    let yearly = 0;
    expenses.forEach((e) => {
      const p = e.expensePeriod || 'DAILY';
      if (p === 'DAILY') daily += e.amount;
      else if (p === 'MONTHLY') monthly += e.amount;
      else yearly += e.amount;
    });
    return { daily, monthly, yearly, total: daily + monthly + yearly };
  }, [expenses]);

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

  const [isCashierHandoverOpen, setIsCashierHandoverOpen] = useState(false);

  // Export Daily P&L Statement to CSV
  const handleExportPnLCSV = () => {
    const today = new Date().toISOString().slice(0, 10);
    const headers = ['Financial Metric / Category', 'Amount (ETB)', 'Notes / Description'];
    const rows = [
      ['Gross Sales Invoiced', totalSalesInvoiced, 'Total billed orders placed'],
      ['Verified Cash & Digital Collections', totalVerifiedCollections, 'Realized liquidity in hand'],
      ['Cash Channel Collections', paymentMethodBreakdown.cash, 'Physical cash received'],
      ['Telebirr Channel Collections', paymentMethodBreakdown.telebirr, 'Mobile money received'],
      ['CBE Bank Transfer Collections', paymentMethodBreakdown.bank, 'Direct bank deposits'],
      ['Total Operating Expenses', totalExpenses, 'All operational cost categories'],
      ['Daily Operational Expenses', expensePeriodBreakdown.daily, 'Flour, yeast, fuel, eggs'],
      ['Monthly Overhead Expenses', expensePeriodBreakdown.monthly, 'Staff salaries, rent, utilities'],
      ['Yearly Administrative Expenses', expensePeriodBreakdown.yearly, 'Trade license, insurance'],
      ['Gross Operating Profit (Invoiced - Expenses)', operatingProfit, 'Accrual margin'],
      ['Realized Net Cash Flow (Collected - Expenses)', realizedNetCash, 'Cash margin available'],
      ['Total Accounts Receivable (Outstanding Debt)', totalOutstandingDebt, 'Uncollected customer debt'],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `PnL_Financial_Statement_${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Product Sales Performance to CSV
  const handleExportProductPerformanceCSV = () => {
    const today = new Date().toISOString().slice(0, 10);
    const headers = ['Product ID', 'Name (English)', 'Name (Amharic)', 'Category', 'Base Price (ETB)', 'Total Units Sold', 'Total Revenue (ETB)', 'Revenue Share %'];
    const rows = productPerformance.map(({ product, qty, revenue }) => {
      const sharePct = totalSalesInvoiced > 0 ? Math.round((revenue / totalSalesInvoiced) * 100) : 0;
      return [
        product.id,
        `"${product.nameEn}"`,
        `"${product.nameAm}"`,
        product.category,
        product.basePrice,
        qty,
        revenue,
        `${sharePct}%`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Product_Sales_Performance_${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Outstanding Debt Aging to CSV
  const handleExportDebtorsCSV = () => {
    const today = new Date().toISOString().slice(0, 10);
    const headers = ['Customer ID', 'Organization', 'Contact Person', 'Phone', 'Branch / Location', 'Total Invoiced (ETB)', 'Total Paid (ETB)', 'Outstanding Debt (ETB)', 'Status'];
    const rows = customers.map((c) => {
      const bal = getCustomerBalance(c.id);
      return [
        c.id,
        `"${c.organizationName}"`,
        `"${c.name}"`,
        `"${c.phone}"`,
        `"${c.branch || c.address}"`,
        bal.totalInvoiced,
        bal.totalPaid,
        bal.outstandingBalance,
        bal.outstandingBalance > 0 ? 'HAS_DEBT' : 'CLEARED'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Accounts_Receivable_Debt_Aging_${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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

        <div className="flex items-center gap-2 flex-wrap">
          {/* Cashier Shift Handover Reconciliation Slip Button */}
          <button
            onClick={() => setIsCashierHandoverOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{language === 'am' ? 'የዕለት ሂሳብ ማስረከቢያ (Handover)' : 'Cashier Handover Slip'}</span>
          </button>

          {/* Export P&L CSV */}
          <button
            onClick={handleExportPnLCSV}
            title="Download Profit & Loss CSV"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-200 border border-stone-700 text-xs font-semibold transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'am' ? 'የትርፍና ኪሳራ (P&L)' : 'Export P&L'}</span>
          </button>

          {/* Export Full System Backup */}
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Backup</span>
          </button>

          <button
            onClick={() => {
              if (confirm(language === 'am' ? 'ሁሉንም ዳታ ወደ መጀመሪያው ሁኔታ መመለስ ይፈልጋሉ?' : 'Reset to original seed demo data?')) {
                resetToInitialData();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-850 hover:bg-rose-950/60 text-stone-400 hover:text-rose-400 border border-stone-700 text-xs transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'am' ? 'ዳታ አድስ' : 'Reset'}</span>
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

      {/* VISUAL CHART: Financial Flow Comparison Bar Graph */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-stone-100">
              {t.financialOverviewChart}
            </h3>
          </div>
          <span className="text-xs text-stone-400 font-mono">
            {language === 'am' ? 'የሽያጭ፣ የተሰበሰበ እና የወጪ ንጽጽር' : 'Sales vs Collections vs Expenses vs Profit'}
          </span>
        </div>

        {/* 4 Pillars Visual Relative Horizontal Graph */}
        <div className="space-y-3.5">
          {(() => {
            const maxVal = Math.max(totalSalesInvoiced, totalVerifiedCollections, totalExpenses, Math.abs(operatingProfit), 1);

            const items = [
              {
                label: language === 'am' ? '1. የተሸጠ ጠቅላላ ዳቦ (Invoiced Sales)' : '1. Total Invoiced Sales',
                amount: totalSalesInvoiced,
                pct: Math.round((totalSalesInvoiced / maxVal) * 100),
                color: 'bg-blue-500',
                textColor: 'text-blue-400',
              },
              {
                label: language === 'am' ? '2. በእጅ የተሰበሰበ ገቢ (Verified Collections)' : '2. Verified Collected Cash',
                amount: totalVerifiedCollections,
                pct: Math.round((totalVerifiedCollections / maxVal) * 100),
                color: 'bg-emerald-500',
                textColor: 'text-emerald-400',
              },
              {
                label: language === 'am' ? '3. የተመዘገቡ ወጪዎች (Total Expenses)' : '3. Total Operating & Fixed Expenses',
                amount: totalExpenses,
                pct: Math.round((totalExpenses / maxVal) * 100),
                color: 'bg-rose-500',
                textColor: 'text-rose-400',
              },
              {
                label: language === 'am' ? '4. የተጣራ ትርፍ (Accrual Profit)' : '4. Net Operating Margin',
                amount: operatingProfit,
                pct: Math.round((Math.max(0, operatingProfit) / maxVal) * 100),
                color: operatingProfit >= 0 ? 'bg-amber-500' : 'bg-rose-700',
                textColor: operatingProfit >= 0 ? 'text-amber-400' : 'text-rose-400',
              },
            ];

            return items.map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-300 font-medium">{item.label}</span>
                  <span className={`font-mono font-bold ${item.textColor}`}>
                    {formatCurrency(item.amount)}
                  </span>
                </div>
                <div className="h-3 w-full bg-stone-800 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${Math.max(4, item.pct)}%` }}
                    className={`h-full rounded-full transition-all duration-700 ${item.color}`}
                  />
                </div>
              </div>
            ));
          })()}
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
            <button
              onClick={handleExportProductPerformanceCSV}
              title="Download Product CSV"
              className="flex items-center gap-1 px-2 py-1 rounded bg-stone-800 hover:bg-stone-750 text-stone-300 text-[11px] border border-stone-700 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
              <span>CSV</span>
            </button>
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
              {productPerformance.map(({ product, qty, revenue }) => {
                const sharePct = Math.round((revenue / (totalSalesInvoiced || 1)) * 100);
                return (
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
                    <td className="py-2.5 px-3 text-right font-mono">
                      <div className="font-bold text-stone-100">
                        {formatCurrency(revenue)}
                      </div>
                      <div className="flex items-center justify-end gap-1.5 mt-0.5">
                        <div className="w-16 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.max(5, sharePct)}%` }}
                            className="h-full bg-amber-500 rounded-full"
                          />
                        </div>
                        <span className="text-[10px] text-stone-400 font-mono">{sharePct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
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

          {/* Expense Nature Breakdown: Daily vs Monthly vs Yearly */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-3 text-xs">
            <h4 className="font-semibold text-stone-200 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-rose-500" />
              <span>{language === 'am' ? 'የወጪዎች ክፍፍል በጊዜ (ዕለታዊ / ወርሃዊ / ዓመታዊ)' : 'Expense Nature (Daily / Monthly / Yearly)'}</span>
            </h4>

            <div className="space-y-2">
              <div className="flex justify-between items-center bg-stone-850 p-2.5 rounded-lg border border-stone-800">
                <div>
                  <span className="text-rose-300 font-medium block">{t.dailyExpenses}</span>
                  <span className="text-[10px] text-stone-500">
                    {language === 'am' ? 'ዱቄት፣ ነዳጅ፣ እንቁላል፣ ጥሬ ዕቃዎች' : 'Flour, fuel, eggs & daily stock'}
                  </span>
                </div>
                <span className="font-mono font-bold text-rose-400">{formatCurrency(expensePeriodBreakdown.daily)}</span>
              </div>

              <div className="flex justify-between items-center bg-stone-850 p-2.5 rounded-lg border border-stone-800">
                <div>
                  <span className="text-amber-300 font-medium block">{t.monthlyExpenses}</span>
                  <span className="text-[10px] text-stone-500">
                    {language === 'am' ? 'የሰራተኞች ደመወዝ፣ ኪራይ፣ መብራት' : 'Salaries, rent & utilities'}
                  </span>
                </div>
                <span className="font-mono font-bold text-amber-400">{formatCurrency(expensePeriodBreakdown.monthly)}</span>
              </div>

              <div className="flex justify-between items-center bg-stone-850 p-2.5 rounded-lg border border-stone-800">
                <div>
                  <span className="text-blue-300 font-medium block">{t.yearlyExpenses}</span>
                  <span className="text-[10px] text-stone-500">
                    {language === 'am' ? 'ንግድ ፈቃድ እድሳት፣ ኢንሹራንስ' : 'Trade license & vehicle insurance'}
                  </span>
                </div>
                <span className="font-mono font-bold text-blue-400">{formatCurrency(expensePeriodBreakdown.yearly)}</span>
              </div>
            </div>
          </div>

          {/* Top 5 Debtors List */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-stone-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>{language === 'am' ? 'ከፍተኛ ዕዳ ያለባቸው ደንበኞች' : 'Top Debt Balances'}</span>
              </h4>
              <button
                onClick={handleExportDebtorsCSV}
                title="Download All Debtors CSV"
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-750 text-stone-300 text-[10px] border border-stone-700 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                <span>All CSV</span>
              </button>
            </div>

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

      {/* Daily Cashier Handover Reconciliation Modal */}
      <CashierHandoverModal
        isOpen={isCashierHandoverOpen}
        onClose={() => setIsCashierHandoverOpen(false)}
      />
    </div>
  );
};
