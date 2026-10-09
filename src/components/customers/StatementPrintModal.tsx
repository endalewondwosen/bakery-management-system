/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Customer Statement of Account Print & Export Modal
 * Provides formal printable / downloadable Statements of Account with date filtering.
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import { customerApi } from '../../services/apiClient.ts';
import type { CustomerStatementResponseDto } from '../../types/apiContracts.ts';
import {
  X,
  Printer,
  Calendar,
  Download,
  BookOpenText,
  Building,
  Phone,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

interface StatementPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
}

export const StatementPrintModal: React.FC<StatementPrintModalProps> = ({
  isOpen,
  onClose,
  customerId,
}) => {
  const { language, formatCurrency } = useLanguage();
  const { customers, getCustomerStatement, getCustomerBalance } = useBakeryStore();
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // 1st of current month
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [statementData, setStatementData] = useState<CustomerStatementResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatement = async () => {
    if (!customerId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await customerApi.getStatement(customerId, startDate, endDate);
      setStatementData(data);
    } catch {
      // Local store offline fallback
      const cust = customers.find((c) => c.id === customerId);
      if (cust) {
        const fullEntries = getCustomerStatement(customerId);
        const filtered = fullEntries.filter((e) => {
          const d = e.date.slice(0, 10);
          return (!startDate || d >= startDate) && (!endDate || d <= endDate);
        });
        const bal = getCustomerBalance(customerId);
        setStatementData({
          customer: cust,
          statement: filtered,
          currentBalance: bal.outstandingBalance,
          totalOrders: bal.totalInvoiced,
          totalPayments: bal.totalPaid,
        });
      } else {
        setError('Customer not found');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && customerId) {
      fetchStatement();
    }
  }, [isOpen, customerId, startDate, endDate]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!statementData || statementData.statement.length === 0) return;

    const headers = ['Date', 'Type', 'Reference', 'Description', 'Debit (ETB)', 'Credit (ETB)', 'Running Balance (ETB)', 'Status'];
    const rows = statementData.statement.map((entry) => [
      entry.date,
      entry.type,
      `"${entry.referenceId}"`,
      `"${entry.description}"`,
      entry.debit,
      entry.credit,
      entry.runningBalance,
      entry.status || 'N/A',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Statement_${statementData.customer.organizationName.replace(/\s+/g, '_')}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        
        {/* Modal Controls Header (Hidden in Print) */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-stone-800 bg-stone-900/90 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpenText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-100">
                {language === 'am' ? 'የደንበኛ የሂሳብ መግለጫ (Statement of Account)' : 'Customer Statement of Account'}
              </h2>
              <p className="text-xs text-stone-400">
                {statementData ? statementData.customer.organizationName : 'Loading...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-stone-800 px-3 py-1.5 rounded-lg border border-stone-700 text-xs">
              <span className="text-stone-400">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-stone-200 focus:outline-none cursor-pointer"
              />
              <span className="text-stone-400">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-stone-200 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleExportCSV}
              disabled={!statementData || statementData.statement.length === 0}
              title="Download CSV Spreadsheet"
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 text-xs font-medium transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold text-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'am' ? 'አትም / PDF' : 'Print / PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Statement Body Viewport */}
        <div className="p-4 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto print:max-h-none print:p-0 print:space-y-4 print:text-black">
          
          {loading && (
            <div className="py-20 text-center text-stone-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-sm">{language === 'am' ? 'የሂሳብ መግለጫ በማዘጋጀት ላይ...' : 'Preparing formal statement ledger...'}</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
              {error}
            </div>
          )}

          {statementData && !loading && (
            <div className="space-y-6 print:space-y-4">
              
              {/* Official Header Block */}
              <div className="flex items-start justify-between border-b-2 border-stone-800 print:border-black pb-4">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-wide text-stone-100 print:text-black">
                    Bole Heritage Bakery & Pastry
                  </h1>
                  <p className="text-xs text-stone-400 print:text-stone-700">
                    Wholesale Bakery Operations & Fresh Bread Distribution
                  </p>
                  <p className="text-xs text-stone-400 print:text-stone-700">
                    Bole Sub-City, Addis Ababa, Ethiopia | Tel: +251 91 123 4567 / +251 11 654 3210
                  </p>
                  <p className="text-xs text-stone-400 print:text-stone-700 font-mono">
                    TIN: 0098765432 | VAT Reg: 88719283
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded bg-amber-500/20 text-amber-400 print:bg-stone-200 print:text-black text-xs font-bold uppercase tracking-wider">
                    STATEMENT OF ACCOUNT
                  </span>
                  <p className="text-xs text-stone-400 print:text-black mt-2">
                    Date Generated: {new Date().toLocaleDateString()}
                  </p>
                  <p className="text-xs font-semibold text-stone-200 print:text-black">
                    Period: {startDate} to {endDate}
                  </p>
                </div>
              </div>

              {/* Customer Account Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-stone-850 border border-stone-800 print:bg-white print:border-black text-xs">
                <div>
                  <span className="text-stone-400 print:text-black font-semibold uppercase tracking-wider text-[10px]">
                    Customer Account:
                  </span>
                  <p className="text-base font-bold text-stone-100 print:text-black mt-0.5">
                    {statementData.customer.organizationName}
                  </p>
                  <p className="text-stone-300 print:text-black mt-0.5">
                    Contact Person: {statementData.customer.name}
                  </p>
                  <p className="text-stone-300 print:text-black">
                    Phone: {statementData.customer.phone} {statementData.customer.managerPhone ? `/ ${statementData.customer.managerPhone}` : ''}
                  </p>
                  <p className="text-stone-300 print:text-black">
                    Address: {statementData.customer.address}
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <div className="flex justify-between border-b border-stone-800 print:border-stone-300 pb-1">
                    <span className="text-stone-400 print:text-black">Total Invoiced (Orders):</span>
                    <span className="font-mono font-bold text-stone-100 print:text-black">
                      {formatCurrency(statementData.totalOrders)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-stone-800 print:border-stone-300 pb-1">
                    <span className="text-stone-400 print:text-black">Total Payments (Credits):</span>
                    <span className="font-mono font-bold text-emerald-400 print:text-black">
                      {formatCurrency(statementData.totalPayments)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="font-bold text-stone-200 print:text-black">Current Balance (ቀሪ ዕዳ):</span>
                    <span className="font-mono font-black text-amber-400 print:text-black text-sm">
                      {formatCurrency(statementData.currentBalance)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction Ledger Table */}
              <div className="rounded-xl border border-stone-800 print:border-black overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-stone-800 text-stone-300 font-bold border-b border-stone-700 print:bg-stone-200 print:text-black print:border-black">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Reference / Receipt #</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Debit / Billed (ETB)</th>
                      <th className="py-2.5 px-3 text-right">Credit / Paid (ETB)</th>
                      <th className="py-2.5 px-3 text-right">Balance (ETB)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800 print:divide-stone-300 text-stone-300 print:text-black">
                    {statementData.statement.map((entry, index) => (
                      <tr key={index} className="hover:bg-stone-800/40">
                        <td className="py-2 px-3 font-mono">{entry.date.slice(0, 10)}</td>
                        <td className="py-2 px-3 font-semibold">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              entry.type === 'ORDER'
                                ? 'bg-amber-500/20 text-amber-300 print:text-black'
                                : 'bg-emerald-500/20 text-emerald-300 print:text-black'
                            }`}
                          >
                            {entry.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-stone-400 print:text-black">{entry.referenceId}</td>
                        <td className="py-2 px-3">{entry.description}</td>
                        <td className="py-2 px-3 text-right font-mono font-medium text-amber-400 print:text-black">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-medium text-emerald-400 print:text-black">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-stone-100 print:text-black">
                          {formatCurrency(entry.runningBalance)}
                        </td>
                      </tr>
                    ))}
                    {statementData.statement.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-stone-500">
                          {language === 'am' ? 'በተመረጠው ቀን ውስጥ ምንም እንቅስቃሴ አልተገኘም' : 'No transactions recorded within this date range.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Official Stamp & Signatures */}
              <div className="pt-8 border-t border-stone-800 print:border-black grid grid-cols-2 gap-10 text-xs">
                <div>
                  <p className="font-bold text-stone-300 print:text-black">Prepared By (Finance Officer):</p>
                  <p className="mt-8 border-b border-stone-700 print:border-black w-48"></p>
                  <p className="mt-1 text-[10px] text-stone-400 print:text-stone-600">Signature & Date</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-stone-300 print:text-black">Customer Representative Acknowledgment:</p>
                  <p className="mt-8 border-b border-stone-700 print:border-black w-48 ml-auto"></p>
                  <p className="mt-1 text-[10px] text-stone-400 print:text-stone-600">Name, Signature & Official Stamp</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
