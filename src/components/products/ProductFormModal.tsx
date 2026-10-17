/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import { useToast } from '../common/ToastContext.tsx';
import { Product } from '../../types/domain.ts';
import { X, Package, Tag, DollarSign, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

const CATEGORY_OPTIONS = [
  { value: 'Burger Buns', labelEn: 'Burger Buns', labelAm: 'የበርገር ዳቦ' },
  { value: 'Sandwich Bread', labelEn: 'Sandwich Bread', labelAm: 'የሳንድዊች ዳቦ' },
  { value: 'Special Breads', labelEn: 'Special Breads', labelAm: 'ልዩ ዳቦ' },
  { value: 'Rolls & Small', labelEn: 'Rolls & Small Breads', labelAm: 'ትንንሽ ዳቦዎች' },
  { value: 'Pastry & Cakes', labelEn: 'Pastry & Cakes', labelAm: 'ኬክና መክሰስ' },
  { value: 'Other', labelEn: 'Other / Custom', labelAm: 'ሌሎች' },
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { language, formatCurrency } = useLanguage();
  const { showSuccess, showError } = useToast();
  const { addProduct, updateProduct } = useBakeryStore();

  const [nameEn, setNameEn] = useState('');
  const [nameAm, setNameAm] = useState('');
  const [basePrice, setBasePrice] = useState<number | ''>(20);
  const [category, setCategory] = useState('Burger Buns');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionAm, setDescriptionAm] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form state when opened or productToEdit changes
  const prevOpenRef = useRef(false);
  const prevEditIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const justOpened = isOpen && !prevOpenRef.current;
    const editChanged = isOpen && productToEdit?.id !== prevEditIdRef.current;

    if (justOpened || editChanged) {
      if (productToEdit) {
        setNameEn(productToEdit.nameEn || '');
        setNameAm(productToEdit.nameAm || '');
        setBasePrice(productToEdit.basePrice ?? 20);
        setCategory(productToEdit.category || 'Burger Buns');
        setDescriptionEn(productToEdit.descriptionEn || '');
        setDescriptionAm(productToEdit.descriptionAm || '');
        setIsActive(productToEdit.isActive ?? true);
      } else {
        setNameEn('');
        setNameAm('');
        setBasePrice(20);
        setCategory('Burger Buns');
        setDescriptionEn('');
        setDescriptionAm('');
        setIsActive(true);
      }
      setValidationError('');
      setIsSubmitting(false);
    }

    prevOpenRef.current = isOpen;
    prevEditIdRef.current = productToEdit?.id;
  }, [isOpen, productToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!nameEn.trim()) {
      setValidationError(
        language === 'am' ? 'እባክዎ የእንግሊዝኛ የምርት ስም ያስገቡ' : 'Please provide product name in English'
      );
      return;
    }

    if (!nameAm.trim()) {
      setValidationError(
        language === 'am' ? 'እባክዎ የአማርኛ የምርት ስም ያስገቡ' : 'Please provide product name in Amharic'
      );
      return;
    }

    const priceNum = typeof basePrice === 'number' ? basePrice : parseFloat(basePrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setValidationError(
        language === 'am' ? 'እባክዎ ትክክለኛ መደበኛ ዋጋ (ከ 0 በላይ) ያስገቡ' : 'Please enter a valid base price (> 0)'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      if (productToEdit) {
        updateProduct(productToEdit.id, {
          nameEn: nameEn.trim(),
          nameAm: nameAm.trim(),
          basePrice: priceNum,
          category,
          descriptionEn: descriptionEn.trim() || undefined,
          descriptionAm: descriptionAm.trim() || undefined,
          isActive,
        });

        showSuccess(
          language === 'am' ? 'ምርቱ በተሳካ ሁኔታ ተሻሽሏል!' : 'Product Updated!',
          `${language === 'am' ? nameAm : nameEn} (${formatCurrency(priceNum)})`
        );
      } else {
        addProduct({
          nameEn: nameEn.trim(),
          nameAm: nameAm.trim(),
          basePrice: priceNum,
          category,
          descriptionEn: descriptionEn.trim() || undefined,
          descriptionAm: descriptionAm.trim() || undefined,
          isActive,
        });

        showSuccess(
          language === 'am' ? 'አዲስ ምርት በተሳካ ሁኔታ ተመዝግቧል!' : 'Product Created!',
          `${language === 'am' ? nameAm : nameEn} (${formatCurrency(priceNum)})`
        );
      }

      onClose();
    } catch (err: any) {
      showError(
        language === 'am' ? 'ምርቱን ማስቀመጥ አልተቻለም' : 'Failed to save product',
        err?.message || 'Error saving product'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 modal-backdrop-soft overflow-y-auto">
      <div
        className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 bg-stone-850/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-100 text-base">
                {productToEdit
                  ? language === 'am'
                    ? 'ምርቱን አሻሽል'
                    : 'Edit Product'
                  : language === 'am'
                  ? 'አዲስ ምርት መዝግብ'
                  : 'Add New Product'}
              </h3>
              <p className="text-xs text-stone-400">
                {language === 'am'
                  ? 'የዳቦ ዓይነት፣ መደበኛ የመሸጫ ዋጋ እና ምድብ'
                  : 'Bread item catalog details and standard base price'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {validationError && (
            <div className="flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Names in English & Amharic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                {language === 'am' ? 'የምርት ስም (እንግሊዝኛ) *' : 'Product Name (English) *'}
              </label>
              <input
                type="text"
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Burger with egg"
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                {language === 'am' ? 'የምርት ስም (አማርኛ) *' : 'Product Name (Amharic) *'}
              </label>
              <input
                type="text"
                required
                value={nameAm}
                onChange={(e) => setNameAm(e.target.value)}
                placeholder="ለምሳሌ፡ በርገር በእንቁላል"
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          {/* Base Price & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5 flex items-center justify-between">
                <span>{language === 'am' ? 'መደበኛ ዋጋ (ETB) *' : 'Base Price (ETB) *'}</span>
                <span className="text-[10px] text-stone-400 font-normal">Per loaf / piece</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.25"
                  min="0.5"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="20.00"
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 pl-8 text-amber-400 font-mono font-bold text-sm focus:outline-none focus:border-amber-500 transition"
                />
                <span className="absolute left-3 top-2.5 text-stone-500 font-mono text-xs">Br</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                {language === 'am' ? 'የዳቦ ምድብ *' : 'Category *'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-amber-500 transition"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {language === 'am' ? cat.labelAm : cat.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description En & Am */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                {language === 'am' ? 'መግለጫ (እንግሊዝኛ)' : 'Description (English)'}
              </label>
              <textarea
                rows={2}
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                placeholder="e.g. Freshly baked burger bun brushed with farm egg wash"
                className="w-full bg-stone-800 border border-stone-700 rounded-xl p-2.5 text-stone-100 text-xs focus:outline-none focus:border-amber-500 transition resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                {language === 'am' ? 'መግለጫ (አማርኛ)' : 'Description (Amharic)'}
              </label>
              <textarea
                rows={2}
                value={descriptionAm}
                onChange={(e) => setDescriptionAm(e.target.value)}
                placeholder="ለምሳሌ፡ ትኩስ የእንቁላል ቅባት የተቀባ የበርገር ዳቦ"
                className="w-full bg-stone-800 border border-stone-700 rounded-xl p-2.5 text-stone-100 text-xs focus:outline-none focus:border-amber-500 transition resize-none"
              />
            </div>
          </div>

          {/* Active status */}
          <div className="pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-stone-800 border-stone-700"
              />
              <span className="text-xs text-stone-300">
                {language === 'am'
                  ? 'ምርቱ ለትዕዛዝ ክፍት ነው (Active in catalog)'
                  : 'Active & available for orders in catalog'}
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 text-xs font-semibold transition"
            >
              {language === 'am' ? 'ተው' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-md hover:shadow-amber-500/20 active:scale-95 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {productToEdit
                  ? language === 'am'
                    ? 'ለውጦቹን አስቀምጥ'
                    : 'Save Changes'
                  : language === 'am'
                  ? 'ምርቱን መዝግብ'
                  : 'Create Product'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
