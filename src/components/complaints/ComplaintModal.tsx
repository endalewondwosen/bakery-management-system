/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import { X, MessageSquareWarning } from 'lucide-react';
import { ComplaintCategory, ComplaintPriority } from '../../types/domain.ts';

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCustomerId?: string;
}

export const ComplaintModal: React.FC<ComplaintModalProps> = ({
  isOpen,
  onClose,
  preselectedCustomerId,
}) => {
  const { t, language } = useLanguage();
  const { customers, products, orders, fileComplaint } = useBakeryStore();

  const [customerId, setCustomerId] = useState<string>(
    preselectedCustomerId || (customers[0]?.id || '')
  );
  const [orderId, setOrderId] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [category, setCategory] = useState<ComplaintCategory>('BREAD_QUALITY');
  const [priority, setPriority] = useState<ComplaintPriority>('HIGH');
  const [quantityAffected, setQuantityAffected] = useState<number>(0);
  const [description, setDescription] = useState<string>('');

  if (!isOpen) return null;

  const customerOrders = orders.filter((o) => o.customerId === customerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !description.trim()) return;

    fileComplaint({
      customerId,
      orderId: orderId || undefined,
      productId: productId || undefined,
      category,
      priority,
      quantityAffected: quantityAffected > 0 ? quantityAffected : undefined,
      description,
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
              <MessageSquareWarning className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                {t.fileComplaint}
              </h2>
              <p className="text-stone-400 text-[11px]">
                {language === 'am' ? 'የጥራት፣ ብዛት ወይም የማድረስ ቅሬታ መዝግብ' : 'Log bread quality, wrong quantity, or delivery complaint'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-100 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          
          <div>
            <label className="block text-stone-300 font-semibold mb-1">
              {t.selectCustomer} *
            </label>
            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setOrderId('');
              }}
              required
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.organizationName} ({c.name})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'የትዕዛዝ ቁጥር (ካለ)' : 'Related Order (Optional)'}
              </label>
              <select
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 font-mono"
              >
                <option value="">{language === 'am' ? 'ያለ ትዕዛዝ ቁጥር' : 'No specific order'}</option>
                {customerOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} ({new Date(o.orderDate).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'የተጎዳው የዳቦ ዓይነት (ካለ)' : 'Affected Product (Optional)'}
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
              >
                <option value="">{language === 'am' ? 'አጠቃላይ / አልተገለጸም' : 'General / Not specified'}</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {language === 'am' ? p.nameAm : p.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'የቅሬታ ዓይነት' : 'Complaint Category'} *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100"
              >
                <option value="BREAD_QUALITY">{t.compBreadQuality}</option>
                <option value="WRONG_QUANTITY">{t.compWrongQuantity}</option>
                <option value="WRONG_PRODUCT">{t.compWrongProduct}</option>
                <option value="LATE_DELIVERY">{t.compLateDelivery}</option>
                <option value="DELIVERY_PROBLEM">{t.compDeliveryProblem}</option>
                <option value="PACKAGING">{t.compPackaging}</option>
                <option value="PRICE_BILLING">{t.compPriceBilling}</option>
                <option value="DAMAGED_PRODUCT">{t.compDamagedProduct}</option>
                <option value="OTHER">{t.compOther}</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'አስቸኳይነት' : 'Priority'}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100"
              >
                <option value="LOW">{t.priorityLow}</option>
                <option value="MEDIUM">{t.priorityMedium}</option>
                <option value="HIGH">{t.priorityHigh}</option>
                <option value="URGENT">{t.priorityUrgent}</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'የተጎዳ ዳቦ ብዛት' : 'Qty Affected'}
              </label>
              <input
                type="number"
                min="0"
                value={quantityAffected || ''}
                onChange={(e) => setQuantityAffected(Number(e.target.value))}
                placeholder="e.g. 20"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-300 font-semibold mb-1">
              {language === 'am' ? 'የቅሬታው ሙሉ ማብራሪያ' : 'Complaint Details'} *
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Bread was under-baked and too soft, delivery arrived 30 min late..."
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
              disabled={!description.trim()}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold"
            >
              {language === 'am' ? 'ቅሬታውን መዝግብ' : 'Log Complaint'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
