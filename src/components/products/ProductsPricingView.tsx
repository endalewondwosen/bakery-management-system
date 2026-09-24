/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import {
  Package,
  Plus,
  DollarSign,
  Building,
  CheckCircle,
  Tag,
  AlertTriangle
} from 'lucide-react';

export const ProductsPricingView: React.FC = () => {
  const { t, formatCurrency, language } = useLanguage();
  const {
    products,
    customers,
    pricingAgreements,
    setCustomerPricingAgreement,
  } = useBakeryStore();

  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [agreedPrice, setAgreedPrice] = useState<number>(20);
  const [notes, setNotes] = useState('');

  const handleSaveAgreement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedProductId || agreedPrice <= 0) return;

    setCustomerPricingAgreement(selectedCustomerId, selectedProductId, agreedPrice, notes);
    setNotes('');
    alert(language === 'am' ? 'የስምምነት ዋጋው በተሳካ ሁኔታ ተመዝግቧል!' : 'Pricing agreement successfully saved!');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
          <Package className="w-5 h-5 text-amber-500" />
          <span>{t.navProductsPricing}</span>
        </h2>
        <p className="text-xs text-stone-400 mt-0.5">
          {language === 'am'
            ? 'የዳቦ ዓይነቶች መደበኛ ዋጋ እና ለሆቴሎች/ካፌዎች የተሰጡ ልዩ የስምምነት ዋጋዎች (Section 54.3)'
            : 'Standard product catalog & customer negotiated contract pricing'}
        </p>
      </div>

      {/* Standard Product Catalog */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
          <Tag className="w-4 h-4 text-amber-500" />
          <span>{language === 'am' ? 'የዳቦ ዓይነቶች እና መደበኛ የመሸጫ ዋጋ' : 'Standard Bread Product Catalog'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-sm space-y-2 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-stone-100 text-sm">
                    {language === 'am' ? p.nameAm : p.nameEn}
                  </h4>
                  <div className="text-stone-400 text-[11px]">
                    {language === 'am' ? p.nameEn : p.nameAm}
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-medium">
                  {p.category}
                </span>
              </div>

              <p className="text-stone-400 text-[11px]">
                {language === 'am' ? p.descriptionAm : p.descriptionEn}
              </p>

              <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                <span className="text-stone-500">{t.basePrice}:</span>
                <span className="text-base font-bold font-mono text-amber-400">
                  {formatCurrency(p.basePrice)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer-Specific Pricing Agreements (Section 54.3 & 54.4) */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-500" />
              <span>{language === 'am' ? 'የተለዩ የደንበኞች የስምምነት ዋጋዎች (Customer-Specific Pricing)' : 'Customer-Specific Pricing Contracts'}</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              {language === 'am'
                ? 'አንዳንድ ደንበኞች በብዛት ስለሚገዙ የተስማሙበት ልዩ ዋጋ (ለምሳሌ 22 ብር በ 25 ብር ፈንታ)'
                : 'Negotiated wholesale contract pricing per client (e.g. 22 ETB instead of 25 ETB base price)'}
            </p>
          </div>
        </div>

        {/* Add/Edit Agreement Form */}
        <form onSubmit={handleSaveAgreement} className="bg-stone-850 p-4 rounded-xl border border-stone-800 space-y-3 text-xs">
          <div className="font-semibold text-stone-300">
            {language === 'am' ? 'አዲስ ወይም የተሻሻለ የስምምነት ዋጋ መዝግብ' : 'Assign or Update Negotiated Rate'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-stone-400 mb-1">{t.selectCustomer}</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.organizationName} {c.branch ? `(${c.branch})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-stone-400 mb-1">{language === 'am' ? 'ምርት' : 'Product'}</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {language === 'am' ? p.nameAm : p.nameEn} (Base: {p.basePrice})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-stone-400 mb-1">{language === 'am' ? 'የስምምነት ዋጋ (ETB)' : 'Agreed Price (ETB)'}</label>
              <input
                type="number"
                step="0.5"
                required
                value={agreedPrice}
                onChange={(e) => setAgreedPrice(Number(e.target.value))}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100 font-mono font-bold text-amber-400"
              />
            </div>

            <div>
              <label className="block text-stone-400 mb-1">{language === 'am' ? 'የስምምነት ማስታወሻ' : 'Notes / Volume'}</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 150+ daily requirement"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100"
              />
            </div>
          </div>

          <div className="text-right pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold"
            >
              {language === 'am' ? 'ስምምነቱን መዝግብ' : 'Save Agreement'}
            </button>
          </div>
        </form>

        {/* Existing Contracts Table */}
        <div className="border border-stone-800 rounded-xl overflow-hidden bg-stone-850/40">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {pricingAgreements.map((ag) => {
                const cust = customers.find((c) => c.id === ag.customerId);
                const prod = products.find((p) => p.id === ag.productId);

                return (
                  <tr key={ag.id} className="hover:bg-stone-800/30">
                    <td className="py-2.5 px-3 font-semibold text-stone-100">
                      {cust?.organizationName || ag.customerId}
                      {cust?.branch && <span className="text-stone-500 text-[11px] block">{cust.branch}</span>}
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
                      {new Date(ag.effectiveDate).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-medium">
                        Active
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-stone-400 text-[11px]">
                      {ag.notes || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
