/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Wallet,
  Building,
  Clock
} from 'lucide-react';
import { PaymentMethod, VerificationStatus } from '../../types/domain.ts';
import { useToast } from '../common/ToastContext.tsx';

interface PaymentsViewProps {
  onOpenRecordPayment: () => void;
  onSelectCustomer: (customerId: string) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  onOpenRecordPayment,
  onSelectCustomer,
}) => {
  const { t, formatCurrency, language } = useLanguage();
  const { showSuccess, showWarning } = useToast();
  const { payments, verifyPayment, rejectPayment } = useBakeryStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const pendingPayments = useMemo(() => {
    return payments.filter((p) => p.verificationStatus === 'PENDING_VERIFICATION');
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm.trim() ||
        p.receiptNumber.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        (p.transactionReference && p.transactionReference.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (methodFilter !== 'ALL' && p.paymentMethod !== methodFilter) return false;
      if (statusFilter !== 'ALL' && p.verificationStatus !== statusFilter) return false;

      return true;
    });
  }, [payments, searchTerm, methodFilter, statusFilter]);

  const verifiedTotal = useMemo(() => {
    return filteredPayments
      .filter((p) => p.verificationStatus === 'VERIFIED')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [filteredPayments]);

  return (
    <div className="space-y-5">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-500" />
            <span>{t.navPayments}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 font-mono">
              {filteredPayments.length}
            </span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            {language === 'am'
              ? 'የጥሬ ገንዘብ፣ የቴሌብር እና የባንክ ዝውውሮች ማረጋገጫ እና ታሪክ'
              : 'Cash, Telebirr & bank transfer reconciliation and verification ledger'}
          </p>
        </div>

        <button
          onClick={onOpenRecordPayment}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow transition shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.recordPayment}</span>
        </button>
      </div>

      {/* Pending Verification Notice Card (Section 16 & 17) */}
      {pendingPayments.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              {language === 'am'
                ? `ማረጋገጫ የሚጠብቁ ${pendingPayments.length} የቴሌብር / ባንክ ዝውውሮች (SMS Check Queue)`
                : `${pendingPayments.length} Payments Awaiting Verification (SMS Check Queue)`}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
            {pendingPayments.map((p) => (
              <div
                key={p.id}
                className="bg-stone-900/90 border border-amber-800/60 rounded-lg p-3 flex items-center justify-between gap-3 shadow-sm"
              >
                <div>
                  <div className="font-bold text-stone-200">{p.customerName}</div>
                  <div className="text-stone-400 flex items-center gap-2 mt-0.5 font-mono text-[11px]">
                    <span className="text-amber-400 font-bold">{formatCurrency(p.amount)}</span>
                    <span>·</span>
                    <span>{p.paymentMethod}</span>
                    {p.transactionReference && <span>· Txn: {p.transactionReference}</span>}
                  </div>
                  {p.notes && <div className="text-[10px] text-stone-500 italic mt-0.5">{p.notes}</div>}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      verifyPayment(p.id, 'Bakery Owner');
                      showSuccess(
                        language === 'am' ? 'ክፍያ ተረጋገጠ!' : 'Payment Verified!',
                        language === 'am'
                          ? `የ${formatCurrency(p.amount)} ክፍያ ተረጋግጦ ወደ ገቢ ገብቷል (${p.customerName})`
                          : `Payment of ${formatCurrency(p.amount)} for ${p.customerName} verified & confirmed`
                      );
                    }}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition cursor-pointer"
                  >
                    {t.verify}
                  </button>
                  <button
                    onClick={() => {
                      rejectPayment(p.id);
                      showWarning(
                        language === 'am' ? 'ክፍያ ውድቅ ተደረገ' : 'Payment Rejected',
                        language === 'am'
                          ? `የ${formatCurrency(p.amount)} ክፍያ ውድቅ ተደርጓል`
                          : `Payment of ${formatCurrency(p.amount)} rejected`
                      );
                    }}
                    className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition cursor-pointer"
                  >
                    {t.reject}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'am' ? 'ደረሰኝ ቁጥር፣ ደንበኛ ወይም SMS Txn ፈልግ...' : 'Search receipt #, customer, Txn reference...'}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none"
            >
              <option value="ALL">{language === 'am' ? 'ሁሉም የክፍያ ዘዴዎች' : 'All Payment Methods'}</option>
              <option value="CASH">{t.methodCash}</option>
              <option value="TELEBIRR">{t.methodTelebirr}</option>
              <option value="BANK_TRANSFER">{t.methodBankTransfer}</option>
              <option value="OTHER">{t.methodOther}</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none"
            >
              <option value="ALL">{language === 'am' ? 'ሁሉም የማረጋገጫ ሁኔታዎች' : 'All Verification States'}</option>
              <option value="VERIFIED">{t.verified}</option>
              <option value="PENDING_VERIFICATION">{t.pendingVerification}</option>
              <option value="REJECTED">{t.rejected}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-3 bg-stone-850/60 border-b border-stone-800 flex items-center justify-between text-xs">
          <span className="text-stone-400">
            {language === 'am' ? 'የተጣራ የተረጋገጠ ክፍያ ድምር:' : 'Filtered Verified Total:'}
          </span>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            {formatCurrency(verifiedTotal)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-800/80 text-stone-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Receipt #</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Txn Reference</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-500">
                    {language === 'am' ? 'ምንም ክፍያ አልተገኘም' : 'No payment records found'}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-800/30 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                      {p.receiptNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => onSelectCustomer(p.customerId)}
                        className="font-medium text-stone-200 hover:text-amber-400 text-left cursor-pointer"
                      >
                        {p.customerName}
                      </button>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-stone-300">{p.paymentMethod}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-stone-400">
                      {p.transactionReference || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        p.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                          : p.verificationStatus === 'PENDING_VERIFICATION'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800/80'
                          : 'bg-rose-950 text-rose-400 border border-rose-800/80'
                      }`}>
                        {p.verificationStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-stone-400 text-[11px]">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {p.verificationStatus === 'PENDING_VERIFICATION' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => verifyPayment(p.id, 'Bakery Owner')}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px]"
                          >
                            {t.verify}
                          </button>
                          <button
                            onClick={() => rejectPayment(p.id)}
                            className="px-2 py-1 rounded bg-stone-700 hover:bg-stone-600 text-stone-300 text-[10px]"
                          >
                            {t.reject}
                          </button>
                        </div>
                      ) : (
                        <span className="text-stone-500 text-[11px]">
                          {p.verifiedBy ? `By ${p.verifiedBy}` : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
