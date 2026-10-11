/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import {
  Users,
  Search,
  Plus,
  PhoneCall,
  Building,
  MapPin,
  Clock,
  ArrowRight,
  AlertTriangle,
  Edit3,
  Trash2,
} from 'lucide-react';
import { Customer, CustomerType } from '../../types/domain.ts';
import { useToast } from '../common/ToastContext.tsx';

interface CustomersViewProps {
  onSelectCustomer: (customerId: string) => void;
  onOpenQuickOrder: (customerId?: string) => void;
  onOpenAddCustomer: () => void;
  onEditCustomer?: (customer: Customer) => void;
  initialSearchQuery?: string;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  onSelectCustomer,
  onOpenQuickOrder,
  onOpenAddCustomer,
  onEditCustomer,
  initialSearchQuery = '',
}) => {
  const { t, formatCurrency, language } = useLanguage();
  const { showSuccess } = useToast();
  const { customers, getCustomerBalance, deleteCustomer } = useBakeryStore();

  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm.trim() ||
        c.organizationName.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.branch && c.branch.toLowerCase().includes(q)) ||
        c.address.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (typeFilter !== 'ALL' && c.customerType !== typeFilter) return false;

      return true;
    });
  }, [customers, searchTerm, typeFilter]);

  return (
    <div className="space-y-5">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <span>{t.navCustomers}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 font-mono">
              {filteredCustomers.length}
            </span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            {language === 'am'
              ? 'የሆቴሎች፣ ሬስቶራንቶች፣ ካፌዎች እና ሱቆች ዝርዝር እና የሂሳብ ሚዛን'
              : 'Restaurants, cafes, burger houses, retail stores and debt balances'}
          </p>
        </div>

        <button
          onClick={onOpenAddCustomer}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm shadow transition shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addCustomer}</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'am' ? 'በድርጅት ስም፣ በቅርንጫፍ ወይም በስልክ ፈልግ...' : 'Search by business name, branch, phone, address...'}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none"
            >
              <option value="ALL">{language === 'am' ? 'ሁሉም የደንበኛ ዓይነቶች' : 'All Customer Types'}</option>
              <option value="BURGER_HOUSE">{t.typeBurgerHouse}</option>
              <option value="RESTAURANT">{t.typeRestaurant}</option>
              <option value="CAFE">{t.typeCafe}</option>
              <option value="SHOP">{t.typeShop}</option>
              <option value="HOTEL">{t.typeHotel}</option>
              <option value="OTHER">{t.typeOther}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-stone-500 text-xs bg-stone-900 border border-stone-800 rounded-xl">
            {language === 'am' ? 'ምንም የሚዛመድ ደንበኛ አልተገኘም' : 'No matching customers found'}
          </div>
        ) : (
          filteredCustomers.map((c) => {
            const { totalInvoiced, totalPaid, outstandingBalance } = getCustomerBalance(c.id);

            return (
              <div
                key={c.id}
                onClick={() => onSelectCustomer(c.id)}
                className="bg-stone-900 border border-stone-800 hover:border-stone-700 rounded-xl p-4 transition shadow-sm cursor-pointer flex flex-col justify-between text-xs space-y-3 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-stone-100 group-hover:text-amber-400 transition truncate text-sm">
                        {c.organizationName}
                      </h3>
                      {c.branch && (
                        <div className="text-[11px] text-amber-500/90 font-medium">
                          {c.branch}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-medium shrink-0">
                      {c.customerType}
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-1.5 text-stone-400 text-[11px]">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-stone-300 font-medium truncate">{c.name}</span>
                      <a
                        href={`tel:${c.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-mono text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/20 inline-flex items-center gap-1 active:scale-95 transition"
                        title={language === 'am' ? 'ለደንበኛው ደውል' : 'Call customer'}
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>{c.phone}</span>
                      </a>
                    </div>

                    <div className="flex items-start gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                      <span className="truncate">{c.address}</span>
                    </div>

                    {c.preferredDeliveryTime && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                        <span>{c.preferredDeliveryTime}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Financial Bar */}
                <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-stone-400">
                      {language === 'am' ? 'ያልተከፈለ ዕዳ:' : 'Outstanding Debt:'}
                    </div>
                    <div className="font-mono font-bold mt-0.5">
                      {outstandingBalance > 0 ? (
                        <span className="text-amber-400 text-xs">
                          {formatCurrency(outstandingBalance)}
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-[11px]">
                          {language === 'am' ? 'ዕዳ የለም' : 'Zero Balance'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {onEditCustomer && (
                      <button
                        type="button"
                        onClick={() => onEditCustomer(c)}
                        title={language === 'am' ? 'የደንበኛ መረጃ አሻሽል' : 'Edit Customer'}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-400 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setCustomerToDelete(c)}
                      title={language === 'am' ? 'ደንበኛ ሰርዝ' : 'Delete Customer'}
                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-950/60 text-stone-400 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onOpenQuickOrder(c.id)}
                      title={t.newOrder}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold text-xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{language === 'am' ? 'እዘዝ' : 'Order'}</span>
                    </button>

                    <button
                      onClick={() => onSelectCustomer(c.id)}
                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-950/85 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-5 text-xs space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{language === 'am' ? 'ደንበኛ ማጥፋት እርግጠኛ ነዎት?' : 'Confirm Customer Deletion'}</span>
            </div>

            <p className="text-stone-300 leading-relaxed">
              {language === 'am'
                ? `ደንበኛውን "${customerToDelete.organizationName}" (${customerToDelete.phone}) ከስርዓቱ ማጥፋት ይፈልጋሉ? ይህን እርምጃ መመለስ አይቻልም።`
                : `Are you sure you want to delete "${customerToDelete.organizationName}" (${customerToDelete.phone})? This action cannot be undone.`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCustomer(customerToDelete.id);
                  showSuccess(
                    language === 'am' ? 'ደንበኛ ተሰርዟል!' : 'Customer Deleted!',
                    language === 'am'
                      ? `${customerToDelete.organizationName} ተሰርዟል`
                      : `${customerToDelete.organizationName} has been deleted`
                  );
                  setCustomerToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow"
              >
                {language === 'am' ? 'አዎ ሰርዝ' : 'Delete Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
