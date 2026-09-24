/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  PieChart,
  Calendar
} from 'lucide-react';
import { ExpenseCategory } from '../../types/domain.ts';

interface ExpensesViewProps {
  onOpenRecordExpense: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ onOpenRecordExpense }) => {
  const { t, formatCurrency, language } = useLanguage();
  const { expenses } = useBakeryStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm.trim() ||
        e.description.toLowerCase().includes(q) ||
        (e.referenceNumber && e.referenceNumber.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (categoryFilter !== 'ALL' && e.category !== categoryFilter) return false;

      return true;
    });
  }, [expenses, searchTerm, categoryFilter]);

  const totalFilteredExpense = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  // Group by category for quick breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  return (
    <div className="space-y-5">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-rose-500" />
            <span>{t.navExpenses}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 font-mono">
              {filteredExpenses.length}
            </span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            {language === 'am'
              ? 'የዱቄት፣ እንቁላል፣ አይብ፣ ማሸጊያ፣ ነዳጅ እና ሌሎች የዳቦ ቤት ወጪዎች'
              : 'Flour, eggs, cheese, packaging, fuel, rent & bakery operation costs'}
          </p>
        </div>

        <button
          onClick={onOpenRecordExpense}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow transition shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.logExpense}</span>
        </button>
      </div>

      {/* Category Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {categoryBreakdown.slice(0, 4).map(([cat, total]) => (
          <div key={cat} className="bg-stone-900 border border-stone-800 rounded-xl p-3 text-xs">
            <div className="text-stone-400 truncate font-medium">
              {cat.replace('RAW_', '').replace('_', ' ')}
            </div>
            <div className="text-base font-bold text-stone-100 font-mono mt-1">
              {formatCurrency(total)}
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'am' ? 'ወጪ በማብራሪያ ወይም በደረሰኝ ቁጥር ፈልግ...' : 'Search expense description, receipt #, notes...'}
            className="w-full bg-stone-800 border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none"
          >
            <option value="ALL">{language === 'am' ? 'ሁሉም የወጪ ምድቦች' : 'All Categories'}</option>
            <option value="RAW_FLOUR">{t.catRawFlour}</option>
            <option value="RAW_EGGS">{t.catRawEggs}</option>
            <option value="RAW_CHEESE_FETA">{t.catRawCheeseFeta}</option>
            <option value="RAW_SUGAR_OIL">{t.catRawSugarOil}</option>
            <option value="PACKAGING">{t.catPackaging}</option>
            <option value="TRANSPORT_FUEL">{t.catTransportFuel}</option>
            <option value="UTILITIES">{t.catUtilities}</option>
            <option value="RENT">{t.catRent}</option>
            <option value="SALARIES">{t.catSalaries}</option>
            <option value="MAINTENANCE">{t.catMaintenance}</option>
            <option value="OTHER">{t.catOther}</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-3 bg-stone-850/60 border-b border-stone-800 flex items-center justify-between text-xs">
          <span className="text-stone-400">
            {language === 'am' ? 'የተጣራ የወጪ ድምር:' : 'Filtered Total Expenses:'}
          </span>
          <span className="font-mono font-bold text-rose-400 text-sm">
            {formatCurrency(totalFilteredExpense)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-800/80 text-stone-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Payment Method</th>
                <th className="py-2.5 px-3">Reference #</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-500">
                    {language === 'am' ? 'ምንም ወጪ አልተገኘም' : 'No matching expenses logged'}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-stone-800/30 transition">
                    <td className="py-2.5 px-3 text-stone-400 font-mono text-[11px]">
                      {new Date(exp.date).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-stone-200">
                      {exp.category}
                    </td>
                    <td className="py-2.5 px-3">
                      <div>{exp.description}</div>
                      {exp.notes && (
                        <div className="text-[10px] text-stone-500 italic mt-0.5">{exp.notes}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-stone-300">
                      {exp.paymentMethod}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-stone-400 text-[11px]">
                      {exp.referenceNumber || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                      {formatCurrency(exp.amount)}
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
