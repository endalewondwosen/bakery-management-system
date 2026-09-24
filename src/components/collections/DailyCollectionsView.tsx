/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import {
  BadgeDollarSign,
  Wallet,
  Calendar,
  ArrowUpRight,
  TrendingDown,
  Building,
  CheckCircle,
  Clock
} from 'lucide-react';

export const DailyCollectionsView: React.FC = () => {
  const { t, formatCurrency, language } = useLanguage();
  const { payments, orders, expenses } = useBakeryStore();

  const [selectedDate, setSelectedDate] = useState('2026-09-24');

  // Filter verified payments for the chosen day
  const dayPayments = useMemo(() => {
    return payments.filter(
      (p) => p.paymentDate.startsWith(selectedDate) && p.verificationStatus === 'VERIFIED'
    );
  }, [payments, selectedDate]);

  // Breakdown by channel
  const collectionsBreakdown = useMemo(() => {
    let cash = 0;
    let telebirr = 0;
    let bank = 0;

    dayPayments.forEach((p) => {
      if (p.paymentMethod === 'CASH') cash += p.amount;
      else if (p.paymentMethod === 'TELEBIRR') telebirr += p.amount;
      else if (p.paymentMethod === 'BANK_TRANSFER') bank += p.amount;
    });

    return {
      cash,
      telebirr,
      bank,
      total: cash + telebirr + bank,
    };
  }, [dayPayments]);

  // Day's Sales
  const daySales = useMemo(() => {
    return orders
      .filter((o) => o.orderDate.startsWith(selectedDate) && o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orders, selectedDate]);

  // Day's Expenses
  const dayExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.date.startsWith(selectedDate))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, selectedDate]);

  const netCashFlow = collectionsBreakdown.total - dayExpenses;

  return (
    <div className="space-y-6">
      
      {/* View Header with Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
            <BadgeDollarSign className="w-5 h-5 text-amber-500" />
            <span>{t.navDailyCollections}</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            {language === 'am'
              ? 'የዕለት የጥሬ ገንዘብ፣ የቴሌብር እና የባንክ ዝውውሮች ማጠቃለያ (Section 21)'
              : 'Daily physical cash & digital channel receipts reconciliation'}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-300">
          <Calendar className="w-4 h-4 text-amber-500" />
          <span className="text-stone-400">{t.date}:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-stone-100 font-mono font-medium focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* 3 Core Collections Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Collected */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-stone-400 font-semibold mb-1">
            {language === 'am' ? 'ጠቅላላ የተሰበሰበ ገንዘብ' : 'Total Daily Collections'}
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {formatCurrency(collectionsBreakdown.total)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {dayPayments.length} {language === 'am' ? 'የተረጋገጡ ክፍያዎች' : 'verified transactions'}
          </div>
        </div>

        {/* Physical Cash */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-stone-400 font-semibold mb-1 flex items-center justify-between">
            <span>{t.methodCash}</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-stone-100 font-mono">
            {formatCurrency(collectionsBreakdown.cash)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {language === 'am' ? 'በካሳ እና በአከፋፋዮች የተሰበሰበ' : 'Cash drawer & driver collections'}
          </div>
        </div>

        {/* Telebirr */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-stone-400 font-semibold mb-1 flex items-center justify-between">
            <span>{t.methodTelebirr}</span>
            <span className="text-[10px] text-emerald-400 font-bold">SMS Verified</span>
          </div>
          <div className="text-xl font-bold text-stone-100 font-mono">
            {formatCurrency(collectionsBreakdown.telebirr)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {language === 'am' ? 'የተረጋገጡ የቴሌብር ገቢዎች' : 'Verified Telebirr merchant receipts'}
          </div>
        </div>

        {/* Bank Transfer */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-stone-400 font-semibold mb-1 flex items-center justify-between">
            <span>{t.methodBankTransfer}</span>
            <span className="text-[10px] text-emerald-400 font-bold">Bank Confirmed</span>
          </div>
          <div className="text-xl font-bold text-stone-100 font-mono">
            {formatCurrency(collectionsBreakdown.bank)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {language === 'am' ? 'CBE እና ሌሎች የባንክ ዝውውሮች' : 'CBE & commercial banking receipts'}
          </div>
        </div>
      </div>

      {/* Business Distinction Box: Sales vs Collections vs Expenses */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-stone-200 text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>{language === 'am' ? 'የቀኑ የፋይናንስ ማጠቃለያ እና ንጽጽር' : 'Daily Sales vs Collections vs Outflow Reconciliation'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="bg-stone-850 p-3.5 rounded-lg border border-stone-800">
            <div className="text-xs text-stone-400">{language === 'am' ? 'የቀኑ ሽያጭ (Orders Placed):' : "Day's Orders Invoiced:"}</div>
            <div className="text-lg font-bold font-mono text-stone-100 mt-0.5">
              {formatCurrency(daySales)}
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              {language === 'am' ? 'የተሰጡ ትዕዛዞች ጠቅላላ ዋጋ (በከፊል በብድር ጨምሮ)' : 'Total invoice value (Cash + Credit)'}
            </p>
          </div>

          <div className="bg-stone-850 p-3.5 rounded-lg border border-stone-800">
            <div className="text-xs text-stone-400">{language === 'am' ? 'የቀኑ ወጪ (Daily Expenses):' : "Day's Operational Expenses:"}</div>
            <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
              {formatCurrency(dayExpenses)}
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              {language === 'am' ? 'ለዱቄት፣ እንቁላል፣ ነዳጅ እና ስራ የወጣ' : 'Raw flour, eggs, fuel, maintenance'}
            </p>
          </div>

          <div className="bg-stone-850 p-3.5 rounded-lg border border-stone-800">
            <div className="text-xs text-stone-400">{language === 'am' ? 'የተጣራ የቀን ፈሳሽ ገቢ (Net Collected - Expense):' : 'Net Cash Realization (Collected - Expenses):'}</div>
            <div className={`text-lg font-bold font-mono mt-0.5 ${netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(netCashFlow)}
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              {language === 'am' ? 'ትክክለኛ በእጅ የቀረ ጥሬ ገንዘብ እና ዲጂታል ገቢ' : 'Actual net liquidity collected today'}
            </p>
          </div>
        </div>
      </div>

      {/* Itemized Transactions for this Day */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-3.5 bg-stone-850/60 border-b border-stone-800 flex items-center justify-between text-xs">
          <span className="font-semibold text-stone-300">
            {language === 'am' ? `በ ${selectedDate} የተሰበሰቡ ዝርዝር ክፍያዎች` : `Itemized Payments Collected on ${selectedDate}`}
          </span>
          <span className="text-stone-400 font-mono">
            {dayPayments.length} entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-800/80 text-stone-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Receipt #</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Payment Method</th>
                <th className="py-2.5 px-3">Txn Reference</th>
                <th className="py-2.5 px-3">Verified By</th>
                <th className="py-2.5 px-3 text-right">Amount Collected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {dayPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-500">
                    {language === 'am' ? 'በዚህ ቀን የተሰበሰበ ምንም ክፍያ የለም' : 'No payments collected on this date'}
                  </td>
                </tr>
              ) : (
                dayPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-800/30">
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                      {p.receiptNumber}
                    </td>
                    <td className="py-2.5 px-3 text-stone-400 font-mono text-[11px]">
                      {new Date(p.paymentDate).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-stone-200">
                      {p.customerName}
                    </td>
                    <td className="py-2.5 px-3 font-medium">
                      {p.paymentMethod}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-stone-400">
                      {p.transactionReference || 'Cash Voucher'}
                    </td>
                    <td className="py-2.5 px-3 text-stone-400 text-[11px]">
                      {p.verifiedBy || 'Staff'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(p.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
