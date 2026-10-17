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
  Calendar,
  Layers,
  Sparkles,
  Wallet,
  Clock,
  ArrowUpDown,
  Edit3,
  Trash2,
  AlertTriangle,
  X,
  Save,
} from 'lucide-react';
import { Expense, ExpenseCategory, ExpensePeriod, PaymentMethod } from '../../types/domain.ts';
import { useToast } from '../common/ToastContext.tsx';

interface ExpensesViewProps {
  onOpenRecordExpense: (defaultPeriod?: ExpensePeriod) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ onOpenRecordExpense }) => {
  const { t, formatCurrency, language } = useLanguage();
  const { showSuccess } = useToast();
  const { expenses, updateExpense, deleteExpense } = useBakeryStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | ExpensePeriod>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Edit Expense State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editCategory, setEditCategory] = useState<ExpenseCategory>('RAW_FLOUR');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('CASH');
  const [editRef, setEditRef] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editPeriod, setEditPeriod] = useState<ExpensePeriod>('DAILY');
  const [editUnit, setEditUnit] = useState('');
  const [editQty, setEditQty] = useState<number>(0);
  const [editUnitPrice, setEditUnitPrice] = useState<number>(0);

  // Delete Expense State
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const handleStartEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setEditAmount(exp.amount);
    setEditCategory(exp.category);
    setEditDescription(exp.description);
    setEditDate(exp.date ? exp.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setEditPaymentMethod(exp.paymentMethod);
    setEditRef(exp.referenceNumber || '');
    setEditNotes(exp.notes || '');
    setEditPeriod(exp.expensePeriod || 'DAILY');
    setEditUnit(exp.unit || '');
    setEditQty(exp.quantity || 0);
    setEditUnitPrice(exp.unitPrice || 0);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    const finalAmount = editQty > 0 && editUnitPrice > 0 ? editQty * editUnitPrice : editAmount;

    updateExpense(editingExpense.id, {
      amount: finalAmount,
      category: editCategory,
      description: editDescription.trim(),
      date: editDate ? new Date(editDate).toISOString() : editingExpense.date,
      paymentMethod: editPaymentMethod,
      referenceNumber: editRef.trim() || undefined,
      notes: editNotes.trim() || undefined,
      expensePeriod: editPeriod,
      unit: editUnit || undefined,
      quantity: editQty > 0 ? editQty : undefined,
      unitPrice: editUnitPrice > 0 ? editUnitPrice : undefined,
    });

    showSuccess(
      language === 'am' ? 'ወጪ ተሻሽሏል!' : 'Expense Updated!',
      language === 'am' ? 'የወጪ መረጃ በተሳካ ሁኔታ ተሻሽሏል' : 'Expense record has been updated successfully'
    );

    setEditingExpense(null);
  };

  // Today ISO date string (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthStr = todayStr.substring(0, 7); // YYYY-MM
  const thisYearStr = todayStr.substring(0, 4); // YYYY

  // Summary Metrics
  const metrics = useMemo(() => {
    let todayDailyTotal = 0;
    let thisMonthTotal = 0;
    let yearlyTotal = 0;
    let allTotal = 0;

    expenses.forEach((e) => {
      allTotal += e.amount;
      const expDate = e.date.split('T')[0];
      const period = e.expensePeriod || 'DAILY';

      // Today's daily operating expenses
      if (period === 'DAILY' && expDate === todayStr) {
        todayDailyTotal += e.amount;
      }

      // This month's expenses
      if (expDate.startsWith(thisMonthStr) || period === 'MONTHLY') {
        thisMonthTotal += e.amount;
      }

      // Yearly expenses
      if (period === 'YEARLY' || expDate.startsWith(thisYearStr)) {
        yearlyTotal += e.amount;
      }
    });

    return {
      todayDailyTotal,
      thisMonthTotal,
      yearlyTotal,
      allTotal,
    };
  }, [expenses, todayStr, thisMonthStr, thisYearStr]);

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm.trim() ||
        e.description.toLowerCase().includes(q) ||
        (e.referenceNumber && e.referenceNumber.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        (e.unit && e.unit.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (categoryFilter !== 'ALL' && e.category !== categoryFilter) return false;
      
      const itemPeriod = e.expensePeriod || 'DAILY';
      if (periodFilter !== 'ALL' && itemPeriod !== periodFilter) return false;

      return true;
    });
  }, [expenses, searchTerm, categoryFilter, periodFilter]);

  const totalFilteredExpense = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  // Period Badge Formatter
  const renderPeriodBadge = (period?: ExpensePeriod) => {
    const p = period || 'DAILY';
    if (p === 'DAILY') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <Clock className="w-2.5 h-2.5" />
          <span>{t.periodDaily}</span>
        </span>
      );
    }
    if (p === 'MONTHLY') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <Calendar className="w-2.5 h-2.5" />
          <span>{t.periodMonthly}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
        <Sparkles className="w-2.5 h-2.5" />
        <span>{t.periodYearly}</span>
      </span>
    );
  };

  // Unit string formatter
  const renderUnitCalculation = (exp: typeof expenses[0]) => {
    if (exp.quantity && exp.unitPrice) {
      return (
        <span className="text-[11px] font-mono text-stone-300">
          <span className="font-bold text-amber-400">{exp.quantity}</span> {exp.unit}{' '}
          <span className="text-stone-500">×</span> {formatCurrency(exp.unitPrice)}
        </span>
      );
    }
    if (exp.unit && exp.unit !== 'LUMP_SUM') {
      return (
        <span className="text-[11px] text-stone-400 font-mono">
          {exp.quantity || 1} {exp.unit}
        </span>
      );
    }
    return <span className="text-[11px] text-stone-500 italic">{t.unitLumpSum}</span>;
  };

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
              ? 'የዕለታዊ (ዱቄት፣ ነዳጅ፣ እንቁላል)፣ የወርሃዊ (ደመወዝ፣ ኪራይ፣ መብራት) እና የዓመታዊ ወጪዎች ክትትል'
              : 'Track daily operating ingredients & fuel, monthly payroll & rent, and yearly capital costs'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenRecordExpense('DAILY')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'am' ? '+ ዕለታዊ ወጪ' : '+ Daily Expense'}</span>
          </button>
          <button
            onClick={() => onOpenRecordExpense('MONTHLY')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs border border-stone-700 shadow transition cursor-pointer"
          >
            <span>{language === 'am' ? '+ ወርሃዊ / ሌላ ወጪ' : '+ Monthly / Other'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Daily, Monthly, Yearly Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Today's Daily Operating Expenses */}
        <div className="bg-stone-900 border border-stone-800/80 rounded-xl p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
            <span className="font-semibold">{t.todayDailyExpenses}</span>
            <Clock className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-rose-400">
            {formatCurrency(metrics.todayDailyTotal)}
          </div>
          <p className="text-[10px] text-stone-500 mt-1">
            {language === 'am' ? 'የዛሬ ጥሬ ዕቃ፣ እንቁላልና ነዳጅ' : 'Ingredients, fuel & daily needs'}
          </p>
        </div>

        {/* This Month's Expenses */}
        <div className="bg-stone-900 border border-stone-800/80 rounded-xl p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
            <span className="font-semibold">{t.thisMonthExpenses}</span>
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-amber-400">
            {formatCurrency(metrics.thisMonthTotal)}
          </div>
          <p className="text-[10px] text-stone-500 mt-1">
            {language === 'am' ? 'ደመወዝ፣ ኪራይ እና ወርሃዊ ክፍያዎች' : 'Salaries, rent & monthly bills'}
          </p>
        </div>

        {/* Yearly / Annual Total */}
        <div className="bg-stone-900 border border-stone-800/80 rounded-xl p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
            <span className="font-semibold">{t.yearlyTotalExpenses}</span>
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-blue-400">
            {formatCurrency(metrics.yearlyTotal)}
          </div>
          <p className="text-[10px] text-stone-500 mt-1">
            {language === 'am' ? 'ፈቃድ፣ ኢንሹራንስና ካፒታል' : 'Trade licenses & annual assets'}
          </p>
        </div>

        {/* All Total Filtered */}
        <div className="bg-stone-900 border border-stone-800/80 rounded-xl p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
            <span className="font-semibold">{language === 'am' ? 'ጠቅላላ የተጣራ ወጪ' : 'Filtered Total'}</span>
            <Wallet className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-stone-100">
            {formatCurrency(totalFilteredExpense)}
          </div>
          <p className="text-[10px] text-stone-500 mt-1">
            {filteredExpenses.length} {language === 'am' ? 'የተመዘገቡ ወጪዎች' : 'items currently listed'}
          </p>
        </div>
      </div>

      {/* Period Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-900/90 border border-stone-800 rounded-xl text-xs">
        <button
          onClick={() => setPeriodFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
            periodFilter === 'ALL'
              ? 'bg-stone-800 text-white shadow-sm'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          {t.periodAll}
        </button>

        <button
          onClick={() => setPeriodFilter('DAILY')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
            periodFilter === 'DAILY'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Clock className="w-3 h-3 text-rose-400" />
          <span>{t.dailyExpenses}</span>
        </button>

        <button
          onClick={() => setPeriodFilter('MONTHLY')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
            periodFilter === 'MONTHLY'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Calendar className="w-3 h-3 text-amber-400" />
          <span>{t.monthlyExpenses}</span>
        </button>

        <button
          onClick={() => setPeriodFilter('YEARLY')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
            periodFilter === 'YEARLY'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Sparkles className="w-3 h-3 text-blue-400" />
          <span>{t.yearlyExpenses}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              language === 'am'
                ? 'ወጪ በማብራሪያ፣ በደረሰኝ ቁጥር፣ በዩኒት (kg, ሊትር፣ ኩንታል) ፈልግ...'
                : 'Search description, receipt #, unit (kg, liter, quintal), notes...'
            }
            className="w-full bg-stone-800 border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-rose-500"
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
                <th className="py-2.5 px-3">Period</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Unit Calculation (Qty × Rate)</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3">Ref #</th>
                <th className="py-2.5 px-3 text-right">Total Amount</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-stone-500">
                    {language === 'am' ? 'ምንም ወጪ አልተገኘም' : 'No matching expenses logged'}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-stone-800/30 transition">
                    {/* Date */}
                    <td className="py-2.5 px-3 text-stone-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(exp.date).toLocaleDateString()}
                    </td>

                    {/* Period Badge */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {renderPeriodBadge(exp.expensePeriod)}
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-3 font-semibold text-stone-200 whitespace-nowrap">
                      {exp.category.replace('RAW_', '').replace('_', ' ')}
                    </td>

                    {/* Description & Notes */}
                    <td className="py-2.5 px-3 max-w-xs">
                      <div className="font-medium text-stone-100">{exp.description}</div>
                      {exp.notes && (
                        <div className="text-[10px] text-stone-500 italic mt-0.5 truncate">{exp.notes}</div>
                      )}
                    </td>

                    {/* Unit Calculation */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {renderUnitCalculation(exp)}
                    </td>

                    {/* Payment Method */}
                    <td className="py-2.5 px-3 text-stone-300 whitespace-nowrap">
                      {exp.paymentMethod}
                    </td>

                    {/* Reference # */}
                    <td className="py-2.5 px-3 font-mono text-stone-400 text-[11px] whitespace-nowrap">
                      {exp.referenceNumber || '—'}
                    </td>

                    {/* Total Amount */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400 text-sm whitespace-nowrap">
                      {formatCurrency(exp.amount)}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(exp)}
                          title={language === 'am' ? 'ወጪ አሻሽል' : 'Edit Expense'}
                          className="p-1 rounded text-stone-400 hover:text-amber-400 hover:bg-stone-800 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpenseToDelete(exp)}
                          title={language === 'am' ? 'ወጪ ሰርዝ' : 'Delete Expense'}
                          className="p-1 rounded text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 modal-backdrop-soft">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg p-5 text-xs space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-stone-100 text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>{language === 'am' ? 'ወጪ ማሻሻያ' : 'Edit Expense Record'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                className="text-stone-400 hover:text-stone-100 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    {language === 'am' ? 'የወጪ ምድብ' : 'Category'}
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
                  >
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

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    {language === 'am' ? 'የክፍያ ዘዴ' : 'Payment Method'}
                  </label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
                  >
                    <option value="CASH">Cash</option>
                    <option value="TELEBIRR">Telebirr</option>
                    <option value="BANK_TRANSFER">Bank Transfer (CBE)</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  {language === 'am' ? 'የወጪው መግለጫ' : 'Description'} *
                </label>
                <input
                  type="text"
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-850/60 p-3 rounded-xl border border-stone-800">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    {language === 'am' ? 'ብዛት' : 'Quantity'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={editQty}
                    onChange={(e) => setEditQty(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-stone-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    {language === 'am' ? 'የአንዱ ዋጋ' : 'Unit Price'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={editUnitPrice}
                    onChange={(e) => setEditUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-stone-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    {language === 'am' ? 'ጠቅላላ ብር' : 'Total Amount'} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editQty > 0 && editUnitPrice > 0 ? editQty * editUnitPrice : editAmount}
                    onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-rose-400 font-bold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    {language === 'am' ? 'ደረሰኝ ቁጥር' : 'Reference / Receipt #'}
                  </label>
                  <input
                    type="text"
                    value={editRef}
                    onChange={(e) => setEditRef(e.target.value)}
                    placeholder="e.g. REC-10293"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    {language === 'am' ? 'ቀን' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-stone-800 text-stone-300 font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t.save}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Expense Confirmation Dialog */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 modal-backdrop-soft">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-5 text-xs space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{language === 'am' ? 'ወጪ ማጥፋት እርግጠኛ ነዎት?' : 'Confirm Expense Deletion'}</span>
            </div>

            <p className="text-stone-300 leading-relaxed">
              {language === 'am'
                ? `ወጪውን "${expenseToDelete.description}" (${formatCurrency(expenseToDelete.amount)}) ከስርዓቱ ማጥፋት ይፈልጋሉ?`
                : `Are you sure you want to delete expense "${expenseToDelete.description}" (${formatCurrency(expenseToDelete.amount)})?`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteExpense(expenseToDelete.id);
                  showSuccess(
                    language === 'am' ? 'ወጪ ተሰርዟል!' : 'Expense Deleted!',
                    language === 'am'
                      ? `የተመረጠው ወጪ ተሰርዟል`
                      : `Expense record has been deleted`
                  );
                  setExpenseToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow"
              >
                {language === 'am' ? 'አዎ ሰርዝ' : 'Delete Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
