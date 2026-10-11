/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import { useToast } from '../common/ToastContext.tsx';
import {
  X,
  ShoppingBag,
  Truck,
  Clock,
  MapPin,
  User,
  Plus,
  Trash2,
  FileText,
  Save
} from 'lucide-react';
import { Order, DeliveryType, OrderStatus } from '../../types/domain.ts';

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

interface EditableItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const { t, formatCurrency, language } = useLanguage();
  const { showSuccess, showError } = useToast();
  const { products, getOrderItems, updateOrder, getCustomerAgreedPrice } = useBakeryStore();

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('DELIVERY');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [driverName, setDriverName] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<OrderStatus>('CONFIRMED');
  const [items, setItems] = useState<EditableItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order && isOpen) {
      setDeliveryType(order.deliveryType);
      setDeliveryAddress(order.deliveryAddress || '');
      setScheduledTime(order.scheduledTime || '');
      setDriverName(order.driverName || '');
      setDeliveryNotes(order.deliveryNotes || '');
      setNotes(order.notes || '');
      setStatus(order.status);

      const existingItems = getOrderItems(order.id);
      if (existingItems && existingItems.length > 0) {
        setItems(
          existingItems.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          }))
        );
      } else {
        setItems([]);
      }
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const handleItemChange = (index: number, field: keyof EditableItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      if (field === 'productId') {
        const agreed = getCustomerAgreedPrice(order.customerId, value);
        updated[index] = {
          ...updated[index],
          productId: value,
          unitPrice: agreed.price,
        };
      } else {
        updated[index] = {
          ...updated[index],
          [field]: value,
        };
      }
      return updated;
    });
  };

  const handleAddItem = () => {
    const defaultProd = products[0];
    if (!defaultProd) return;
    const agreed = getCustomerAgreedPrice(order.customerId, defaultProd.id);
    setItems((prev) => [
      ...prev,
      {
        productId: defaultProd.id,
        quantity: 50,
        unitPrice: agreed.price,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculatedTotal = items.reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (items.length === 0) {
      showError(
        language === 'am' ? 'ቢያንስ አንድ ዳቦ ያስፈልጋል' : 'Items Required',
        language === 'am' ? 'እባክዎ በትዕዛዙ ውስጥ ቢያንስ አንድ ምርት ያስገቡ' : 'Please include at least one bread item in order'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      updateOrder(order.id, {
        deliveryType,
        deliveryAddress: deliveryAddress.trim() || undefined,
        scheduledTime: scheduledTime.trim() || undefined,
        driverName: driverName.trim() || undefined,
        deliveryNotes: deliveryNotes.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
        })),
      });

      showSuccess(
        language === 'am' ? 'ትዕዛዝ ተሻሽሏል!' : 'Order Updated!',
        language === 'am'
          ? `ትዕዛዝ ${order.orderNumber} በተሳካ ሁኔታ ተሻሽሏል (${formatCurrency(calculatedTotal)})`
          : `Order ${order.orderNumber} successfully updated (${formatCurrency(calculatedTotal)})`
      );

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-xs">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-100 font-mono">
                  {language === 'am' ? 'ትዕዛዝ ማሻሻያ' : 'Edit Order'} {order.orderNumber}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  {order.organizationName}
                </span>
              </div>
              <p className="text-stone-400 text-[11px] mt-0.5">
                {language === 'am' ? 'ብዛት፣ ምርት፣ የማድረሻ ሰዓት እና አከፋፋይ ይቀይሩ' : 'Update bread quantities, items, delivery schedule, and driver'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-1 rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Order Status & Delivery Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-850/60 p-3.5 rounded-xl border border-stone-800">
            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'የትዕዛዝ ሁኔታ' : 'Order Status'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 font-medium"
              >
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PREPARING">PREPARING</option>
                <option value="READY">READY</option>
                <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'የማድረሻ ዓይነት' : 'Delivery Type'}
              </label>
              <select
                value={deliveryType}
                onChange={(e) => setDeliveryType(e.target.value as DeliveryType)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 font-medium"
              >
                <option value="DELIVERY">{t.deliveryTypeDelivery}</option>
                <option value="PICKUP">{t.deliveryTypePickup}</option>
              </select>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'የማድረሻ ሰዓት' : 'Scheduled Delivery Time'}
              </label>
              <input
                type="text"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="e.g. 06:30 AM, 11:00 AM"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
              />
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'አከፋፋይ ሾፌር' : 'Delivery Driver'}
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g. Kassahun, Driver 1"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'የማድረሻ አድራሻ' : 'Delivery Drop-off Address'}
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Specific branch, landmark, or street"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
              />
            </div>
          </div>

          {/* Bread Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-200">
                {language === 'am' ? 'የዳቦ ዝርዝር እና ብዛት' : 'Bread Items & Quantities'}
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 font-medium transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'am' ? 'ምርት ጨምር' : 'Add Item'}</span>
              </button>
            </div>

            <div className="border border-stone-800 rounded-xl overflow-hidden bg-stone-850/40">
              <div className="divide-y divide-stone-800">
                {items.map((it, idx) => (
                  <div key={idx} className="p-3 flex flex-col sm:flex-row items-center gap-3 justify-between">
                    <div className="w-full sm:w-1/2">
                      <select
                        value={it.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {language === 'am' ? p.nameAm : p.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-400 text-[11px]">{language === 'am' ? 'ብዛት:' : 'Qty:'}</span>
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-20 bg-stone-800 border border-stone-700 rounded-lg px-2 py-1 text-center font-mono text-stone-100 font-bold"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-400 text-[11px]">{language === 'am' ? 'ዋጋ:' : 'Price:'}</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={it.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-20 bg-stone-800 border border-stone-700 rounded-lg px-2 py-1 text-center font-mono text-stone-100"
                        />
                      </div>

                      <div className="font-mono font-bold text-amber-400 w-24 text-right">
                        {formatCurrency(it.quantity * it.unitPrice)}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 rounded text-stone-500 hover:text-rose-400 hover:bg-stone-800 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-stone-300 font-semibold mb-1">
              {language === 'am' ? 'ማስታወሻ' : 'Notes'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Driver notes, packing requirements..."
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-3">
            <div>
              <span className="text-stone-400 text-[11px] block">{language === 'am' ? 'የተስተካከለ ድምር:' : 'Updated Total:'}</span>
              <span className="text-lg font-mono font-bold text-amber-400">{formatCurrency(calculatedTotal)}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold transition shadow"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? (language === 'am' ? 'በማስቀመጥ ላይ...' : 'Saving...') : t.save}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
