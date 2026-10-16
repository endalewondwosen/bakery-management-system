/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import { useToast } from '../common/ToastContext.tsx';
import { Product, CustomerPricingAgreement } from '../../types/domain.ts';
import { ProductFormModal } from './ProductFormModal.tsx';
import {
  Package,
  Plus,
  DollarSign,
  Tag,
  AlertTriangle,
  Pencil,
  Trash2,
  CheckCircle2,
  X,
  FileEdit,
  Sparkles
} from 'lucide-react';

export const ProductsPricingView: React.FC = () => {
  const { t, formatCurrency, language } = useLanguage();
  const { showSuccess, showError } = useToast();
  const {
    products,
    customers,
    pricingAgreements,
    setCustomerPricingAgreement,
    deleteProduct,
    deletePricingAgreement,
  } = useBakeryStore();

  // Product modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // Product delete confirmation modal state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Pricing Agreement form state
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [agreedPrice, setAgreedPrice] = useState<number>(20);
  const [notes, setNotes] = useState('');
  const [editingAgreementId, setEditingAgreementId] = useState<string | null>(null);

  // Pricing agreement delete confirmation
  const [agreementToDelete, setAgreementToDelete] = useState<CustomerPricingAgreement | null>(null);

  // Handlers for Products
  const handleOpenAddProduct = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setProductToEdit(product);
    setIsProductModalOpen(true);
  };

  const handleConfirmDeleteProduct = () => {
    if (!productToDelete) return;
    try {
      const prodName = language === 'am' ? productToDelete.nameAm : productToDelete.nameEn;
      deleteProduct(productToDelete.id);
      showSuccess(
        language === 'am' ? 'ምርቱ ተሰርዟል' : 'Product Deleted',
        language === 'am' ? `${prodName} በተሳካ ሁኔታ ተሰርዟል` : `${prodName} has been deleted.`
      );
      setProductToDelete(null);
    } catch (err: any) {
      showError(
        language === 'am' ? 'ምርቱን መሰረዝ አልተቻለም' : 'Failed to delete product',
        err?.message
      );
    }
  };

  // Handlers for Pricing Agreements
  const handleSaveAgreement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedProductId || agreedPrice <= 0) {
      showError(
        language === 'am' ? 'እባክዎ ሁሉንም መረጃዎች ያስገቡ' : 'Please fill all required agreement fields',
        language === 'am' ? 'ደንበኛ፣ ምርት እና ትክክለኛ ዋጋ ያስፈልጋሉ' : 'Customer, product and a valid rate are required.'
      );
      return;
    }

    try {
      setCustomerPricingAgreement(selectedCustomerId, selectedProductId, agreedPrice, notes);
      setNotes('');
      setEditingAgreementId(null);
      showSuccess(
        language === 'am' ? 'የስምምነት ዋጋው በተሳካ ሁኔታ ተመዝግቧል!' : 'Pricing Agreement Saved!',
        `${formatCurrency(agreedPrice)}`
      );
    } catch (err: any) {
      showError(
        language === 'am' ? 'ስምምነቱን መመዝገብ አልተቻለም' : 'Failed to save agreement',
        err?.message
      );
    }
  };

  const handleEditAgreement = (agreement: CustomerPricingAgreement) => {
    setEditingAgreementId(agreement.id);
    setSelectedCustomerId(agreement.customerId);
    setSelectedProductId(agreement.productId);
    setAgreedPrice(agreement.agreedPrice);
    setNotes(agreement.notes || '');

    // Scroll smoothly to agreement form
    const formElem = document.getElementById('pricing-agreement-form');
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleCancelEditAgreement = () => {
    setEditingAgreementId(null);
    setNotes('');
    setAgreedPrice(20);
  };

  const handleConfirmDeleteAgreement = () => {
    if (!agreementToDelete) return;
    try {
      deletePricingAgreement(agreementToDelete.id);
      showSuccess(
        language === 'am' ? 'የስምምነት ዋጋው ተሰርዟል' : 'Agreement Removed',
        language === 'am' ? 'የተለየው የስምምነት ዋጋ በተሳካ ሁኔታ ተሰርዟል' : 'Contract agreement removed successfully.'
      );
      if (editingAgreementId === agreementToDelete.id) {
        handleCancelEditAgreement();
      }
      setAgreementToDelete(null);
    } catch (err: any) {
      showError(
        language === 'am' ? 'ስምምነቱን መሰረዝ አልተቻለም' : 'Failed to remove agreement',
        err?.message
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            <span>{t.navProductsPricing}</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            {language === 'am'
              ? 'የዳቦ ዓይነቶች መደበኛ ዋጋ እና ለሆቴሎች/ካፌዎች የተሰጡ ልዩ የስምምነት ዋጋዎች'
              : 'Standard product catalog & customer negotiated contract pricing'}
          </p>
        </div>

        {/* Global Add Product CTA */}
        <button
          onClick={handleOpenAddProduct}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/10 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'am' ? 'አዲስ ምርት ጨምር' : 'Add New Product'}</span>
        </button>
      </div>

      {/* Standard Product Catalog Card List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-500" />
            <span>
              {language === 'am' ? 'የዳቦ ዓይነቶች እና መደበኛ የመሸጫ ዋጋ' : 'Standard Bread Product Catalog'}
            </span>
            <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-stone-800 text-stone-400">
              {products.length} {language === 'am' ? 'ምርቶች' : 'products'}
            </span>
          </h3>
        </div>

        {products.length === 0 ? (
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-200">
                {language === 'am' ? 'ምንም ምርቶች አልተገኙም' : 'No products in catalog'}
              </h4>
              <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1">
                {language === 'am'
                  ? 'የዳቦ ቤትዎን ትክክለኛ ምርቶች እና ዋጋዎች ለማስገባት "አዲስ ምርት ጨምር" የሚለውን ይጫኑ።'
                  : 'Get started by creating your first bread product with standard wholesale or retail base pricing.'}
              </p>
            </div>
            <button
              onClick={handleOpenAddProduct}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'am' ? 'የመጀመሪያውን ምርት ጨምር' : 'Add First Product'}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-stone-900 border border-stone-800 hover:border-stone-700 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3 text-xs transition relative group"
              >
                {/* Card Top: Names & Badges */}
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="pr-1">
                      <h4 className="font-bold text-stone-100 text-sm tracking-tight leading-snug">
                        {language === 'am' ? p.nameAm : p.nameEn}
                      </h4>
                      <div className="text-stone-400 text-[11px] mt-0.5">
                        {language === 'am' ? p.nameEn : p.nameAm}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-medium border border-stone-700/60">
                        {p.category}
                      </span>
                      {p.isActive === false && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-950/60 text-rose-400 border border-rose-800/50">
                          {language === 'am' ? 'ቦዝኗል' : 'Inactive'}
                        </span>
                      )}
                    </div>
                  </div>

                  {(p.descriptionAm || p.descriptionEn) && (
                    <p className="text-stone-400 text-[11px] line-clamp-2 leading-relaxed">
                      {language === 'am'
                        ? p.descriptionAm || p.descriptionEn
                        : p.descriptionEn || p.descriptionAm}
                    </p>
                  )}
                </div>

                {/* Card Bottom: Base Price and Edit/Delete Actions */}
                <div className="pt-2.5 border-t border-stone-800 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-stone-500 block text-[10px] uppercase tracking-wider font-semibold">
                      {t.basePrice}
                    </span>
                    <span className="text-base font-bold font-mono text-amber-400">
                      {formatCurrency(p.basePrice)}
                    </span>
                  </div>

                  {/* Edit and Delete Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditProduct(p)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-200 hover:text-amber-400 border border-stone-700 hover:border-amber-500/50 text-[11px] font-semibold transition active:scale-95"
                      title={language === 'am' ? 'ምርቱን አሻሽል' : 'Edit Product'}
                      aria-label={`Edit ${p.nameEn}`}
                    >
                      <Pencil className="w-3.5 h-3.5 text-amber-400" />
                      <span>{language === 'am' ? 'አሻሽል' : 'Edit'}</span>
                    </button>
                    <button
                      onClick={() => setProductToDelete(p)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-rose-950/40 text-stone-400 hover:text-rose-400 border border-stone-700 hover:border-rose-900/60 text-[11px] font-semibold transition active:scale-95"
                      title={language === 'am' ? 'ምርቱን ሰርዝ' : 'Delete Product'}
                      aria-label={`Delete ${p.nameEn}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>{language === 'am' ? 'ሰርዝ' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer-Specific Pricing Agreements */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-500" />
              <span>
                {language === 'am'
                  ? 'የተለዩ የደንበኞች የስምምነት ዋጋዎች (Customer-Specific Pricing)'
                  : 'Customer-Specific Pricing Contracts'}
              </span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              {language === 'am'
                ? 'አንዳንድ ደንበኞች በብዛት ስለሚገዙ የተስማሙበት ልዩ ዋጋ (ለምሳሌ 22 ብር በ 25 ብር ፈንታ)'
                : 'Negotiated wholesale contract pricing per client (e.g. 22 ETB instead of 25 ETB base price)'}
            </p>
          </div>
        </div>

        {/* Add/Edit Agreement Form */}
        <form
          id="pricing-agreement-form"
          onSubmit={handleSaveAgreement}
          className={`p-4 rounded-xl border transition space-y-3 text-xs ${
            editingAgreementId
              ? 'bg-amber-950/20 border-amber-500/40 ring-1 ring-amber-500/30'
              : 'bg-stone-850 border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-stone-300 flex items-center gap-2">
              {editingAgreementId ? (
                <>
                  <FileEdit className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400">
                    {language === 'am'
                      ? 'የስምምነት ዋጋ ማሻሻያ (Updating Negotiated Rate)'
                      : 'Update Negotiated Contract Rate'}
                  </span>
                </>
              ) : (
                <span>
                  {language === 'am'
                    ? 'አዲስ ወይም የተሻሻለ የስምምነት ዋጋ መዝግብ'
                    : 'Assign or Update Negotiated Rate'}
                </span>
              )}
            </div>
            {editingAgreementId && (
              <button
                type="button"
                onClick={handleCancelEditAgreement}
                className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-200 px-2 py-1 rounded bg-stone-800"
              >
                <X className="w-3.5 h-3.5" />
                <span>{language === 'am' ? 'ተው' : 'Cancel Edit'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-stone-400 mb-1">{t.selectCustomer}</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100 text-xs"
              >
                {customers.length === 0 ? (
                  <option value="">
                    {language === 'am' ? 'ምንም ደንበኛ የለም' : 'No customers available'}
                  </option>
                ) : (
                  customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.organizationName} {c.branch ? `(${c.branch})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-stone-400 mb-1">{language === 'am' ? 'ምርት' : 'Product'}</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100 text-xs"
              >
                {products.length === 0 ? (
                  <option value="">
                    {language === 'am' ? 'ምንም ምርት የለም' : 'No products available'}
                  </option>
                ) : (
                  products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {language === 'am' ? p.nameAm : p.nameEn} (Base: {p.basePrice})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-stone-400 mb-1">
                {language === 'am' ? 'የስምምነት ዋጋ (ETB)' : 'Agreed Price (ETB)'}
              </label>
              <input
                type="number"
                step="0.25"
                min="0.5"
                required
                value={agreedPrice}
                onChange={(e) => setAgreedPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100 font-mono font-bold text-amber-400 text-xs"
              />
            </div>

            <div>
              <label className="block text-stone-400 mb-1">
                {language === 'am' ? 'የስምምነት ማስታወሻ' : 'Notes / Volume'}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 150+ daily requirement"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            {editingAgreementId && (
              <button
                type="button"
                onClick={handleCancelEditAgreement}
                className="px-3 py-1.5 rounded-xl text-stone-400 hover:text-stone-200 text-xs font-semibold"
              >
                {language === 'am' ? 'ተው' : 'Cancel'}
              </button>
            )}
            <button
              type="submit"
              disabled={customers.length === 0 || products.length === 0}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-sm active:scale-95 transition disabled:opacity-50"
            >
              {editingAgreementId
                ? language === 'am'
                  ? 'ስምምነቱን አሻሽል'
                  : 'Update Agreement'
                : language === 'am'
                ? 'ስምምነቱን መዝግብ'
                : 'Save Agreement'}
            </button>
          </div>
        </form>

        {/* Existing Contracts Table */}
        <div className="border border-stone-800 rounded-xl overflow-hidden bg-stone-850/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-800/80 text-stone-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Customer / Organization</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3 text-right">Standard Base Price</th>
                  <th className="py-2.5 px-3 text-right">Agreed Contract Price</th>
                  <th className="py-2.5 px-3">Effective Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {pricingAgreements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-stone-500">
                      {language === 'am'
                        ? 'ምንም የተመዘገቡ የደንበኞች የስምምነት ዋጋዎች የሉም'
                        : 'No custom customer contract agreements registered yet.'}
                    </td>
                  </tr>
                ) : (
                  pricingAgreements.map((ag) => {
                    const cust = customers.find((c) => c.id === ag.customerId);
                    const prod = products.find((p) => p.id === ag.productId);
                    const isRowEditing = editingAgreementId === ag.id;

                    return (
                      <tr
                        key={ag.id}
                        className={`transition ${
                          isRowEditing ? 'bg-amber-500/10' : 'hover:bg-stone-800/30'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-semibold text-stone-100">
                          {cust?.organizationName || ag.customerId}
                          {cust?.branch && (
                            <span className="text-stone-500 text-[11px] block">{cust.branch}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {prod ? (language === 'am' ? prod.nameAm : prod.nameEn) : ag.productId}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-400">
                          {prod ? formatCurrency(prod.basePrice) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                          {formatCurrency(ag.agreedPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-stone-400 text-[11px]">
                          {ag.effectiveDate ? new Date(ag.effectiveDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-medium">
                            Active
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-stone-400 text-[11px]">
                          {ag.notes || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditAgreement(ag)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-stone-800 transition"
                              title={language === 'am' ? 'ስምምነቱን አሻሽል' : 'Edit Agreement'}
                              aria-label="Edit agreement"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setAgreementToDelete(ag)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition"
                              title={language === 'am' ? 'ስምምነቱን ሰርዝ' : 'Delete Agreement'}
                              aria-label="Delete agreement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Product Add / Edit Modal */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
      />

      {/* Delete Product Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-100">
                  {language === 'am' ? 'ምርቱን መሰረዝ ይፈልጋሉ?' : 'Delete Product?'}
                </h3>
                <p className="text-xs text-stone-300">
                  {language === 'am' ? (
                    <>
                      እርግጠኛ ነዎት{' '}
                      <strong className="text-amber-400">
                        {productToDelete.nameAm} ({productToDelete.nameEn})
                      </strong>{' '}
                      መሰረዝ ይፈልጋሉ? ከዚህ ምርት ጋር የተያያዙ ማናቸውም ልዩ የስምምነት ዋጋዎች እንዲሁ ይሰረዛሉ።
                    </>
                  ) : (
                    <>
                      Are you sure you want to delete{' '}
                      <strong className="text-amber-400">
                        {productToDelete.nameEn} ({productToDelete.nameAm})
                      </strong>
                      ? Any custom contract agreements linked to this product will also be removed.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 text-xs font-semibold transition"
              >
                {language === 'am' ? 'ተው' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>{language === 'am' ? 'አዎ፣ ሰርዝ' : 'Yes, Delete Product'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Pricing Agreement Confirmation Modal */}
      {agreementToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-100">
                  {language === 'am' ? 'የስምምነት ዋጋውን መሰረዝ ይፈልጋሉ?' : 'Remove Pricing Agreement?'}
                </h3>
                <p className="text-xs text-stone-300">
                  {language === 'am' ? (
                    <>
                      ይህን የደንበኛ ልዩ የስምምነት ዋጋ (
                      <strong className="text-amber-400">
                        {formatCurrency(agreementToDelete.agreedPrice)}
                      </strong>
                      ) መሰረዝ ይፈልጋሉ? ደንበኛው ወደ መደበኛ የመሸጫ ዋጋ ይመለሳል።
                    </>
                  ) : (
                    <>
                      Remove this negotiated contract rate (
                      <strong className="text-amber-400">
                        {formatCurrency(agreementToDelete.agreedPrice)}
                      </strong>
                      )? Future orders for this customer will use the standard base catalog price.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setAgreementToDelete(null)}
                className="px-4 py-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 text-xs font-semibold transition"
              >
                {language === 'am' ? 'ተው' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAgreement}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>{language === 'am' ? 'አዎ፣ ሰርዝ' : 'Yes, Remove Agreement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
