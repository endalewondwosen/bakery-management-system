/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import {
  ShoppingBag,
  PhoneCall,
  Search,
  Filter,
  Repeat,
  Wallet,
  Clock,
  Truck,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { OrderStatus } from '../../types/domain.ts';

interface OrdersViewProps {
  onOpenQuickOrder: () => void;
  onSelectOrder: (orderId: string) => void;
  onOpenRecordPayment: (orderId: string, customerId: string) => void;
  onSelectCustomer: (customerId: string) => void;
  initialSearchQuery?: string;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  onOpenQuickOrder,
  onSelectOrder,
  onOpenRecordPayment,
  onSelectCustomer,
  initialSearchQuery = '',
}) => {
  const { t, formatCurrency, language } = useLanguage();
  const {
    orders,
    getOrderItems,
    getOrderOutstandingAmount,
    getOrderPaidAmount,
    repeatOrder,
    updateOrderStatus,
  } = useBakeryStore();

  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID'>('ALL');

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Search
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm.trim() ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.organizationName.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        (o.branch && o.branch.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Status Filter
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;

      // Payment Filter
      const paid = getOrderPaidAmount(o.id);
      const outstanding = getOrderOutstandingAmount(o.id);

      if (paymentFilter === 'PAID' && outstanding > 0) return false;
      if (paymentFilter === 'PARTIAL' && (paid === 0 || outstanding === 0)) return false;
      if (paymentFilter === 'UNPAID' && paid > 0) return false;

      return true;
    });
  }, [orders, searchTerm, statusFilter, paymentFilter, getOrderPaidAmount, getOrderOutstandingAmount]);

  const handleQuickRepeat = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    const newOrd = repeatOrder(orderId);
    alert(
      language === 'am'
        ? `አዲስ ትዕዛዝ ቁጥር ${newOrd.orderNumber} በተሳካ ሁኔታ ተፈጥሯል!`
        : `Repeat order ${newOrd.orderNumber} successfully created!`
    );
  };

  return (
    <div className="space-y-5">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            <span>{t.navOrders}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 font-mono">
              {filteredOrders.length}
            </span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            {language === 'am'
              ? 'የስልክ እና የደንበኞች ትዕዛዞች፣ የማድረሻ እና የክፍያ ሁኔታዎች'
              : 'Phone & customer orders, delivery tracking, and payment balances'}
          </p>
        </div>

        <button
          onClick={onOpenQuickOrder}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm shadow transition shrink-0 cursor-pointer"
        >
          <PhoneCall className="w-4 h-4" />
          <span>{t.newOrder}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'am' ? 'ትዕዛዝ ቁጥር፣ ደንበኛ ወይም ስልክ ፈልግ...' : 'Search order #, customer, phone...'}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none"
            >
              <option value="ALL">{language === 'am' ? 'ሁሉም የትዕዛዝ ሁኔታዎች' : 'All Order Statuses'}</option>
              <option value="PENDING">{t.statusPending}</option>
              <option value="CONFIRMED">{t.statusConfirmed}</option>
              <option value="PREPARING">{t.statusPreparing}</option>
              <option value="READY">{t.statusReady}</option>
              <option value="OUT_FOR_DELIVERY">{t.statusOutForDelivery}</option>
              <option value="DELIVERED">{t.statusDelivered}</option>
              <option value="CANCELLED">{t.statusCancelled}</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none"
            >
              <option value="ALL">{language === 'am' ? 'ሁሉም የክፍያ ሁኔታዎች' : 'All Payment States'}</option>
              <option value="PAID">{t.fullyPaid}</option>
              <option value="PARTIAL">{t.partiallyPaid}</option>
              <option value="UNPAID">{t.unpaidCredit}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-stone-500 text-xs bg-stone-900 border border-stone-800 rounded-xl">
            <ShoppingBag className="w-8 h-8 mx-auto text-stone-600 mb-2" />
            {language === 'am' ? 'ምንም የሚዛመድ ትዕዛዝ አልተገኘም' : 'No matching orders found'}
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const items = getOrderItems(ord.id);
            const paid = getOrderPaidAmount(ord.id);
            const outstanding = getOrderOutstandingAmount(ord.id);

            return (
              <div
                key={ord.id}
                onClick={() => onSelectOrder(ord.id)}
                className="bg-stone-900 border border-stone-800 hover:border-stone-700 rounded-xl p-4 transition shadow-sm cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                {/* Left Section: Order details */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      {ord.orderNumber}
                    </span>
                    <span className="text-stone-500">·</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCustomer(ord.customerId);
                      }}
                      className="font-bold text-stone-100 hover:text-amber-400 text-left text-sm truncate"
                    >
                      {ord.organizationName}
                    </button>
                    {ord.branch && (
                      <span className="text-stone-400 text-[11px]">
                        ({ord.branch})
                      </span>
                    )}
                    <span className="text-stone-500">·</span>
                    <a
                      href={`tel:${ord.customerPhone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-mono font-semibold bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/20 transition"
                      title={language === 'am' ? 'ለደንበኛው ደውል' : 'Call customer'}
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>{ord.customerPhone}</span>
                    </a>
                  </div>

                  {/* Bread items summary */}
                  <div className="text-stone-300 flex flex-wrap gap-2 text-[11px]">
                    {items.map((it) => (
                      <span
                        key={it.id}
                        className="bg-stone-800/80 px-2 py-0.5 rounded border border-stone-700/60 font-medium"
                      >
                        {it.quantity} × {language === 'am' ? it.productNameAm : it.productNameEn}
                      </span>
                    ))}
                  </div>

                  {/* Delivery & Source info */}
                  <div className="text-stone-500 flex flex-wrap items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1 text-stone-400">
                      <Truck className="w-3.5 h-3.5 text-stone-500" />
                      <span>{ord.deliveryType === 'DELIVERY' ? t.deliveryTypeDelivery : t.deliveryTypePickup}</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-stone-400">
                      <Clock className="w-3.5 h-3.5 text-stone-500" />
                      <span>{ord.scheduledTime || new Date(ord.orderDate).toLocaleTimeString()}</span>
                    </span>
                    {ord.driverName && (
                      <>
                        <span>·</span>
                        <span className="text-stone-400">{ord.driverName}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Section: Financials & Action Buttons */}
                <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 border-t md:border-t-0 border-stone-800 pt-3 md:pt-0">
                  <div className="text-right">
                    <div className="text-stone-400 text-[11px]">{t.orderTotal}</div>
                    <div className="text-sm font-mono font-bold text-stone-100">
                      {formatCurrency(ord.totalAmount)}
                    </div>
                    <div className="mt-0.5">
                      {outstanding > 0 ? (
                        <span className="text-[11px] font-mono text-amber-400">
                          {language === 'am' ? 'ቀሪ:' : 'Due:'} {formatCurrency(outstanding)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-medium">
                          {language === 'am' ? 'ሙሉ ተከፍሏል' : 'Fully Paid'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="text-center">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wide uppercase ${
                      ord.status === 'DELIVERED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                        : ord.status === 'OUT_FOR_DELIVERY'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800/80'
                        : ord.status === 'CANCELLED'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800/80'
                        : 'bg-stone-800 text-stone-300 border border-stone-700'
                    }`}>
                      {ord.status}
                    </span>
                  </div>

                  {/* Quick Action buttons */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleQuickRepeat(e, ord.id)}
                      title={t.repeatOrder}
                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-400 transition"
                    >
                      <Repeat className="w-4 h-4" />
                    </button>

                    {outstanding > 0 && (
                      <button
                        onClick={() => onOpenRecordPayment(ord.id, ord.customerId)}
                        title={t.recordPayment}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-700/60 text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>{t.recordPayment}</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectOrder(ord.id)}
                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
