/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import { X, Wallet, Building, Check, AlertCircle } from 'lucide-react';
import { PaymentMethod } from '../../types/domain.ts';
import { useToast } from '../common/ToastContext.tsx';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedOrderId?: string;
  preselectedCustomerId?: string;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  preselectedOrderId,
  preselectedCustomerId,
}) => {
  const { t, formatCurrency, language } = useLanguage();
  const { showSuccess, showError } = useToast();
  const {
    customers,
    orders,
    recordPayment,
    getOrderOutstandingAmount,
    getCustomerBalance,
  } = useBakeryStore();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    preselectedCustomerId || (customers[0]?.id || '')
  );

  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    preselectedOrderId || ''
  );

  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [markVerified, setMarkVerified] = useState<boolean>(true);

  // Customer's open orders with debt
  const customerOrdersWithDebt = useMemo(() => {
    if (!selectedCustomerId) return [];
    return orders
      .filter((o) => o.customerId === selectedCustomerId && o.status !== 'CANCELLED')
      .map((o) => ({
        order: o,
        outstanding: getOrderOutstandingAmount(o.id),
      }))
      .filter((item) => item.outstanding > 0);
  }, [orders, selectedCustomerId, getOrderOutstandingAmount]);

  // Overall customer debt
  const customerBalance = useMemo(() => {
    if (!selectedCustomerId) return { outstandingBalance: 0 };
    return getCustomerBalance(selectedCustomerId);
  }, [selectedCustomerId, getCustomerBalance]);

  // Sync default amount when order selection changes
  React.useEffect(() => {
    if (selectedOrderId) {
      const out = getOrderOutstandingAmount(selectedOrderId);
      setAmount(out);
    } else if (customerOrdersWithDebt.length > 0) {
      setSelectedOrderId(customerOrdersWithDebt[0].order.id);
      setAmount(customerOrdersWithDebt[0].outstanding);
    } else {
      setSelectedOrderId('');
      setAmount(customerBalance.outstandingBalance);
    }
  }, [selectedOrderId, selectedCustomerId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || amount <= 0) {
      showError(
        language === 'am' ? 'ልክ ያልሆነ መጠን' : 'Invalid Payment Amount',
        language === 'am' ? 'እባክዎ ትክክለኛ የክፍያ መጠን ያስገቡ!' : 'Please enter a valid payment amount!'
      );
      return;
    }

    // Use selected order or first open order
    const targetOrderId = selectedOrderId || (customerOrdersWithDebt[0]?.order.id || 'general-debt-allocation');

    const createdPayment = recordPayment({
      orderId: targetOrderId,
      customerId: selectedCustomerId,
      amount,
      paymentMethod,
      transactionReference: transactionReference || undefined,
      notes: notes || undefined,
      isVerified: paymentMethod === 'CASH' ? true : markVerified,
    });

    const targetCustomer = customers.find((c) => c.id === selectedCustomerId);
    showSuccess(
      language === 'am' ? 'ክፍያ ተመዝግቧል!' : 'Payment Recorded!',
      language === 'am'
        ? `የ${formatCurrency(amount)} ክፍያ ተመዝግቧል (ደረሰኝ ${createdPayment.receiptNumber} - ${targetCustomer?.organizationName || 'ደንበኛ'})`
        : `Payment of ${formatCurrency(amount)} recorded (${createdPayment.receiptNumber} - ${targetCustomer?.organizationName || 'Customer'})`
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-xs">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-850 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                {t.recordPayment}
              </h2>
              <p className="text-stone-400 text-[11px]">
                {language === 'am' ? 'ክፍያ መዝግብ እና የደንበኛ ዕዳ ቀንሰው' : 'Log payment against order or customer balance'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-100 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Customer Selection */}
          <div>
            <label className="block text-stone-300 font-semibold mb-1">
              {t.selectCustomer} *
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                setSelectedOrderId('');
              }}
              required
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.organizationName} ({c.name}) — {c.phone}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Balance Callout */}
          <div className="bg-stone-850 border border-stone-800 rounded-lg p-3 flex items-center justify-between">
            <span className="text-stone-400">
              {language === 'am' ? 'የደንበኛው አጠቃላይ ቀሪ ዕዳ:' : 'Customer Outstanding Debt:'}
            </span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {formatCurrency(customerBalance.outstandingBalance)}
            </span>
          </div>

          {/* Select Specific Order to Settle */}
          {customerOrdersWithDebt.length > 0 && (
            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'ክፍያው የሚተገበርበት ትዕዛዝ' : 'Target Order to Settle'}
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 font-mono"
              >
                {customerOrdersWithDebt.map((item) => (
                  <option key={item.order.id} value={item.order.id}>
                    {item.order.orderNumber} ({new Date(item.order.orderDate).toLocaleDateString()}) — Due: {formatCurrency(item.outstanding)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount Paid */}
          <div>
            <label className="block text-stone-300 font-semibold mb-1">
              {language === 'am' ? 'የተከፈለው ገንዘብ መጠን (ETB)' : 'Payment Amount (ETB)'} *
            </label>
            <input
              type="number"
              min="1"
              required
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="e.g. 5000"
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 font-mono text-base font-bold text-emerald-400"
            />
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'የክፍያ ዘዴ' : 'Payment Method'}
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
                {t.transactionReference}
              </label>
              <input
                type="text"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder={paymentMethod === 'CASH' ? 'Voucher # (optional)' : 'e.g. TB991209384'}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 font-mono"
              />
            </div>
          </div>

          {/* Verification Check for Telebirr / Bank */}
          {paymentMethod !== 'CASH' && (
            <div className="bg-stone-850 p-3 rounded-lg border border-stone-800 flex items-center gap-2.5">
              <input
                type="checkbox"
                id="verifyCheckbox"
                checked={markVerified}
                onChange={(e) => setMarkVerified(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 bg-stone-800 border-stone-700 cursor-pointer"
              />
              <label htmlFor="verifyCheckbox" className="text-stone-300 cursor-pointer">
                {language === 'am'
                  ? 'የኤስኤምኤስ (SMS) ዝውውሩን በዳቦ ቤቱ ስልክ አረጋግጫለሁ (Verify Now)'
                  : 'I have verified the SMS notification on bakery phone (Verify immediately)'}
              </label>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-stone-300 font-semibold mb-1">
              {t.notes}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Handed to delivery driver Kebede, etc."
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
              disabled={amount <= 0}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold"
            >
              {language === 'am' ? 'ክፍያውን መዝግብ' : 'Save Payment'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
