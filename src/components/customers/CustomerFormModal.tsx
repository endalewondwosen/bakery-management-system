/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import { X, Building, User, Phone, MapPin, Clock } from 'lucide-react';
import { Customer, CustomerType } from '../../types/domain.ts';
import { useToast } from '../common/ToastContext.tsx';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (customerId: string) => void;
  customerToEdit?: Customer | null;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customerToEdit,
}) => {
  const { t, language } = useLanguage();
  const { showSuccess, showError } = useToast();
  const { addCustomer, updateCustomer, products } = useBakeryStore();

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track open state so we ONLY initialize once upon opening the modal
  const prevOpenRef = React.useRef(false);
  const prevEditIdRef = React.useRef<string | undefined>(undefined);

  useEffect(() => {
    // Only run initialization if modal just opened (false -> true) or if editing a different customer
    const justOpened = isOpen && !prevOpenRef.current;
    const customerChanged = isOpen && customerToEdit?.id !== prevEditIdRef.current;

    if (justOpened || customerChanged) {
      if (customerToEdit) {
        setOrganizationName(customerToEdit.organizationName || '');
        setName(customerToEdit.name || '');
        setBranch(customerToEdit.branch || '');
        setCustomerType(customerToEdit.customerType || 'BURGER_HOUSE');
        setPhone(customerToEdit.phone || '');
        setManagerPhone(customerToEdit.managerPhone || '');
        setAddress(customerToEdit.address || '');
        setPreferredDeliveryTime(customerToEdit.preferredDeliveryTime || '07:30 AM');
        setNotes(customerToEdit.notes || '');

        if (customerToEdit.regularPreferences && customerToEdit.regularPreferences.length > 0) {
          setPreferredProdId(customerToEdit.regularPreferences[0].productId);
          setRegularQty(customerToEdit.regularPreferences[0].regularQuantity);
        }
      } else {
        setOrganizationName('');
        setName('');
        setBranch('');
        setCustomerType('BURGER_HOUSE');
        setPhone('');
        setManagerPhone('');
        setAddress('');
        setPreferredDeliveryTime('07:30 AM');
        setNotes('');
        setPreferredProdId(products[0]?.id || '');
        setRegularQty(100);
      }
    }

    prevOpenRef.current = isOpen;
    prevEditIdRef.current = customerToEdit?.id;
  }, [isOpen, customerToEdit?.id]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedOrg = organizationName.trim();
    const trimmedName = name.trim();
    const effectiveOrgName = trimmedOrg || trimmedName;

    // Friendly validation: only require at least one name identifier (business or contact person)
    if (!effectiveOrgName) {
      showError(
        language === 'am' ? 'የደንበኛ ወይም የድርጅት ስም ያስገቡ' : 'Customer Name Required',
        language === 'am' ? 'እባክዎ ቢያንስ የድርጅቱን ወይም የደንበኛውን ስም ያስገቡ!' : 'Please enter at least the business or contact person name!'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const regularPreferences = preferredProdId && regularQty > 0
        ? [{ productId: preferredProdId, regularQuantity: regularQty }]
        : undefined;

      const cleanPhone = phone.trim() || '-';
      const cleanAddress = address.trim() || '-';

      if (customerToEdit) {
        updateCustomer(customerToEdit.id, {
          organizationName: effectiveOrgName,
          name: trimmedName || effectiveOrgName,
          branch: branch.trim() || undefined,
          customerType,
          phone: cleanPhone,
          managerPhone: managerPhone.trim() || undefined,
          address: cleanAddress,
          preferredDeliveryTime: preferredDeliveryTime.trim() || undefined,
          notes: notes.trim() || undefined,
          regularPreferences,
        });

        showSuccess(
          language === 'am' ? 'የደንበኛ መረጃ ተሻሽሏል!' : 'Customer Updated!',
          language === 'am'
            ? `${effectiveOrgName} መረጃ በተሳካ ሁኔታ ተሻሽሏል`
            : `${effectiveOrgName} updated successfully`
        );

        onClose();
        if (onSuccess) onSuccess(customerToEdit.id);
      } else {
        const created = addCustomer({
          organizationName: effectiveOrgName,
          name: trimmedName || effectiveOrgName,
          branch: branch.trim() || undefined,
          customerType,
          phone: cleanPhone,
          managerPhone: managerPhone.trim() || undefined,
          address: cleanAddress,
          status: 'ACTIVE',
          preferredDeliveryTime: preferredDeliveryTime.trim() || undefined,
          notes: notes.trim() || undefined,
          regularPreferences,
        });

        showSuccess(
          language === 'am' ? 'ደንበኛ ተመዝግቧል!' : 'Customer Added!',
          language === 'am'
            ? `${effectiveOrgName} በተሳካ ሁኔታ ተመዝግቧል`
            : `${effectiveOrgName} has been saved successfully`
        );

        onClose();
        if (onSuccess) onSuccess(created.id);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-sm">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-850 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                {customerToEdit
                  ? (language === 'am' ? 'የደንበኛ መረጃ አሻሽል' : 'Edit Customer Profile')
                  : t.addCustomer}
              </h2>
              <p className="text-stone-400 text-xs">
                {customerToEdit
                  ? (language === 'am' ? 'የስልክ፣ የአድራሻ ወይም የስም ማስተካከያ' : 'Update contact, address, branch, or preferences')
                  : (language === 'am' ? 'አዲስ የቢዝነስ ወይም የግል ደንበኛ መመዝገቢያ' : 'Register business client or retail store')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-stone-800 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Unconstrained & Friendly */}
        <form onSubmit={handleSubmit} noValidate className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-300 font-semibold mb-1 text-xs">
                {language === 'am' ? 'የድርጅት / ካፌ / ሬስቶራንት ስም' : 'Business / Org Name'} *
              </label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="e.g. ABC Burger House / ሮማ ካፌ"
                className="w-full bg-stone-800 border border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-stone-100 text-sm placeholder:text-stone-500 transition"
              />
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1 text-xs">
                {language === 'am' ? 'የንግድ ዓይነት' : 'Customer Type'}
              </label>
              <select
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value as CustomerType)}
                className="w-full bg-stone-800 border border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-stone-100 text-sm transition"
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
              <label className="block text-stone-300 font-semibold mb-1 text-xs">
                {language === 'am' ? 'ቅርንጫፍ (ካለ)' : 'Branch Location'}
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. Bole Atlas Branch / ቦሌ አትላስ"
                className="w-full bg-stone-800 border border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-stone-100 text-sm placeholder:text-stone-500 transition"
              />
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1 text-xs">
                {language === 'am' ? 'የተጠሪ ሰው ስም' : 'Contact Person'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Solomon Tadesse / ሰለሞን ታደሰ"
                className="w-full bg-stone-800 border border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-stone-100 text-sm placeholder:text-stone-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-300 font-semibold mb-1 text-xs">
                {language === 'am' ? 'ዋና ስልክ ቁጥር' : 'Primary Phone'} <span className="text-stone-500 font-normal">({language === 'am' ? 'አማራጭ' : 'Optional'})</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0911234567"
                className="w-full bg-stone-800 border border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-stone-100 text-sm font-mono placeholder:text-stone-500 transition"
              />
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1 text-xs">
                {language === 'am' ? 'ተጨማሪ / ስራ አስኪያጅ ስልክ' : 'Manager Phone'} <span className="text-stone-500 font-normal">({language === 'am' ? 'አማራጭ' : 'Optional'})</span>
              </label>
              <input
                type="tel"
                value={managerPhone}
                onChange={(e) => setManagerPhone(e.target.value)}
                placeholder="0922334455"
                className="w-full bg-stone-800 border border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-stone-100 text-sm font-mono placeholder:text-stone-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-300 font-semibold mb-1 text-xs">
              {language === 'am' ? 'የማድረሻ አድራሻ' : 'Physical / Delivery Address'} <span className="text-stone-500 font-normal">({language === 'am' ? 'አማራጭ' : 'Optional'})</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Bole Atlas, next to Edna Mall / ቦሌ (optional)"
              className="w-full bg-stone-800 border border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-stone-100 text-sm placeholder:text-stone-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-300 font-semibold mb-1 text-xs">
                {language === 'am' ? 'የተለመደ የማድረሻ ሰዓት' : 'Preferred Delivery Time'}
              </label>
              <input
                type="text"
                value={preferredDeliveryTime}
                onChange={(e) => setPreferredDeliveryTime(e.target.value)}
                placeholder="07:30 AM"
                className="w-full bg-stone-800 border border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-stone-100 text-sm placeholder:text-stone-500 transition"
              />
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1 text-xs">
                {language === 'am' ? 'መደበኛ የሚታዘዝ ዳቦ' : 'Regular Bread (Preference)'}
              </label>
              <select
                value={preferredProdId}
                onChange={(e) => setPreferredProdId(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-stone-100 text-sm transition"
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
            <label className="block text-stone-300 font-semibold mb-1 text-xs">
              {language === 'am' ? 'ተጨማሪ ማስታወሻ' : 'Customer Notes'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Directions, payment agreements, or delivery requirements..."
              className="w-full bg-stone-800 border border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3.5 py-2.5 text-stone-100 text-sm placeholder:text-stone-500 transition"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs sm:text-sm cursor-pointer transition"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-bold text-xs sm:text-sm shadow transition cursor-pointer"
            >
              {isSubmitting ? (language === 'am' ? 'በመመዝገብ ላይ...' : 'Saving...') : t.save}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
