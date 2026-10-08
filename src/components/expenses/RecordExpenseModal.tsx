/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import { X, Receipt, Calculator, Calendar, Tag, Layers, CheckCircle2 } from 'lucide-react';
import { ExpenseCategory, ExpensePeriod, ExpenseUnit, PaymentMethod } from '../../types/domain.ts';
import { useToast } from '../common/ToastContext.tsx';

interface RecordExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPeriod?: ExpensePeriod;
}

export const RecordExpenseModal: React.FC<RecordExpenseModalProps> = ({
  isOpen,
  onClose,
  defaultPeriod = 'DAILY',
}) => {
  const { t, language, formatCurrency } = useLanguage();
  const { showSuccess, showError } = useToast();
  const { recordExpense } = useBakeryStore();

  const [expensePeriod, setExpensePeriod] = useState<ExpensePeriod>(defaultPeriod);
  const [category, setCategory] = useState<ExpenseCategory>('RAW_FLOUR');
  const [calculationMode, setCalculationMode] = useState<'CALCULATE' | 'FLAT'>('CALCULATE');
  
  // Unit & calculation fields
  const [unit, setUnit] = useState<ExpenseUnit>('QUINTAL');
  const [quantity, setQuantity] = useState<number | ''>(10);
  const [unitPrice, setUnitPrice] = useState<number | ''>(1250);
  const [flatAmount, setFlatAmount] = useState<number | ''>('');

  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Reset or preset defaults when opened or category changes
  useEffect(() => {
    if (isOpen) {
      setExpensePeriod(defaultPeriod);
    }
  }, [isOpen, defaultPeriod]);

  // Smart suggestions when category changes
  const handleCategoryChange = (newCat: ExpenseCategory) => {
    setCategory(newCat);
    
    // Auto-align default period & units based on category
    if (newCat === 'SALARIES' || newCat === 'RENT' || newCat === 'UTILITIES') {
      setExpensePeriod('MONTHLY');
      if (newCat === 'SALARIES') {
        setUnit('MONTH');
        setDescription(language === 'am' ? 'የወር የሰራተኞች ደመወዝ' : 'Monthly staff salary');
      } else if (newCat === 'RENT') {
        setUnit('MONTH');
        setDescription(language === 'am' ? 'የዳቦ ቤት ህንፃ የወር ኪራይ' : 'Monthly bakery premises rent');
      } else {
        setCalculationMode('FLAT');
        setUnit('LUMP_SUM');
        setDescription(language === 'am' ? 'የኤሌክትሪክ / ውሃ የፍጆታ ሂሳብ' : 'Electricity / water utility bill');
      }
    } else if (newCat === 'RAW_FLOUR') {
      setExpensePeriod('DAILY');
      setCalculationMode('CALCULATE');
      setUnit('QUINTAL');
      setDescription(language === 'am' ? 'የስንዴ ዱቄት ግዢ' : 'Wheat flour purchase');
    } else if (newCat === 'RAW_EGGS') {
      setExpensePeriod('DAILY');
      setCalculationMode('CALCULATE');
      setUnit('CRATE');
      setDescription(language === 'am' ? 'እንቁላል ለዳቦ ማቅለሚያ' : 'Fresh eggs for bread glaze');
    } else if (newCat === 'TRANSPORT_FUEL') {
      setExpensePeriod('DAILY');
      setCalculationMode('CALCULATE');
      setUnit('LITER');
      setDescription(language === 'am' ? 'የማከፋፈያ ቫን / ሞተር ነዳጅ' : 'Delivery vehicle fuel');
    } else if (newCat === 'PACKAGING') {
      setExpensePeriod('DAILY');
      setCalculationMode('CALCULATE');
      setUnit('BUNDLE');
      setDescription(language === 'am' ? 'የዳቦ ማሸጊያ ፌስታል' : 'Plastic bread packaging');
    }
  };

  if (!isOpen) return null;

  // Compute final effective amount
  const computedTotal =
    calculationMode === 'CALCULATE'
      ? (typeof quantity === 'number' ? quantity : 0) * (typeof unitPrice === 'number' ? unitPrice : 0)
      : typeof flatAmount === 'number' ? flatAmount : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (computedTotal <= 0) {
      showError(
        language === 'am' ? 'ልክ ያልሆነ የወጪ መጠን' : 'Invalid Expense Amount',
        language === 'am' ? 'የወጪ መጠን ከ0 በላይ መሆን አለበት!' : 'Expense amount must be greater than 0!'
      );
      return;
    }

    if (!description.trim()) {
      showError(
        language === 'am' ? 'ማብራሪያ ያስፈልጋል' : 'Description Required',
        language === 'am' ? 'እባክዎ የወጪውን ማብራሪያ ያስገቡ!' : 'Please enter an expense description!'
      );
      return;
    }

    recordExpense({
      amount: computedTotal,
      category,
      description: description.trim(),
      paymentMethod,
      referenceNumber: referenceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      recordedBy: 'Owner',
      expensePeriod,
      unit,
      quantity: calculationMode === 'CALCULATE' && typeof quantity === 'number' ? quantity : undefined,
      unitPrice: calculationMode === 'CALCULATE' && typeof unitPrice === 'number' ? unitPrice : undefined,
    });

    showSuccess(
      language === 'am' ? 'ወጪ ተመዝግቧል!' : 'Expense Recorded!',
      language === 'am'
        ? `የ${formatCurrency(computedTotal)} ወጪ በተሳካ ሁኔታ ተመዝግቧል (${description.trim()})`
        : `Expense of ${formatCurrency(computedTotal)} recorded (${description.trim()})`
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col text-xs">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-stone-800 flex items-center justify-between bg-stone-850 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                {t.logExpense}
              </h2>
              <p className="text-stone-400 text-[11px]">
                {language === 'am'
                  ? 'የዕለታዊ፣ ወርሃዊ ወይም ዓመታዊ ወጪ ምዝገባ በዩኒትና በብዛት ስሌት'
                  : 'Record daily, monthly or yearly expense with unit, quantity & rate'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">

          {/* 1. Expense Frequency / Period Selection */}
          <div className="bg-stone-850/80 border border-stone-800 p-3 rounded-xl space-y-2">
            <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-rose-400" />
              <span>{t.expensePeriod}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setExpensePeriod('DAILY')}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-0.5 border transition cursor-pointer ${
                  expensePeriod === 'DAILY'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                    : 'bg-stone-800/80 border-stone-700/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                <span>{t.periodDaily}</span>
                <span className="text-[10px] opacity-75 font-normal">
                  {language === 'am' ? 'ዱቄት፣ ነዳጅ፣ እንቁላል' : 'Flour, eggs, fuel'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setExpensePeriod('MONTHLY')}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-0.5 border transition cursor-pointer ${
                  expensePeriod === 'MONTHLY'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-stone-800/80 border-stone-700/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                <span>{t.periodMonthly}</span>
                <span className="text-[10px] opacity-75 font-normal">
                  {language === 'am' ? 'ደመወዝ፣ ኪራይ፣ መብራት' : 'Salaries, rent, EEU'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setExpensePeriod('YEARLY')}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-0.5 border transition cursor-pointer ${
                  expensePeriod === 'YEARLY'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-sm'
                    : 'bg-stone-800/80 border-stone-700/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                <span>{t.periodYearly}</span>
                <span className="text-[10px] opacity-75 font-normal">
                  {language === 'am' ? 'ንግድ ፈቃድ፣ ኢንሹራንስ' : 'License, insurance'}
                </span>
              </button>
            </div>
          </div>

          {/* 2. Category & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-300 font-semibold mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-stone-400" />
                <span>{language === 'am' ? 'የወጪ ምድብ (Category)' : 'Expense Category'} *</span>
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as ExpenseCategory)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 focus:outline-none focus:border-rose-500"
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
                {language === 'am' ? 'የወጪው ዝርዝር ማብራሪያ' : 'Expense Description'} *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 10 quintals wheat flour from factory..."
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* 3. Units, Quantity & Unit Price Calculation Section */}
          <div className="bg-stone-850 border border-stone-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-rose-400" />
                <span>{t.calculationMode}</span>
              </label>
              <div className="flex items-center gap-1 bg-stone-900 p-0.5 rounded-lg border border-stone-700/80">
                <button
                  type="button"
                  onClick={() => setCalculationMode('CALCULATE')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    calculationMode === 'CALCULATE'
                      ? 'bg-rose-600 text-white font-bold shadow'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {t.calcByQuantity}
                </button>
                <button
                  type="button"
                  onClick={() => setCalculationMode('FLAT')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    calculationMode === 'FLAT'
                      ? 'bg-rose-600 text-white font-bold shadow'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {t.calcFlat}
                </button>
              </div>
            </div>

            {calculationMode === 'CALCULATE' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Unit of Measure */}
                <div>
                  <label className="block text-stone-300 font-semibold mb-1 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-stone-400" />
                    <span>{t.unitMeasurement}</span>
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as ExpenseUnit)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-2 text-stone-100 text-xs focus:outline-none"
                  >
                    <option value="QUINTAL">{t.unitQuintal}</option>
                    <option value="KG">{t.unitKg}</option>
                    <option value="LITER">{t.unitLiter}</option>
                    <option value="CRATE">{t.unitCrate}</option>
                    <option value="PIECE">{t.unitPiece}</option>
                    <option value="BUNDLE">{t.unitBundle}</option>
                    <option value="MONTH">{t.unitMonth}</option>
                    <option value="YEAR">{t.unitYear}</option>
                    <option value="LUMP_SUM">{t.unitLumpSum}</option>
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    {t.quantity} *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={quantity === '' ? '' : quantity}
                    onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 10"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 font-mono font-bold"
                  />
                </div>

                {/* Unit Price */}
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    {t.unitPrice} *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={unitPrice === '' ? '' : unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 1250"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 font-mono font-bold"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-stone-300 font-semibold mb-1">
                  {language === 'am' ? 'የወጪ መጠን (ETB)' : 'Expense Amount (ETB)'} *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={flatAmount === '' ? '' : flatAmount}
                  onChange={(e) => setFlatAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 25000"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 font-mono font-bold text-rose-400 text-sm"
                />
              </div>
            )}

            {/* Live Calculation Display Box */}
            <div className="bg-stone-900 border border-stone-800 rounded-lg p-2.5 flex items-center justify-between">
              <div className="text-[11px] text-stone-400">
                {calculationMode === 'CALCULATE' ? (
                  <span>
                    {quantity || 0} {unit} × {formatCurrency(Number(unitPrice) || 0)}
                  </span>
                ) : (
                  <span>{t.calcFlat}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-stone-400 text-[11px]">
                  {language === 'am' ? 'ድምር ወጪ:' : 'Total Expense:'}
                </span>
                <span className="font-mono font-bold text-rose-400 text-sm">
                  {formatCurrency(computedTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Payment Method & Reference Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'የተከፈለበት ዘዴ' : 'Payment Method'}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 focus:outline-none focus:border-rose-500"
              >
                <option value="CASH">{t.methodCash}</option>
                <option value="TELEBIRR">{t.methodTelebirr}</option>
                <option value="BANK_TRANSFER">{t.methodBankTransfer}</option>
                <option value="OTHER">{t.methodOther}</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'የደረሰኝ / ቢል ቁጥር' : 'Receipt / Reference # (Optional)'}
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. INV-9902 or CBE-441"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 font-mono focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* 5. Notes */}
          <div>
            <label className="block text-stone-300 font-semibold mb-1">
              {t.notes}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Supplier contact, delivery terms, employee details..."
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold cursor-pointer transition"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={computedTotal <= 0 || !description.trim()}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold shadow-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === 'am' ? 'ወጪውን መዝግብ' : 'Record Expense'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
