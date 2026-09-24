/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import {
  BookOpenText,
  AlertTriangle,
  Wallet,
  Search,
  ArrowRight,
  Building,
  CheckCircle2
} from 'lucide-react';

interface DebtLedgerViewProps {
  onOpenRecordPayment: (orderId?: string, customerId?: string) => void;
  onSelectCustomer: (customerId: string) => void;
}

export const DebtLedgerView: React.FC<DebtLedgerViewProps> = ({
  onOpenRecordPayment,
  onSelectCustomer,
}) => {
  const { t, formatCurrency, language } = useLanguage();
  const { customers, getCustomerBalance, totalOutstandingDebt } = useBakeryStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [onlyWithDebt, setOnlyWithDebt] = useState(true);

  // Compute debtor list
  const debtorList = useMemo(() => {
    return customers
      .map((c) => {
        const bal = getCustomerBalance(c.id);
        return {
          customer: c,
          ...bal,
        };
      })
      .filter((item) => {
        if (onlyWithDebt && item.outstandingBalance <= 0) return false;
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          item.customer.organizationName.toLowerCase().includes(q) ||
          item.customer.name.toLowerCase().includes(q) ||
          item.customer.phone.includes(q) ||
          (item.customer.branch && item.customer.branch.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => b.outstandingBalance - a.outstandingBalance); // Highest debt first
  }, [customers, getCustomerBalance, onlyWithDebt, searchTerm]);

  return (
    <div className="space-y-5">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
            <BookOpenText className="w-5 h-5 text-amber-500" />
            <span>{t.navDebtLedger}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 font-mono">
              {debtorList.length}
            </span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            {language === 'am'
              ? 'የደንበኞች ያልተከፈለ ብድር፣ የሂሳብ ሚዛን እና የገንዘብ ማሰባሰብ መዝገብ'
              : 'Customer credit balances, aging receivables, and debt collection tracker'}
          </p>
        </div>

        {/* Total Outstanding Metric */}
        <div className="bg-stone-900 border border-stone-800 px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-sm shrink-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-stone-400 uppercase font-semibold">
              {t.outstandingReceivables}
            </div>
            <div className="text-base font-bold text-amber-400 font-mono">
              {formatCurrency(totalOutstandingDebt)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'am' ? 'ባለዕዳ ደንበኛ በስም፣ በድርጅት ወይም በስልክ ፈልግ...' : 'Search debtor by name, business, phone...'}
            className="w-full bg-stone-800 border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0 text-xs">
          <label className="flex items-center gap-2 text-stone-300 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyWithDebt}
              onChange={(e) => setOnlyWithDebt(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 bg-stone-800 border-stone-700"
            />
            <span>{language === 'am' ? 'ዕዳ ያለባቸውን ብቻ አሳይ' : 'Only show with active debt'}</span>
          </label>
        </div>
      </div>

      {/* Debtors List Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-800/80 text-stone-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Customer / Organization</th>
                <th className="py-2.5 px-3">Type & Branch</th>
                <th className="py-2.5 px-3">Contact</th>
                <th className="py-2.5 px-3 text-right">Total Invoiced</th>
                <th className="py-2.5 px-3 text-right">Total Paid</th>
                <th className="py-2.5 px-3 text-right">Outstanding Debt</th>
                <th className="py-2.5 px-3 text-right">Collection Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {debtorList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-stone-500">
                    <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500/40 mb-1.5" />
                    {language === 'am' ? 'ምንም ያልተከፈለ ብድር ያለበት ደንበኛ የለም' : 'No outstanding customer debts found'}
                  </td>
                </tr>
              ) : (
                debtorList.map(({ customer, totalInvoiced, totalPaid, outstandingBalance }) => (
                  <tr key={customer.id} className="hover:bg-stone-800/30 transition">
                    <td className="py-3 px-3">
                      <button
                        onClick={() => onSelectCustomer(customer.id)}
                        className="font-bold text-stone-100 hover:text-amber-400 text-left text-sm cursor-pointer"
                      >
                        {customer.organizationName}
                      </button>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-stone-300">{customer.customerType}</span>
                      {customer.branch && (
                        <div className="text-[11px] text-stone-500">{customer.branch}</div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-stone-300">{customer.name}</div>
                      <div className="font-mono text-stone-500 text-[11px]">{customer.phone}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-stone-300">
                      {formatCurrency(totalInvoiced)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-emerald-400">
                      {formatCurrency(totalPaid)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-sm">
                      {outstandingBalance > 0 ? (
                        <span className="text-amber-400">{formatCurrency(outstandingBalance)}</span>
                      ) : (
                        <span className="text-emerald-500 text-xs font-normal">
                          {language === 'am' ? 'ተከፍሏል' : 'Clear'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      {outstandingBalance > 0 && (
                        <button
                          onClick={() => onOpenRecordPayment(undefined, customer.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition"
                        >
                          <span className="flex items-center gap-1">
                            <Wallet className="w-3.5 h-3.5" />
                            <span>{language === 'am' ? 'ገንዘብ ሰብስብ' : 'Collect Debt'}</span>
                          </span>
                        </button>
                      )}
                      <button
                        onClick={() => onSelectCustomer(customer.id)}
                        className="px-2 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
                      >
                        {t.customer360}
                      </button>
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
