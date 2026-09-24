/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import { X, Receipt } from 'lucide-react';
import { ExpenseCategory, PaymentMethod } from '../../types/domain.ts';

interface RecordExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecordExpenseModal: React.FC<RecordExpenseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t, language } = useLanguage();
  const { recordExpense } = useBakeryStore();

  const [category, setCategory] = useState<ExpenseCategory>('RAW_FLOUR');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description.trim()) return;

    recordExpense({
      amount,
      category,
      description,
      paymentMethod,
      referenceNumber: referenceNumber || undefined,
      notes: notes || undefined,
      recordedBy: 'Owner',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-xs">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-850 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                {t.logExpense}
              </h2>
              <p className="text-stone-400 text-[11px]">
                {language === 'am' ? 'የጥሬ ዕቃ፣ የነዳጅ ወይም ሌላ የስራ ማስኬጃ ወጪ መዝግብ' : 'Record raw materials, fuel, utilities or operational costs'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-100 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'የወጪ ምድብ (Category)' : 'Expense Category'} *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
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
                {language === 'am' ? 'የወጪ መጠን (ETB)' : 'Expense Amount (ETB)'} *
              </label>
              <input
                type="number"
                min="1"
                required
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="e.g. 12000"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 font-mono font-bold text-rose-400"
              />
            </div>
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
              placeholder="e.g. 10 quintals flour, 12 crates eggs from farm..."
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'የተከፈለበት ዘዴ' : 'Payment Method'}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
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
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-300 font-semibold mb-1">
              {t.notes}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Supplier contact, delivery terms..."
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={amount <= 0 || !description.trim()}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold"
            >
              {language === 'am' ? 'ወጪውን መዝግብ' : 'Record Expense'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
