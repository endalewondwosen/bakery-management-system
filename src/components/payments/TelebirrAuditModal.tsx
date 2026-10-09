/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ethiopian Telebirr SMS Audit & Instant Reconciliation Tool
 * Parses SMS notifications, verifies transaction codes against duplicate frauds,
 * matches sender phones against customer accounts, and settles pending balances in 1-click.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import { paymentApi } from '../../services/apiClient.ts';
import { useToast } from '../common/ToastContext.tsx';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Receipt,
  User,
  ShoppingBag,
  Sparkles,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import type { ParsedTelebirrResultDto } from '../../types/apiContracts.ts';

interface TelebirrAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer?: (customerId: string) => void;
}

export const TelebirrAuditModal: React.FC<TelebirrAuditModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
}) => {
  const { language, formatCurrency } = useLanguage();
  const { showSuccess, showError, showWarning } = useToast();
  const {
    customers,
    orders,
    payments,
    verifyPayment,
    recordPayment,
    getOrderOutstandingAmount,
    getCustomerBalance,
  } = useBakeryStore();

  const [smsInput, setSmsInput] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<ParsedTelebirrResultDto | null>(null);

  // Duplicate reference check state
  const [duplicateMatch, setDuplicateMatch] = useState<{
    id: string;
    receiptNumber: string;
    customerName: string;
    amount: number;
    paymentDate: string;
  } | null>(null);

  // Selected matched customer & order
  const [matchedCustomerId, setMatchedCustomerId] = useState<string>('');
  const [matchedOrderId, setMatchedOrderId] = useState<string>('');

  // Sample SMS templates for quick testing / demonstration
  const sampleMessages = [
    {
      label: 'Sample 1: Addis Hilton (TB9871)',
      text: 'You have received ETB 4,500.00 from 0911234567 (Addis Hilton Cafe). Transaction number: TB2603248812 on 2026-03-24 07:30.',
    },
    {
      label: 'Sample 2: Bole Grocery (TB4431)',
      text: 'ከ 0922345678 (Bole Grocery) 1,800.00 ብር ደርሶዎታል:: የግብይት ቁጥር: TB2603244431 ቀን: 2026-03-24.',
    },
  ];

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSmsInput('');
      setParsedData(null);
      setDuplicateMatch(null);
      setMatchedCustomerId('');
      setMatchedOrderId('');
    }
  }, [isOpen]);

  // Client-side fallback regex parser if backend is offline
  const fallbackParse = (text: string): ParsedTelebirrResultDto => {
    const clean = text.trim();
    const amountMatch =
      clean.match(/(?:ETB|birr|ብር)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i) ||
      clean.match(/([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:ETB|birr|ብር)/i);

    const refMatch =
      clean.match(/(?:transaction\s*(?:number|id|no\.?)|የግብይት\s*ቁጥር)\s*[:\-]?\s*([A-Za-z0-9]+)/i) ||
      clean.match(/\b(TB[0-9A-Za-z]+)\b/i);

    const phoneMatch = clean.match(/\b(09[0-9]{8}|07[0-9]{8}|\+2519[0-9]{8}|\+2517[0-9]{8})\b/);
    const nameMatch = clean.match(/\(([^)]+)\)/);

    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : undefined;
    const transactionReference = refMatch ? refMatch[1].trim() : undefined;
    const customerPhone = phoneMatch ? phoneMatch[1] : undefined;
    const payerName = nameMatch ? nameMatch[1].trim() : undefined;

    return {
      isValidTelebirrSms: Boolean(amount || transactionReference),
      amount,
      transactionReference,
      customerPhone,
      payerName,
    };
  };

  // Run parser whenever smsInput changes
  const handleParse = async (text: string) => {
    setSmsInput(text);
    if (!text.trim()) {
      setParsedData(null);
      setDuplicateMatch(null);
      return;
    }

    try {
      setIsParsing(true);
      let parsed: ParsedTelebirrResultDto;
      try {
        parsed = await paymentApi.parseTelebirrSms(text);
      } catch {
        parsed = fallbackParse(text);
      }

      setParsedData(parsed);

      if (parsed.transactionReference) {
        // Check local store first
        const localDup = payments.find(
          (p) =>
            p.transactionReference &&
            p.transactionReference.trim().toLowerCase() === parsed.transactionReference!.trim().toLowerCase()
        );

        if (localDup) {
          setDuplicateMatch({
            id: localDup.id,
            receiptNumber: localDup.receiptNumber,
            customerName: localDup.customerName,
            amount: localDup.amount,
            paymentDate: localDup.paymentDate,
          });
        } else {
          // Check backend
          try {
            const check = await paymentApi.checkDuplicateReference(parsed.transactionReference);
            if (check.isDuplicate && check.existingPayment) {
              setDuplicateMatch(check.existingPayment);
            } else {
              setDuplicateMatch(null);
            }
          } catch {
            setDuplicateMatch(null);
          }
        }
      } else {
        setDuplicateMatch(null);
      }

      // Auto-match customer by phone
      if (parsed.customerPhone) {
        const cleanPhone = parsed.customerPhone.replace(/^\+251/, '0');
        const cust = customers.find((c) => c.phone.replace(/^\+251/, '0').includes(cleanPhone));
        if (cust) {
          setMatchedCustomerId(cust.id);
        }
      }
    } finally {
      setIsParsing(false);
    }
  };

  // Find if there is an existing PENDING payment that matches this transaction
  const pendingPaymentMatch = useMemo(() => {
    if (!parsedData || !parsedData.transactionReference) return null;
    return payments.find(
      (p) =>
        p.verificationStatus === 'PENDING_VERIFICATION' &&
        p.transactionReference &&
        p.transactionReference.trim().toLowerCase() === parsedData.transactionReference!.trim().toLowerCase()
    );
  }, [parsedData, payments]);

  // Open orders for matched customer
  const matchedCustomerOrders = useMemo(() => {
    if (!matchedCustomerId) return [];
    return orders
      .filter((o) => o.customerId === matchedCustomerId && o.status !== 'CANCELLED')
      .map((o) => ({
        order: o,
        outstanding: getOrderOutstandingAmount(o.id),
      }))
      .filter((item) => item.outstanding > 0);
  }, [matchedCustomerId, orders, getOrderOutstandingAmount]);

  // If customer has orders, default to the one matching amount or first one
  useEffect(() => {
    if (matchedCustomerOrders.length > 0) {
      if (parsedData?.amount) {
        const exact = matchedCustomerOrders.find((it) => Math.abs(it.outstanding - parsedData.amount!) < 1);
        if (exact) {
          setMatchedOrderId(exact.order.id);
          return;
        }
      }
      setMatchedOrderId(matchedCustomerOrders[0].order.id);
    } else {
      setMatchedOrderId('');
    }
  }, [matchedCustomerOrders, parsedData]);

  if (!isOpen) return null;

  // Action: Verify existing pending payment
  const handleVerifyPending = () => {
    if (!pendingPaymentMatch) return;
    verifyPayment(pendingPaymentMatch.id, 'Telebirr SMS Audit');
    showSuccess(
      language === 'am' ? 'ክፍያ ተረጋገጠ!' : 'Pending Payment Verified!',
      language === 'am'
        ? `ደረሰኝ ${pendingPaymentMatch.receiptNumber} (${formatCurrency(pendingPaymentMatch.amount)}) ተረጋግጧል`
        : `Payment ${pendingPaymentMatch.receiptNumber} (${formatCurrency(pendingPaymentMatch.amount)}) marked as verified`
    );
    onClose();
  };

  // Action: Record fresh verified payment from SMS
  const handleRecordVerifiedPayment = () => {
    if (!parsedData || !parsedData.amount) {
      showError('Error', language === 'am' ? 'ልክ የሆነ የክፍያ መጠን አልተገኘም' : 'No valid amount found');
      return;
    }

    if (duplicateMatch && (!pendingPaymentMatch || pendingPaymentMatch.id !== duplicateMatch.id)) {
      showError(
        language === 'am' ? 'የተደገመ ኮድ!' : 'Duplicate Code!',
        language === 'am'
          ? `ይህ ኮድ አስቀድሞ በደረሰኝ #${duplicateMatch.receiptNumber} ተመዝግቧል!`
          : `This code was already used in receipt #${duplicateMatch.receiptNumber}!`
      );
      return;
    }

    if (!matchedCustomerId) {
      showError(
        language === 'am' ? 'ደንበኛ ይምረጡ' : 'Select Customer',
        language === 'am' ? 'እባክዎ ክፍያው የሚመዘገብለትን ደንበኛ ይምረጡ' : 'Please select the target customer'
      );
      return;
    }

    const customer = customers.find((c) => c.id === matchedCustomerId);
    const targetOrderId = matchedOrderId || (matchedCustomerOrders[0]?.order.id || 'general-debt-allocation');

    const newPay = recordPayment({
      orderId: targetOrderId,
      customerId: matchedCustomerId,
      amount: parsedData.amount,
      paymentMethod: 'TELEBIRR',
      transactionReference: parsedData.transactionReference,
      notes: `SMS Audited from ${parsedData.payerName || customer?.name || 'Customer'} (${parsedData.customerPhone || ''})`,
      isVerified: true,
      recordedBy: 'Telebirr SMS Audit',
    });

    showSuccess(
      language === 'am' ? 'ክፍያ ተረጋግጦ ተመዘገበ!' : 'Payment Verified & Logged!',
      language === 'am'
        ? `ደረሰኝ ${newPay.receiptNumber} (${formatCurrency(parsedData.amount)}) ለ${customer?.organizationName} ተመዝግቧል`
        : `Logged verified payment ${newPay.receiptNumber} (${formatCurrency(parsedData.amount)}) for ${customer?.organizationName}`
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-xs">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-850 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100 flex items-center gap-2">
                <span>{language === 'am' ? 'የቴሌብር SMS ማረጋገጫና ኦዲት' : 'Telebirr SMS Audit & Reconciler'}</span>
              </h2>
              <p className="text-stone-400 text-[11px]">
                {language === 'am'
                  ? 'የገቢ መልእክት ጽሑፍ በመለጠፍ የኮድ ድግግሞሽ እና ትክክለኛነት በቅጽበት ያረጋግጡ'
                  : 'Paste customer Telebirr SMS to detect fraud duplicates, match accounts, and verify instantly'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-1 rounded-lg hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Quick Sample Selector */}
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="text-stone-400">
              {language === 'am' ? 'የሙከራ ምሳሌ ይሞክሩ:' : 'Quick Test Samples:'}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {sampleMessages.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleParse(sample.text)}
                  className="px-2 py-0.5 rounded-md bg-stone-800 hover:bg-stone-750 text-amber-400 border border-stone-700 transition cursor-pointer"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* SMS Textarea Input */}
          <div>
            <label className="block text-stone-300 font-semibold mb-1">
              {language === 'am' ? 'የቴሌብር መልእክት እዚህ ይለጥፉ (Paste SMS):' : 'Paste Customer Telebirr SMS Message:'}
            </label>
            <textarea
              rows={3}
              value={smsInput}
              onChange={(e) => handleParse(e.target.value)}
              placeholder="e.g. You have received ETB 2,500.00 from 0911223344 (Abebe). Transaction number: TB2603248812 on 2026-03-24..."
              className="w-full bg-stone-800 border border-stone-700 rounded-xl p-3 text-stone-100 placeholder-stone-500 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
            />
          </div>

          {/* Real-time Parsed Details Card */}
          {parsedData && (
            <div className="p-4 rounded-xl bg-stone-850 border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {language === 'am' ? 'ከመልእክቱ የተገኙ ዝርዝሮች' : 'Extracted SMS Parameters'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  parsedData.isValidTelebirrSms
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-stone-800 text-stone-400'
                }`}>
                  {parsedData.isValidTelebirrSms ? 'Valid Telebirr' : 'Unrecognized Format'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-stone-900 rounded-lg border border-stone-800">
                  <span className="text-stone-400 text-[10px] block">Extracted Amount:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {parsedData.amount ? formatCurrency(parsedData.amount) : 'Not found'}
                  </span>
                </div>

                <div className="p-2 bg-stone-900 rounded-lg border border-stone-800">
                  <span className="text-stone-400 text-[10px] block">Txn Reference:</span>
                  <span className="font-mono font-bold text-stone-200">
                    {parsedData.transactionReference || 'Not found'}
                  </span>
                </div>

                <div className="p-2 bg-stone-900 rounded-lg border border-stone-800">
                  <span className="text-stone-400 text-[10px] block">Sender Phone:</span>
                  <span className="font-mono text-stone-300">
                    {parsedData.customerPhone || 'Not found'}
                  </span>
                </div>

                <div className="p-2 bg-stone-900 rounded-lg border border-stone-800">
                  <span className="text-stone-400 text-[10px] block">Sender Name:</span>
                  <span className="text-stone-300 truncate block">
                    {parsedData.payerName || 'Not found'}
                  </span>
                </div>
              </div>

              {/* Fraud Duplicate Detection Alert */}
              {duplicateMatch && (
                <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-200 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-rose-300">
                      {language === 'am' ? 'ማስጠንቀቂያ፡ የተደገመ የክፍያ ኮድ!' : 'FRAUD WARNING: Duplicate Transaction Reference!'}
                    </h4>
                    <p className="text-[11px] text-rose-200/90 mt-0.5 leading-snug">
                      {language === 'am'
                        ? `ይህ ኮድ አስቀድሞ በ${new Date(duplicateMatch.paymentDate).toLocaleDateString()} ለ${duplicateMatch.customerName} በደረሰኝ #${duplicateMatch.receiptNumber} (${formatCurrency(duplicateMatch.amount)}) ተመዝግቧል!`
                        : `This transaction reference code was already recorded on ${new Date(duplicateMatch.paymentDate).toLocaleDateString()} for ${duplicateMatch.customerName} in Receipt #${duplicateMatch.receiptNumber} (${formatCurrency(duplicateMatch.amount)})!`}
                    </p>
                  </div>
                </div>
              )}

              {/* Pending Payment Match Alert */}
              {pendingPaymentMatch && (
                <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-800/80 text-emerald-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-bold text-xs">
                        {language === 'am' ? 'ተዛማጅ ማረጋገጫ የሚጠብቅ ክፍያ ተገኝቷል!' : 'Matching Pending Payment Found!'}
                      </p>
                      <p className="text-[11px] text-emerald-300">
                        Receipt #{pendingPaymentMatch.receiptNumber} — {pendingPaymentMatch.customerName} ({formatCurrency(pendingPaymentMatch.amount)})
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleVerifyPending}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs transition cursor-pointer shrink-0 shadow-sm"
                  >
                    {language === 'am' ? 'አሁን አረጋግጥ' : 'Verify Now'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Customer & Order Matching Section */}
          <div className="p-4 rounded-xl bg-stone-850 border border-stone-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'am' ? 'ክፍያው የሚመዘገብለት ደንበኛ' : 'Target Customer & Order Allocation'}</span>
            </h4>

            <div>
              <label className="block text-stone-400 text-[11px] mb-1">
                {language === 'am' ? 'ደንበኛ ይምረጡ:' : 'Select Customer:'}
              </label>
              <select
                value={matchedCustomerId}
                onChange={(e) => setMatchedCustomerId(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 text-xs focus:outline-none"
              >
                <option value="">{language === 'am' ? '-- ደንበኛ ይምረጡ --' : '-- Select Customer --'}</option>
                {customers.map((c) => {
                  const bal = getCustomerBalance(c.id);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.organizationName} ({c.name}) — {c.phone} [Debt: {bal.outstandingBalance.toLocaleString()} ETB]
                    </option>
                  );
                })}
              </select>
            </div>

            {matchedCustomerId && (
              <div className="space-y-2 pt-1 border-t border-stone-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">Total Customer Debt:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {formatCurrency(getCustomerBalance(matchedCustomerId).outstandingBalance)}
                  </span>
                </div>

                {matchedCustomerOrders.length > 0 && (
                  <div>
                    <label className="block text-stone-400 text-[11px] mb-1">
                      {language === 'am' ? 'ክፍያው የሚዘጋለት ትዕዛዝ:' : 'Apply to Unpaid Order:'}
                    </label>
                    <select
                      value={matchedOrderId}
                      onChange={(e) => setMatchedOrderId(e.target.value)}
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-stone-100 text-xs focus:outline-none"
                    >
                      {matchedCustomerOrders.map(({ order, outstanding }) => (
                        <option key={order.id} value={order.id}>
                          Order #{order.orderNumber} ({new Date(order.orderDate).toLocaleDateString()}) — Unpaid: {outstanding.toLocaleString()} ETB
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-stone-800 flex items-center justify-between bg-stone-850 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-semibold transition cursor-pointer"
          >
            {language === 'am' ? 'ሰርዝ' : 'Cancel'}
          </button>

          <div className="flex items-center gap-2">
            {pendingPaymentMatch ? (
              <button
                onClick={handleVerifyPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{language === 'am' ? 'ክፍያውን አረጋግጥ' : 'Verify Pending Payment'}</span>
              </button>
            ) : (
              <button
                disabled={!parsedData?.amount || !matchedCustomerId || Boolean(duplicateMatch)}
                onClick={handleRecordVerifiedPayment}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{language === 'am' ? 'ተረጋግጦ ይመዝገብ' : 'Record as Verified Payment'}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
