/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * End-of-Day Cashier Handover & Shift Reconciliation Slip
 * Computes opening cash drawer float, daily cash/Telebirr/CBE collections,
 * direct cash expense disbursements, and calculates physical cash variance with signature sign-off.
 */

import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import {
  X,
  Printer,
  Calendar,
  Wallet,
  Receipt,
  Building,
  CheckCircle2,
  AlertTriangle,
  Scale,
  FileSpreadsheet
} from 'lucide-react';

interface CashierHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashierHandoverModal: React.FC<CashierHandoverModalProps> = ({ isOpen, onClose }) => {
  const { language, formatCurrency } = useLanguage();
  const { payments, expenses } = useBakeryStore();

  const [shiftDate, setShiftDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [cashierName, setCashierName] = useState<string>('Kidus Tadesse');
  const [shiftPeriod, setShiftPeriod] = useState<string>('Day Shift (06:00 AM - 04:00 PM)');
  const [openingFloat, setOpeningFloat] = useState<number>(1000); // 1,000 ETB starting small change
  const [actualCountedCash, setActualCountedCash] = useState<number>(0);
  const [isCashCountEntered, setIsCashCountEntered] = useState<boolean>(false);

  // Filter payments for selected date
  const dayPayments = useMemo(() => {
    return payments.filter((p) => p.paymentDate.startsWith(shiftDate) && p.verificationStatus === 'VERIFIED');
  }, [payments, shiftDate]);

  // Filter expenses for selected date
  const dayExpenses = useMemo(() => {
    return expenses.filter((e) => e.date.startsWith(shiftDate));
  }, [expenses, shiftDate]);

  // Breakdown by channel
  const cashCollected = useMemo(() => {
    return dayPayments.filter((p) => p.paymentMethod === 'CASH').reduce((sum, p) => sum + p.amount, 0);
  }, [dayPayments]);

  const telebirrCollected = useMemo(() => {
    return dayPayments.filter((p) => p.paymentMethod === 'TELEBIRR').reduce((sum, p) => sum + p.amount, 0);
  }, [dayPayments]);

  const bankCollected = useMemo(() => {
    return dayPayments.filter((p) => p.paymentMethod === 'BANK_TRANSFER').reduce((sum, p) => sum + p.amount, 0);
  }, [dayPayments]);

  // Direct cash expenses paid out of till
  const cashExpensesPaid = useMemo(() => {
    return dayExpenses.filter((e) => e.paymentMethod === 'CASH').reduce((sum, e) => sum + e.amount, 0);
  }, [dayExpenses]);

  // Expected physical cash in hand: Opening float + Cash collected - Cash paid out
  const expectedCashInTill = openingFloat + cashCollected - cashExpensesPaid;

  // Initialize counted cash when modal opens or expected changes
  React.useEffect(() => {
    if (!isCashCountEntered) {
      setActualCountedCash(expectedCashInTill);
    }
  }, [expectedCashInTill, isCashCountEntered]);

  const cashVariance = actualCountedCash - expectedCashInTill;

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Category', 'Description / Account', 'Amount (ETB)'];
    const rows = [
      ['Shift Info', 'Date', shiftDate],
      ['Shift Info', 'Cashier', cashierName],
      ['Shift Info', 'Shift Timing', shiftPeriod],
      ['Cash Drawer', 'Opening Till Float', openingFloat],
      ['Collections', 'Cash Collections', cashCollected],
      ['Collections', 'Telebirr Collections', telebirrCollected],
      ['Collections', 'CBE Bank Transfer Collections', bankCollected],
      ['Disbursements', 'Cash Expenses Out of Till', cashExpensesPaid],
      ['Drawer Reconciliation', 'Expected Physical Cash', expectedCashInTill],
      ['Drawer Reconciliation', 'Actual Counted Cash', actualCountedCash],
      ['Drawer Reconciliation', 'Cash Variance (Over/Short)', cashVariance],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Cashier_Handover_Reconciliation_${shiftDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden my-auto text-xs">
        
        {/* Header Controls (Hidden during print) */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-800 bg-stone-900/90 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Wallet className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-100 flex items-center gap-2">
                <span>{language === 'am' ? 'የዕለት ሂሳብ ማስረከቢያ ሰነድ (Cashier Handover)' : 'Daily Cashier Handover & Reconciliation'}</span>
              </h2>
              <p className="text-xs text-stone-400">
                {language === 'am'
                  ? 'የጥሬ ገንዘብ፣ ቴሌብር እና ባንክ ስብስብ ቆጠራ እና ማመሳከሪያ'
                  : 'Daily drawer reconciliation, float verification, and cash vault deposit voucher'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              title="Download CSV"
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'am' ? 'አትም / ቮውቸር' : 'Print Slip'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slip Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto print:max-h-none print:p-0 print:space-y-4 print:text-black">
          
          {/* Printable Official Header */}
          <div className="hidden print:block border-b-2 border-stone-800 pb-3 text-center">
            <h1 className="text-xl font-black uppercase tracking-wide">Yibeltal Bakery & Pastry (ይበልጣል ዳቦ ቤት)</h1>
            <p className="text-xs text-stone-600">Daily Cashier Handover & Vault Deposit Voucher | Addis Ababa, Ethiopia</p>
            <p className="text-xs font-semibold mt-1">Shift Date: {shiftDate} | Shift: {shiftPeriod}</p>
          </div>

          {/* Configuration Inputs (Hidden in print) */}
          <div className="p-3.5 rounded-xl bg-stone-850 border border-stone-800 grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
            <div>
              <label className="block text-stone-400 text-[10px] mb-1 font-semibold uppercase">Date:</label>
              <input
                type="date"
                value={shiftDate}
                onChange={(e) => setShiftDate(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-200 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-stone-400 text-[10px] mb-1 font-semibold uppercase">Cashier Name:</label>
              <input
                type="text"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-200 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-stone-400 text-[10px] mb-1 font-semibold uppercase">Opening Drawer Float (ብር):</label>
              <input
                type="number"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(Number(e.target.value) || 0)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-200 text-xs focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Handover Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-stone-850 border border-stone-800 print:bg-white print:border-black">
              <span className="text-stone-400 text-[11px] block print:text-black">
                {language === 'am' ? 'የጥሬ ገንዘብ ስብስብ' : 'Cash Collected'}
              </span>
              <span className="font-mono font-bold text-base text-stone-100 print:text-black mt-1 block">
                {formatCurrency(cashCollected)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-850 border border-stone-800 print:bg-white print:border-black">
              <span className="text-stone-400 text-[11px] block print:text-black">
                {language === 'am' ? 'የቴሌብር ስብስብ' : 'Telebirr Collected'}
              </span>
              <span className="font-mono font-bold text-base text-emerald-400 print:text-black mt-1 block">
                {formatCurrency(telebirrCollected)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-850 border border-stone-800 print:bg-white print:border-black">
              <span className="text-stone-400 text-[11px] block print:text-black">
                {language === 'am' ? 'የባንክ ዝውውር ስብስብ' : 'Bank Transfer'}
              </span>
              <span className="font-mono font-bold text-base text-sky-400 print:text-black mt-1 block">
                {formatCurrency(bankCollected)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-850 border border-stone-800 print:bg-white print:border-black">
              <span className="text-stone-400 text-[11px] block print:text-black">
                {language === 'am' ? 'በጥሬ የተከፈለ ወጪ' : 'Cash Paid Out (Expenses)'}
              </span>
              <span className="font-mono font-bold text-base text-rose-400 print:text-black mt-1 block">
                {formatCurrency(cashExpensesPaid)}
              </span>
            </div>
          </div>

          {/* Drawer Reconciliation Calculation Table */}
          <div className="p-4 rounded-xl bg-stone-850 border border-stone-800 print:bg-white print:border-black space-y-2">
            <h3 className="font-bold text-stone-200 print:text-black text-xs uppercase tracking-wider border-b border-stone-800 print:border-black pb-1.5 flex items-center justify-between">
              <span>{language === 'am' ? 'የካዝና ጥሬ ገንዘብ ቆጠራና ማመሳከሪያ' : 'Physical Cash Drawer Reconciliation'}</span>
              <span className="text-stone-400 font-mono text-[10px] print:text-black">Shift: {shiftDate}</span>
            </h3>

            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-800/60 print:border-stone-300">
                <span className="text-stone-400 print:text-black">1. Opening Till Float (መነሻ ጥሬ ገንዘብ):</span>
                <span className="font-mono font-semibold text-stone-200 print:text-black">{formatCurrency(openingFloat)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-stone-800/60 print:border-stone-300">
                <span className="text-stone-400 print:text-black">2. Total Cash Inflows (+ በጥሬ ገንዘብ የተሰበሰበ):</span>
                <span className="font-mono font-semibold text-emerald-400 print:text-black">+{formatCurrency(cashCollected)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-stone-800/60 print:border-stone-300">
                <span className="text-stone-400 print:text-black">3. Direct Cash Outflows (- በጥሬ የተከፈለ ወጪ):</span>
                <span className="font-mono font-semibold text-rose-400 print:text-black">-{formatCurrency(cashExpensesPaid)}</span>
              </div>

              <div className="flex justify-between py-1.5 bg-stone-800/60 p-2 rounded-lg print:bg-stone-100 font-bold">
                <span className="text-stone-200 print:text-black">Expected Cash In Drawer (በካዝና ሊኖር የሚገባው):</span>
                <span className="font-mono text-amber-400 print:text-black text-sm">{formatCurrency(expectedCashInTill)}</span>
              </div>

              {/* Physical counted input */}
              <div className="flex items-center justify-between py-1.5 bg-stone-900 p-2 rounded-lg border border-stone-700/80 print:bg-white print:border-black">
                <span className="text-stone-200 print:text-black font-semibold">
                  Actual Physical Cash Counted (በቆጠራ የተገኘው):
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={actualCountedCash}
                    onChange={(e) => {
                      setIsCashCountEntered(true);
                      setActualCountedCash(Number(e.target.value) || 0);
                    }}
                    className="w-28 text-right bg-stone-800 border border-stone-600 rounded px-2 py-1 text-emerald-400 font-mono font-bold text-xs focus:outline-none print:border-none print:text-black"
                  />
                  <span className="text-stone-400 print:text-black">ETB</span>
                </div>
              </div>

              {/* Variance indicator */}
              <div className={`flex justify-between p-2 rounded-lg font-bold ${
                cashVariance === 0
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 print:border print:text-black'
                  : cashVariance > 0
                  ? 'bg-sky-950/40 text-sky-300 border border-sky-800/60 print:border print:text-black'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-800/60 print:border print:text-black'
              }`}>
                <span>
                  {cashVariance === 0
                    ? language === 'am' ? 'ትክክል ተገጥሟል (Balanced)' : 'Perfect Reconciliation (Zero Variance)'
                    : cashVariance > 0
                    ? language === 'am' ? 'የተረፈ ገንዘብ (Cash Over)' : 'Cash Over (Surplus)'
                    : language === 'am' ? 'የጎደለ ገንዘብ (Cash Short)' : 'Cash Short (Deficit)'}
                </span>
                <span className="font-mono">
                  {cashVariance > 0 ? `+${formatCurrency(cashVariance)}` : formatCurrency(cashVariance)}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures & Official Handover Block */}
          <div className="pt-6 border-t-2 border-stone-800 print:border-black grid grid-cols-2 gap-8 text-xs text-stone-300 print:text-black">
            <div>
              <p className="font-bold">Outgoing Cashier (አስረካቢ ካሸር):</p>
              <p className="mt-1 text-stone-400 print:text-black">Name: {cashierName}</p>
              <p className="mt-8 border-b border-stone-700 print:border-black w-44"></p>
              <p className="mt-1 text-[10px] text-stone-500 print:text-stone-700">Signature & Date</p>
            </div>

            <div className="text-right">
              <p className="font-bold">Finance Manager / Owner (ተረካቢ ባለቤት/ማናጀር):</p>
              <p className="mt-1 text-stone-400 print:text-black">Name: Yibeltal A. (General Manager)</p>
              <p className="mt-8 border-b border-stone-700 print:border-black w-44 ml-auto"></p>
              <p className="mt-1 text-[10px] text-stone-500 print:text-stone-700">Signature & Official Stamp</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
