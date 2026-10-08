/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import { X, Building, User, Phone, MapPin, Clock } from 'lucide-react';
import { CustomerType } from '../../types/domain.ts';
import { useToast } from '../common/ToastContext.tsx';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (customerId: string) => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t, language } = useLanguage();
  const { showSuccess, showError } = useToast();
  const { addCustomer, products } = useBakeryStore();

  const [organizationName, setOrganizationName] = useState('');
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('BURGER_HOUSE');
  const [phone, setPhone] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [preferredDeliveryTime, setPreferredDeliveryTime] = useState('07:30 AM');
  const [notes, setNotes] = useState('');

  // Optional regular preference
  const [preferredProdId, setPreferredProdId] = useState(products[0]?.id || '');
  const [regularQty, setRegularQty] = useState<number>(100);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName.trim()) {
      showError(
        language === 'am' ? 'የድርጅት ስም ያስፈልጋል' : 'Business Name Required',
        language === 'am' ? 'እባክዎ የደንበኛውን/ድርጅቱን ስም ያስገቡ!' : 'Please enter the customer business name!'
      );
      return;
    }

    if (!phone.trim()) {
      showError(
        language === 'am' ? 'ስልክ ቁጥር ያስፈልጋል' : 'Phone Number Required',
        language === 'am' ? 'እባክዎ የደንበኛውን ስልክ ቁጥር ያስገቡ!' : 'Please enter the phone number!'
      );
      return;
    }

    const regularPreferences = preferredProdId && regularQty > 0
      ? [{ productId: preferredProdId, regularQuantity: regularQty }]
      : undefined;

    const created = addCustomer({
      organizationName: organizationName.trim(),
      name: (name || organizationName).trim(),
      branch: branch.trim() || undefined,
      customerType,
      phone: phone.trim(),
      managerPhone: managerPhone.trim() || undefined,
      address: address.trim(),
      status: 'ACTIVE',
      preferredDeliveryTime,
      notes: notes.trim() || undefined,
      regularPreferences,
    });

    showSuccess(
      language === 'am' ? 'ደንበኛ ተመዝግቧል!' : 'Customer Added!',
      language === 'am'
        ? `${organizationName.trim()} በተሳካ ሁኔታ ተመዝግቧል`
        : `${organizationName.trim()} has been saved successfully`
    );

    onClose();
    if (onSuccess) onSuccess(created.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-xs">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-850 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                {t.addCustomer}
              </h2>
              <p className="text-stone-400 text-[11px]">
                {language === 'am' ? 'አዲስ የቢዝነስ ወይም የግል ደንበኛ መመዝገቢያ' : 'Register business client or retail store'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-100 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'የድርጅት / ካፌ / ሬስቶራንት ስም' : 'Business / Org Name'} *
              </label>
              <input
                type="text"
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="e.g. ABC Burger House"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
              />
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'የንግድ ዓይነት' : 'Customer Type'}
              </label>
              <select
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value as CustomerType)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
              >
                <option value="BURGER_HOUSE">{t.typeBurgerHouse}</option>
                <option value="RESTAURANT">{t.typeRestaurant}</option>
                <option value="CAFE">{t.typeCafe}</option>
                <option value="SHOP">{t.typeShop}</option>
                <option value="HOTEL">{t.typeHotel}</option>
                <option value="OTHER">{t.typeOther}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'ቅርንጫፍ (ካለ)' : 'Branch Location'}
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. Bole Atlas Branch"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
              />
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'የተጠሪ ሰው ስም' : 'Contact Person'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Solomon Tadesse"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'ዋና ስልክ ቁጥር' : 'Primary Phone'} *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0911234567"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'ተጨማሪ / ስራ አስኪያጅ ስልክ' : 'Manager Phone (Optional)'}
              </label>
              <input
                type="tel"
                value={managerPhone}
                onChange={(e) => setManagerPhone(e.target.value)}
                placeholder="0922334455"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-300 font-semibold mb-1">
              {language === 'am' ? 'የማድረሻ አድራሻ' : 'Physical / Delivery Address'} *
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Bole Atlas, next to Edna Mall road"
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'የተለመደ የማድረሻ ሰዓት' : 'Preferred Delivery Time'}
              </label>
              <input
                type="text"
                value={preferredDeliveryTime}
                onChange={(e) => setPreferredDeliveryTime(e.target.value)}
                placeholder="07:30 AM"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
              />
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                {language === 'am' ? 'መደበኛ የሚታዘዝ ዳቦ' : 'Regular Bread (Preference)'}
              </label>
              <select
                value={preferredProdId}
                onChange={(e) => setPreferredProdId(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {language === 'am' ? p.nameAm : p.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-stone-300 font-semibold mb-1">
              {language === 'am' ? 'ተጨማሪ ማስታወሻ' : 'Customer Notes'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Directions, payment agreements, or delivery requirements..."
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
            />
          </div>

          {/* Footer */}
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
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold"
            >
              {t.save}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
