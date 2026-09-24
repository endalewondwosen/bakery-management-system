/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import {
  X,
  Building,
  Phone,
  MapPin,
  Clock,
  ShoppingBag,
  CreditCard,
  FileText,
  MessageSquareWarning,
  DollarSign,
  Plus,
  Repeat,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface Customer360ModalProps {
  customerId: string | null;
  onClose: () => void;
  onTakeOrder: (customerId: string) => void;
  onRecordPayment: (customerId: string) => void;
  onSelectOrder: (orderId: string) => void;
}

type Tab = 'overview' | 'orders' | 'statement' | 'pricing' | 'complaints';

export const Customer360Modal: React.FC<Customer360ModalProps> = ({
  customerId,
  onClose,
  onTakeOrder,
  onRecordPayment,
  onSelectOrder,
}) => {
  const { t, formatCurrency, language } = useLanguage();
  const {
    customers,
    orders,
    payments,
    complaints,
    products,
    pricingAgreements,
    getCustomerBalance,
    getCustomerStatement,
    setCustomerPricingAgreement,
    repeatOrder,
    getOrderItems,
  } = useBakeryStore();

  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // New pricing agreement state
  const [editingProductId, setEditingProductId] = useState<string>('');
  const [newAgreedPrice, setNewAgreedPrice] = useState<number>(0);
  const [pricingNotes, setPricingNotes] = useState<string>('');

  if (!customerId) return null;

  const customer = customers.find((c) => c.id === customerId);
  if (!customer) return null;

  const { totalInvoiced, totalPaid, outstandingBalance } = getCustomerBalance(customer.id);
  const customerOrders = orders.filter((o) => o.customerId === customer.id);
  const customerPayments = payments.filter((p) => p.customerId === customer.id);
  const customerComplaints = complaints.filter((c) => c.customerId === customer.id);
  const statement = getCustomerStatement(customer.id);

  const customerAgreements = pricingAgreements.filter((pa) => pa.customerId === customer.id);

  const handleSavePriceAgreement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductId || newAgreedPrice <= 0) return;
    setCustomerPricingAgreement(customer.id, editingProductId, newAgreedPrice, pricingNotes);
    setEditingProductId('');
    setNewAgreedPrice(0);
    setPricingNotes('');
  };

  const handleRepeatOrder = (orderId: string) => {
    const newOrd = repeatOrder(orderId);
    alert(
      language === 'am'
        ? `አዲስ ትዕዛዝ ቁጥር ${newOrd.orderNumber} ተመዝግቧል!`
        : `Repeat order ${newOrd.orderNumber} recorded!`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-stone-100">
                  {customer.organizationName}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-medium">
                  {customer.customerType}
                </span>
                {customer.branch && (
                  <span className="text-xs text-amber-400 font-medium">
                    · {customer.branch}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400">
                {customer.name} · {customer.phone} · {customer.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onTakeOrder(customer.id)}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow transition cursor-pointer"
            >
              {t.newOrder}
            </button>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-100 p-1 rounded-lg hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Financial KPI bar */}
        <div className="grid grid-cols-3 border-b border-stone-800 bg-stone-850/60 divide-x divide-stone-800 text-xs shrink-0">
          <div className="p-3 text-center">
            <div className="text-stone-400 text-[11px]">{language === 'am' ? 'ጠቅላላ የተገዛ' : 'Total Invoiced'}</div>
            <div className="text-sm font-bold text-stone-100 font-mono mt-0.5">
              {formatCurrency(totalInvoiced)}
            </div>
          </div>
          <div className="p-3 text-center">
            <div className="text-stone-400 text-[11px]">{language === 'am' ? 'የተከፈለ' : 'Total Paid'}</div>
            <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
              {formatCurrency(totalPaid)}
            </div>
          </div>
          <div className="p-3 text-center">
            <div className="text-stone-400 text-[11px]">{t.outstandingAmount}</div>
            <div className="text-sm font-bold text-amber-400 font-mono mt-0.5 flex items-center justify-center gap-1.5">
              <span>{formatCurrency(outstandingBalance)}</span>
              {outstandingBalance > 0 && (
                <button
                  onClick={() => onRecordPayment(customer.id)}
                  className="px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-400 border border-emerald-700/60 text-[10px] font-semibold hover:bg-emerald-600/50"
                >
                  {language === 'am' ? 'ክፈል' : 'Pay'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-800 bg-stone-900 px-4 text-xs font-medium space-x-1 shrink-0 overflow-x-auto">
          {[
            { id: 'overview', label: language === 'am' ? 'አጠቃላይ መረጃ' : 'Overview & Preferences', icon: Building },
            { id: 'orders', label: `${t.navOrders} (${customerOrders.length})`, icon: ShoppingBag },
            { id: 'statement', label: language === 'am' ? 'የሂሳብ መግለጫ / ሌጀር' : 'Statement / Debt Ledger', icon: FileText },
            { id: 'pricing', label: `${language === 'am' ? 'የስምምነት ዋጋዎች' : 'Agreed Pricing'} (${customerAgreements.length})`, icon: DollarSign },
            { id: 'complaints', label: `${t.navComplaints} (${customerComplaints.length})`, icon: MessageSquareWarning },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition ${
                  isActive
                    ? 'border-amber-500 text-amber-400 font-semibold'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* TAB 1: OVERVIEW & PREFERENCES */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Contact & Location Details */}
                <div className="bg-stone-850 border border-stone-800 rounded-xl p-4 space-y-2.5">
                  <h3 className="font-semibold text-stone-200 text-xs flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-amber-500" />
                    <span>{language === 'am' ? 'የድርጅት ዝርዝር መረጃ' : 'Organization & Location'}</span>
                  </h3>
                  
                  <div className="space-y-1.5 text-stone-300">
                    <div className="flex justify-between">
                      <span className="text-stone-500">{language === 'am' ? 'የንግድ ዓይነት:' : 'Business Type:'}</span>
                      <span>{customer.customerType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">{language === 'am' ? 'ቅርንጫፍ:' : 'Branch:'}</span>
                      <span>{customer.branch || 'Main'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">{language === 'am' ? 'አድራሻ:' : 'Address:'}</span>
                      <span>{customer.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">{language === 'am' ? 'ተጠሪ ሰው:' : 'Contact Person:'}</span>
                      <span>{customer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">{language === 'am' ? 'ዋና ስልክ:' : 'Primary Phone:'}</span>
                      <span className="font-mono">{customer.phone}</span>
                    </div>
                    {customer.managerPhone && (
                      <div className="flex justify-between">
                        <span className="text-stone-500">{language === 'am' ? 'የስራ አስኪያጅ ስልክ:' : 'Manager Phone:'}</span>
                        <span className="font-mono">{customer.managerPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery & Regular Order Preferences */}
                <div className="bg-stone-850 border border-stone-800 rounded-xl p-4 space-y-2.5">
                  <h3 className="font-semibold text-stone-200 text-xs flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>{language === 'am' ? 'የማድረሻ እና መደበኛ ፍላጎቶች' : 'Delivery Preferences'}</span>
                  </h3>

                  <div className="space-y-1.5 text-stone-300">
                    <div className="flex justify-between">
                      <span className="text-stone-500">{language === 'am' ? 'የተለመደ የማድረሻ ሰዓት:' : 'Preferred Delivery Time:'}</span>
                      <span>{customer.preferredDeliveryTime || 'Not specified'}</span>
                    </div>
                    {customer.notes && (
                      <div>
                        <span className="text-stone-500 block">{language === 'am' ? 'ልዩ ማስታወሻ:' : 'Notes:'}</span>
                        <p className="text-stone-300 mt-0.5 bg-stone-800 p-2 rounded">{customer.notes}</p>
                      </div>
                    )}
                  </div>

                  {customer.regularPreferences && customer.regularPreferences.length > 0 && (
                    <div className="pt-2 border-t border-stone-800">
                      <span className="text-stone-400 block mb-1.5 font-medium">
                        {language === 'am' ? 'መደበኛ የሚታዘዙ ዳቦዎች (Preferences):' : 'Regular Bread Preferences:'}
                      </span>
                      <div className="space-y-1">
                        {customer.regularPreferences.map((pref) => {
                          const prod = products.find((p) => p.id === pref.productId);
                          return (
                            <div key={pref.productId} className="flex justify-between text-stone-300 bg-stone-800/60 px-2 py-1 rounded">
                              <span>{prod ? (language === 'am' ? prod.nameAm : prod.nameEn) : pref.productId}</span>
                              <span className="font-mono font-bold text-amber-400">{pref.regularQuantity} pcs</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: ORDERS HISTORY */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              {customerOrders.length === 0 ? (
                <div className="py-8 text-center text-stone-500">
                  {language === 'am' ? 'ምንም ትዕዛዝ አልተገኘም' : 'No orders recorded yet'}
                </div>
              ) : (
                customerOrders.map((ord) => {
                  const items = getOrderItems(ord.id);
                  return (
                    <div
                      key={ord.id}
                      className="bg-stone-850 border border-stone-800 rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-stone-700 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">{ord.orderNumber}</span>
                          <span className="text-stone-400">·</span>
                          <span className="text-stone-300">{new Date(ord.orderDate).toLocaleDateString()}</span>
                          <span className="text-stone-400">·</span>
                          <span className="font-medium text-stone-300">{ord.status}</span>
                        </div>
                        <div className="text-stone-400 mt-1 flex flex-wrap gap-1.5 text-[11px]">
                          {items.map((it) => (
                            <span key={it.id} className="bg-stone-800 px-1.5 py-0.5 rounded">
                              {it.quantity} × {language === 'am' ? it.productNameAm : it.productNameEn}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="font-mono font-bold text-stone-100">{formatCurrency(ord.totalAmount)}</div>
                        </div>
                        <button
                          onClick={() => handleRepeatOrder(ord.id)}
                          title={t.repeatOrder}
                          className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-400 transition"
                        >
                          <Repeat className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            onClose();
                            onSelectOrder(ord.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300"
                        >
                          {t.view}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: CUSTOMER STATEMENT / DEBT LEDGER (Section 19 in Requirements) */}
          {activeTab === 'statement' && (
            <div className="space-y-3">
              <div className="bg-stone-850/60 p-3 rounded-xl border border-stone-800 text-stone-400 text-xs">
                {language === 'am'
                  ? 'የደንበኛው የትዕዛዞች (ዕዳ) እና የተከፈሉ ክፍያዎች (ክሬዲት) የጊዜ ቅደም ተከተል መዝገብ'
                  : 'Chronological statement of debits (orders) and credits (verified payments) with running balance.'}
              </div>

              <div className="border border-stone-800 rounded-xl overflow-hidden bg-stone-850/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-800/80 text-stone-400 text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Ref / Transaction</th>
                      <th className="py-2.5 px-3 text-right">Debit (Order)</th>
                      <th className="py-2.5 px-3 text-right">Credit (Payment)</th>
                      <th className="py-2.5 px-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800 text-stone-300">
                    {statement.map((row, idx) => (
                      <tr key={idx} className="hover:bg-stone-800/30">
                        <td className="py-2 px-3 text-stone-400">
                          {new Date(row.date).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-mono text-stone-200 font-medium">{row.referenceId}</span>
                          <span className="text-stone-500 text-[11px] block">{row.description}</span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-amber-400">
                          {row.debit > 0 ? formatCurrency(row.debit) : '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-400">
                          {row.credit > 0 ? formatCurrency(row.credit) : '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-stone-100">
                          {formatCurrency(row.runningBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: AGREED PRICING (Section 54.3 & 54.4 in Requirements) */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="bg-amber-950/30 border border-amber-800/60 p-3 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  {language === 'am'
                    ? 'ከዚህ ደንበኛ ጋር የተደረገ የዋጋ ስምምነት ካለ፣ ለዚህ ደንበኛ በሚወሰዱ አዳዲስ ትዕዛዞች ላይ ይህ ዋጋ በቀጥታ ይሰራል፤ የቀድሞ ትዕዛዞች ግን አይቀየሩም።'
                    : 'Customer-specific agreed prices automatically apply to future orders for this customer without altering historical orders.'}
                </span>
              </div>

              {/* Set new / update agreement form */}
              <form onSubmit={handleSavePriceAgreement} className="bg-stone-850 border border-stone-800 rounded-xl p-3.5 space-y-3">
                <div className="font-semibold text-stone-200 text-xs">
                  {language === 'am' ? 'አዲስ የስምምነት ዋጋ መዝግብ' : 'Add / Update Agreed Price Contract'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-stone-400 mb-1 text-[11px]">{language === 'am' ? 'ምርት' : 'Product'}</label>
                    <select
                      value={editingProductId}
                      onChange={(e) => setEditingProductId(e.target.value)}
                      required
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100"
                    >
                      <option value="">{language === 'am' ? 'ምርት ይምረጡ...' : 'Select product...'}</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {language === 'am' ? p.nameAm : p.nameEn} (Base: {p.basePrice} ETB)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 text-[11px]">{language === 'am' ? 'የስምምነት ዋጋ (ETB)' : 'Agreed Price (ETB)'}</label>
                    <input
                      type="number"
                      step="0.5"
                      value={newAgreedPrice || ''}
                      onChange={(e) => setNewAgreedPrice(Number(e.target.value))}
                      placeholder="e.g. 22"
                      required
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 text-[11px]">{language === 'am' ? 'የስምምነት ማስታወሻ' : 'Contract Notes'}</label>
                    <input
                      type="text"
                      value={pricingNotes}
                      onChange={(e) => setPricingNotes(e.target.value)}
                      placeholder="e.g. 100+ daily volume discount"
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100"
                    />
                  </div>
                </div>

                <div className="text-right">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs"
                  >
                    {language === 'am' ? 'ስምምነቱን አስቀምጥ' : 'Save Pricing Agreement'}
                  </button>
                </div>
              </form>

              {/* Existing active agreements list */}
              <div className="space-y-2">
                <div className="font-semibold text-stone-300 text-xs">
                  {language === 'am' ? 'አሁን ያሉ የስምምነት ዋጋዎች' : 'Active Negotiated Rates'}
                </div>
                {customerAgreements.length === 0 ? (
                  <div className="p-4 text-center text-stone-500 border border-dashed border-stone-800 rounded-xl">
                    {language === 'am' ? 'ምንም የተለየ የስምምነት ዋጋ የለም (መደበኛ ዋጋ ተፈጻሚ ነው)' : 'No custom pricing agreements (standard base prices apply)'}
                  </div>
                ) : (
                  customerAgreements.map((ag) => {
                    const prod = products.find((p) => p.id === ag.productId);
                    return (
                      <div key={ag.id} className="p-3 rounded-lg bg-stone-850 border border-stone-800 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-stone-200">
                            {prod ? (language === 'am' ? prod.nameAm : prod.nameEn) : ag.productId}
                          </div>
                          <div className="text-stone-400 text-[11px] mt-0.5">
                            {language === 'am' ? 'መደበኛ ዋጋ:' : 'Base Price:'} {prod ? formatCurrency(prod.basePrice) : '—'} · {ag.notes || 'Contract active'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-amber-400 font-mono">
                            {formatCurrency(ag.agreedPrice)}
                          </div>
                          <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800/60">
                            Active
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 5: COMPLAINTS */}
          {activeTab === 'complaints' && (
            <div className="space-y-3">
              {customerComplaints.length === 0 ? (
                <div className="py-8 text-center text-stone-500">
                  <CheckCircle className="w-6 h-6 mx-auto text-emerald-500/40 mb-1" />
                  {language === 'am' ? 'ከዚህ ደንበኛ የተመዘገበ ምንም አይነት ቅሬታ የለም' : 'No recorded complaints from this customer'}
                </div>
              ) : (
                customerComplaints.map((comp) => (
                  <div key={comp.id} className="bg-stone-850 border border-stone-800 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400">{comp.complaintNumber}</span>
                        <span className="text-stone-300 font-medium">{comp.category}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        comp.status === 'RESOLVED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                      }`}>
                        {comp.status}
                      </span>
                    </div>

                    <p className="text-stone-300 text-xs">{comp.description}</p>

                    {comp.resolutionType && (
                      <div className="bg-stone-800 p-2 rounded text-[11px] text-stone-400 mt-1">
                        <span className="text-emerald-400 font-semibold">{comp.resolutionType}: </span>
                        <span>{comp.resolutionNotes}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-850 flex items-center justify-end shrink-0">
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
