/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import {
  X,
  ShoppingBag,
  Clock,
  MapPin,
  Truck,
  CreditCard,
  Plus,
  Repeat,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { OrderStatus } from '../../types/domain.ts';

interface OrderDetailModalProps {
  orderId: string | null;
  onClose: () => void;
  onOpenRecordPayment: (orderId: string, customerId: string) => void;
  onCustomerSelect: (customerId: string) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  orderId,
  onClose,
  onOpenRecordPayment,
  onCustomerSelect,
}) => {
  const { t, formatCurrency, language } = useLanguage();
  const {
    orders,
    getOrderItems,
    getOrderPayments,
    getOrderPaidAmount,
    getOrderOutstandingAmount,
    updateOrderStatus,
    repeatOrder,
    verifyPayment,
  } = useBakeryStore();

  const [deliveryStaffInput, setDeliveryStaffInput] = useState('');

  if (!orderId) return null;

  const order = orders.find((o) => o.id === orderId);
  if (!order) return null;

  const items = getOrderItems(order.id);
  const orderPayments = getOrderPayments(order.id);
  const paidAmount = getOrderPaidAmount(order.id);
  const outstandingAmount = getOrderOutstandingAmount(order.id);

  const handleRepeatOrder = () => {
    const newOrd = repeatOrder(order.id);
    alert(
      language === 'am'
        ? `አዲስ ትዕዛዝ ቁጥር ${newOrd.orderNumber} በተሳካ ሁኔታ ተፈጥሯል!`
        : `New repeat order ${newOrd.orderNumber} successfully created!`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono font-bold text-sm">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-100 font-mono">
                  {order.orderNumber}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-medium">
                  {order.status}
                </span>
                <span className="text-xs text-stone-400 font-mono">
                  {order.orderSource}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {new Date(order.orderDate).toLocaleString()}
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* Customer Summary Card */}
          <div className="bg-stone-850 border border-stone-800 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-stone-400 uppercase font-semibold">
                {language === 'am' ? 'የታዘዘበት ደንበኛ' : 'Customer'}
              </div>
              <button
                onClick={() => {
                  onClose();
                  onCustomerSelect(order.customerId);
                }}
                className="text-sm font-bold text-amber-400 hover:underline text-left mt-0.5"
              >
                {order.organizationName}
              </button>
              <div className="text-stone-400 text-xs mt-0.5">
                {order.customerName} · {order.customerPhone} {order.branch ? `(${order.branch})` : ''}
              </div>
            </div>

            <div className="text-right">
              <button
                onClick={handleRepeatOrder}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-medium transition cursor-pointer"
              >
                <Repeat className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.repeatOrder}</span>
              </button>
            </div>
          </div>

          {/* Delivery Card */}
          <div className="bg-stone-850/60 border border-stone-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-500" />
                <span>
                  {order.deliveryType === 'DELIVERY' ? t.deliveryTypeDelivery : t.deliveryTypePickup}
                </span>
              </span>
              <span className="text-stone-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {order.scheduledTime || 'No time set'}
              </span>
            </div>

            {order.deliveryAddress && (
              <div className="text-stone-400 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                <span>{order.deliveryAddress}</span>
              </div>
            )}

            {order.driverName && (
              <div className="text-stone-400 text-[11px]">
                {language === 'am' ? 'አከፋፋይ:' : 'Driver:'} <span className="text-stone-300 font-medium">{order.driverName}</span>
              </div>
            )}

            {/* Status change actions */}
            <div className="pt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-stone-400 text-[11px] mr-1">
                {language === 'am' ? 'ሁኔታ ቀይር:' : 'Change Status:'}
              </span>
              {(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => updateOrderStatus(order.id, st)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                      order.status === st
                        ? 'bg-amber-600 text-stone-950 font-bold'
                        : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Ordered Items Table */}
          <div className="space-y-2">
            <div className="font-semibold text-stone-300 text-xs">
              {language === 'am' ? 'የታዘዙ ዳቦዎች ዝርዝር' : 'Order Line Items'}
            </div>
            <div className="border border-stone-800 rounded-xl overflow-hidden bg-stone-850/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-800/80 text-stone-400 text-[10px] uppercase">
                  <tr>
                    <th className="py-2 px-3">Product</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">Unit Price</th>
                    <th className="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800 text-stone-300">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-stone-100">
                          {language === 'am' ? item.productNameAm : item.productNameEn}
                        </div>
                        <div className="text-[10px] text-stone-500">
                          {language === 'am' ? item.productNameEn : item.productNameAm}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-medium">
                        {item.quantity}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-stone-400">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-stone-200">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Totals & Outstanding */}
          <div className="bg-stone-850 border border-stone-800 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-stone-400 text-xs">
              <span>{t.orderTotal}:</span>
              <span className="font-mono font-bold text-stone-100">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between text-stone-400 text-xs">
              <span>{t.paidAmount} ({language === 'am' ? 'የተረጋገጠ' : 'Verified'}):</span>
              <span className="font-mono font-bold text-emerald-400">
                {formatCurrency(paidAmount)}
              </span>
            </div>
            <div className="border-t border-stone-800 pt-2 flex justify-between text-sm">
              <span className="font-bold text-stone-200">{t.outstandingAmount}:</span>
              <span className={`font-mono font-bold ${outstandingAmount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {formatCurrency(outstandingAmount)}
              </span>
            </div>
          </div>

          {/* Payments Timeline & Transactions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-300 text-xs flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'am' ? 'የክፍያ ታሪክ' : 'Payment Transactions'} ({orderPayments.length})</span>
              </span>

              {outstandingAmount > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenRecordPayment(order.id, order.customerId)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{t.recordPayment}</span>
                </button>
              )}
            </div>

            {orderPayments.length === 0 ? (
              <div className="p-3 text-center text-stone-500 border border-dashed border-stone-800 rounded-xl text-xs">
                {language === 'am' ? 'እስካሁን የተመዘገበ ክፍያ የለም (በሙሉ በብድር)' : 'No payment recorded yet (Full Credit)'}
              </div>
            ) : (
              <div className="space-y-1.5">
                {orderPayments.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-lg bg-stone-850 border border-stone-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-400">
                          {formatCurrency(p.amount)}
                        </span>
                        <span className="font-medium text-stone-200">
                          {p.paymentMethod}
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          {p.receiptNumber}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-2">
                        <span>{new Date(p.paymentDate).toLocaleTimeString()}</span>
                        {p.transactionReference && (
                          <span className="font-mono bg-stone-800 px-1 rounded text-stone-300">
                            Txn: {p.transactionReference}
                          </span>
                        )}
                        {p.notes && <span>· {p.notes}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                        p.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : p.verificationStatus === 'PENDING_VERIFICATION'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                          : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                      }`}>
                        {p.verificationStatus}
                      </span>
                      {p.verificationStatus === 'PENDING_VERIFICATION' && (
                        <button
                          onClick={() => verifyPayment(p.id, 'Bakery Owner')}
                          className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-medium"
                        >
                          {t.verify}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-850 flex items-center justify-between shrink-0">
          <div className="text-stone-400 text-xs">
            {language === 'am' ? 'የመዘገበው:' : 'Logged by:'} {order.createdBy}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium"
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
};
