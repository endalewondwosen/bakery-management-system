/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import {
  X,
  PhoneCall,
  Plus,
  Minus,
  Check,
  Building,
  MapPin,
  Clock,
  Sparkles,
  AlertCircle,
  Trash2,
  Package,
  RotateCcw
} from 'lucide-react';
import { DeliveryType, PaymentMethod } from '../../types/domain.ts';
import { useToast } from '../common/ToastContext.tsx';

interface QuickOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCustomerId?: string;
  onSuccessOrder?: (orderId: string) => void;
}

export const QuickOrderModal: React.FC<QuickOrderModalProps> = ({
  isOpen,
  onClose,
  preselectedCustomerId,
  onSuccessOrder,
}) => {
  const { t, formatCurrency, language } = useLanguage();
  const { showSuccess, showError } = useToast();
  const {
    customers,
    products,
    getCustomerAgreedPrice,
    createOrder,
    orders,
    getOrderItems,
  } = useBakeryStore();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    preselectedCustomerId || (customers.length > 0 ? customers[0].id : '')
  );

  const [customerSearch, setCustomerSearch] = useState<string>('');

  // Active products in the bakery
  const activeProducts = useMemo(() => {
    return products.filter((prod) => prod.isActive);
  }, [products]);

  // Selected product IDs included in the current order form
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Selected quantities: { [productId]: quantity }
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('DELIVERY');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Payment Options
  const [paymentOption, setPaymentOption] = useState<'NONE' | 'FULL' | 'PARTIAL'>('NONE');
  const [partialAmount, setPartialAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [transactionRef, setTransactionRef] = useState<string>('');

  // Find customer object
  const currentCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Initialize with only 1 default product (or customer's preference) when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (currentCustomer?.regularPreferences && currentCustomer.regularPreferences.length > 0) {
        setSelectedProductIds(currentCustomer.regularPreferences.map((pref) => pref.productId));
      } else if (activeProducts.length > 0) {
        // Default to ONLY the 1st primary bread product
        setSelectedProductIds([activeProducts[0].id]);
      }
    }
  }, [isOpen, activeProducts, currentCustomer]);

  // Update defaults when customer changes
  React.useEffect(() => {
    if (currentCustomer) {
      setDeliveryAddress(currentCustomer.address || '');
      setScheduledTime(currentCustomer.preferredDeliveryTime || '07:30 AM');

      // Populate default regular preferences if no quantities chosen yet
      if (currentCustomer.regularPreferences && currentCustomer.regularPreferences.length > 0) {
        const initialMap: Record<string, number> = {};
        currentCustomer.regularPreferences.forEach((pref) => {
          initialMap[pref.productId] = pref.regularQuantity;
        });
        setQuantities(initialMap);
      } else {
        setQuantities({});
      }
    }
  }, [currentCustomer]);

  // Filtered customer list for search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.organizationName.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.branch && c.branch.toLowerCase().includes(q))
    );
  }, [customers, customerSearch]);

  // Quick repeat from customer's previous order
  const handleLoadPreviousOrder = () => {
    if (!selectedCustomerId) return;
    const lastOrder = orders.find((o) => o.customerId === selectedCustomerId && o.status !== 'CANCELLED');
    if (lastOrder) {
      const items = getOrderItems(lastOrder.id);
      const newQuantities: Record<string, number> = {};
      const orderedProductIds: string[] = [];
      items.forEach((item) => {
        newQuantities[item.productId] = item.quantity;
        orderedProductIds.push(item.productId);
      });
      setQuantities(newQuantities);
      if (orderedProductIds.length > 0) {
        setSelectedProductIds(orderedProductIds);
      }
      if (lastOrder.deliveryNotes) setDeliveryNotes(lastOrder.deliveryNotes);
    }
  };

  const handleQuantityChange = (productId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleDirectQuantityInput = (productId: string, val: string) => {
    const parsed = parseInt(val, 10);
    setQuantities((prev) => ({
      ...prev,
      [productId]: isNaN(parsed) || parsed < 0 ? 0 : parsed,
    }));
  };

  // Remove bread type from this order
  const handleRemoveProduct = (productId: string) => {
    setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
    setQuantities((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  // Add bread type to this order
  const handleAddProduct = (productId: string) => {
    setSelectedProductIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
  };

  // Clean up all 0-quantity rows with one click
  const handleRemoveZeroQuantity = () => {
    const withQty = selectedProductIds.filter((id) => (quantities[id] || 0) > 0);
    if (withQty.length > 0) {
      setSelectedProductIds(withQty);
    }
  };

  // Restore all active bakery bread types
  const handleRestoreAllProducts = () => {
    setSelectedProductIds(activeProducts.map((p) => p.id));
  };

  // Products available to be added
  const unselectedProducts = useMemo(() => {
    return activeProducts.filter((prod) => !selectedProductIds.includes(prod.id));
  }, [activeProducts, selectedProductIds]);

  // Check if there are some 0-qty items alongside positive ones
  const hasZeroQtyItems = useMemo(() => {
    const zeroCount = selectedProductIds.filter((id) => (quantities[id] || 0) === 0).length;
    const positiveCount = selectedProductIds.filter((id) => (quantities[id] || 0) > 0).length;
    return zeroCount > 0 && positiveCount > 0;
  }, [selectedProductIds, quantities]);

  // Calculate order items and total amount
  const orderItemsData = useMemo(() => {
    if (!selectedCustomerId) return [];
    return activeProducts
      .filter((prod) => selectedProductIds.includes(prod.id))
      .map((prod) => {
        const qty = quantities[prod.id] || 0;
        const agreed = getCustomerAgreedPrice(selectedCustomerId, prod.id);
        const subtotal = qty * agreed.price;
        return {
          product: prod,
          quantity: qty,
          unitPrice: agreed.price,
          isAgreedPrice: agreed.isAgreed,
          subtotal,
        };
      });
  }, [activeProducts, selectedProductIds, quantities, selectedCustomerId, getCustomerAgreedPrice]);

  const totalCalculated = useMemo(() => {
    return orderItemsData.reduce((sum, item) => sum + item.subtotal, 0);
  }, [orderItemsData]);

  const totalItemCount = useMemo(() => {
    return orderItemsData.reduce((sum, item) => sum + item.quantity, 0);
  }, [orderItemsData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;

    const validItems = orderItemsData
      .filter((item) => item.quantity > 0)
      .map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));

    if (validItems.length === 0) {
      showError(
        language === 'am' ? 'ትዕዛዝ አልተሞላም' : 'No Items Selected',
        language === 'am' ? 'እባክዎ ቢያንስ የአንድ ዳቦ ዓይነት ብዛት ያስገቡ!' : 'Please enter quantity for at least one bread type!'
      );
      return;
    }

    let initialPaymentData = undefined;
    if (paymentOption === 'FULL' && totalCalculated > 0) {
      initialPaymentData = {
        amount: totalCalculated,
        paymentMethod,
        transactionReference: transactionRef || undefined,
        isVerified: paymentMethod === 'CASH',
      };
    } else if (paymentOption === 'PARTIAL' && partialAmount > 0) {
      initialPaymentData = {
        amount: partialAmount,
        paymentMethod,
        transactionReference: transactionRef || undefined,
        isVerified: paymentMethod === 'CASH',
      };
    }

    const created = createOrder({
      customerId: selectedCustomerId,
      deliveryType,
      deliveryAddress,
      scheduledTime,
      deliveryNotes,
      notes: orderNotes,
      items: validItems,
      initialPayment: initialPaymentData,
    });

    const targetCustomer = customers.find((c) => c.id === selectedCustomerId);
    showSuccess(
      language === 'am' ? 'ትዕዛዝ ተመዝግቧል!' : 'Order Created!',
      language === 'am'
        ? `ትዕዛዝ ${created.orderNumber} ለ${targetCustomer?.organizationName || 'ደንበኛ'} ተመዝግቧል (${formatCurrency(created.totalAmount)})`
        : `Order ${created.orderNumber} for ${targetCustomer?.organizationName || 'Customer'} saved (${formatCurrency(created.totalAmount)})`
    );

    onClose();
    if (onSuccessOrder) {
      onSuccessOrder(created.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center p-0 sm:p-4 bg-stone-950/85 backdrop-blur-sm overflow-hidden">
      <div className="bg-stone-900 sm:border border-stone-800 rounded-none sm:rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden h-full sm:h-auto sm:max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-stone-800 flex items-center justify-between bg-stone-850 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-stone-100">
                {t.quickOrderTitle}
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-400">
                {language === 'am' ? 'የስልክ ጥሪ ትዕዛዝ ፈጣን መመዝገቢያ' : 'Fast phone call order recording'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-2 sm:p-1 rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          
          {/* Customer Selection Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-300">
                {t.selectCustomer}
              </label>
              {selectedCustomerId && (
                <button
                  type="button"
                  onClick={handleLoadPreviousOrder}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{language === 'am' ? 'የቀደመ ትዕዛዝ አስመጣ' : 'Repeat Last Order'}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder={language === 'am' ? 'በስም ወይም በስልክ ፈልግ...' : 'Search by name or phone...'}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />

              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {filteredCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.organizationName} — {c.phone} {c.branch ? `(${c.branch})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {currentCustomer && (
              <div className="bg-stone-850/80 border border-stone-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-400">
                <div className="flex flex-wrap items-center gap-2">
                  <Building className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-stone-200 font-bold">{currentCustomer.name}</span>
                  <span>·</span>
                  <a
                    href={`tel:${currentCustomer.phone}`}
                    className="text-amber-400 hover:text-amber-300 font-mono font-semibold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"
                    title={language === 'am' ? 'ለደንበኛው ደውል' : 'Call customer'}
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>{currentCustomer.phone}</span>
                  </a>
                </div>
                <div className="text-[11px] text-stone-400 truncate max-w-xs">
                  {currentCustomer.address}
                </div>
              </div>
            )}
          </div>

          {/* Bread Products & Quantities Section */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-stone-300">
                  {t.orderItemsTitle}
                </label>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 font-mono">
                  {orderItemsData.length} / {activeProducts.length} {language === 'am' ? 'ዓይነቶች' : 'types'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {hasZeroQtyItems && (
                  <button
                    type="button"
                    onClick={handleRemoveZeroQuantity}
                    title={language === 'am' ? 'ብዛት 0 የሆኑትን የዳቦ ዓይነቶች ከዚህ ትዕዛዝ ያስወግዳል' : 'Remove items that have 0 quantity from this order'}
                    className="text-[11px] text-amber-500 hover:text-amber-400 underline underline-offset-2 transition cursor-pointer"
                  >
                    {t.removeAllZeroQty}
                  </button>
                )}
                <span className="text-xs text-stone-400 font-medium">
                  {totalItemCount} {language === 'am' ? 'ዳቦዎች ተመርጠዋል' : 'total items'}
                </span>
              </div>
            </div>

            {/* List of included bread types */}
            {orderItemsData.length === 0 ? (
              <div className="p-6 text-center bg-stone-850/40 rounded-xl border border-dashed border-stone-800 space-y-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                  <Package className="w-5 h-5" />
                </div>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  {t.noBreadTypesAdded}
                </p>
                <button
                  type="button"
                  onClick={handleRestoreAllProducts}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow transition cursor-pointer"
                >
                  {t.restoreAllBreadTypes}
                </button>
              </div>
            ) : (
              <div className="space-y-2 border border-stone-800 rounded-xl divide-y divide-stone-800 bg-stone-850/40 overflow-hidden">
                {orderItemsData.map((item) => {
                  const prod = item.product;
                  const qty = item.quantity;
                  const isSpecial = item.isAgreedPrice;

                  return (
                    <div
                      key={prod.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-stone-800/30 transition text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-stone-100 text-sm">
                            {language === 'am' ? prod.nameAm : prod.nameEn}
                          </span>
                          <span className="text-stone-500 text-[11px]">
                            ({language === 'am' ? prod.nameEn : prod.nameAm})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-stone-300 font-medium font-mono">
                            {formatCurrency(item.unitPrice)}
                          </span>
                          {isSpecial && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800/60 font-medium">
                              {language === 'am' ? 'የስምምነት ዋጋ' : 'Agreed Price'}
                            </span>
                          )}
                          <span className="text-stone-500 text-[11px]">
                            {language === 'am' ? 'መደበኛ:' : 'Base:'} {formatCurrency(prod.basePrice)}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Stepper & Actions */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <div className="flex items-center border border-stone-700 rounded-lg overflow-hidden bg-stone-800">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(prod.id, -10)}
                            className="h-10 sm:h-8 px-2.5 sm:px-2 hover:bg-stone-700 text-stone-300 transition text-xs font-bold"
                            title="-10"
                          >
                            -10
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(prod.id, -1)}
                            className="h-10 sm:h-8 w-9 sm:w-8 flex items-center justify-center hover:bg-stone-700 text-stone-300 transition"
                          >
                            <Minus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={qty === 0 ? '' : qty}
                            onChange={(e) => handleDirectQuantityInput(prod.id, e.target.value)}
                            placeholder="0"
                            className="w-13 sm:w-14 h-10 sm:h-8 text-center bg-transparent text-stone-100 font-mono font-bold focus:outline-none text-sm sm:text-xs"
                          />

                          <button
                            type="button"
                            onClick={() => handleQuantityChange(prod.id, 1)}
                            className="h-10 sm:h-8 w-9 sm:w-8 flex items-center justify-center hover:bg-stone-700 text-stone-300 transition"
                          >
                            <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(prod.id, 10)}
                            className="h-10 sm:h-8 px-2.5 sm:px-2 hover:bg-stone-700 text-stone-300 transition text-xs font-bold"
                            title="+10"
                          >
                            +10
                          </button>
                        </div>

                        {/* Subtotal */}
                        <div className="w-16 sm:w-20 text-right font-mono font-bold text-stone-200 text-xs sm:text-xs">
                          {formatCurrency(item.subtotal)}
                        </div>

                        {/* Remove bread type button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(prod.id)}
                          title={language === 'am' ? `${prod.nameAm} ከዚህ ትዕዛዝ አስወግድ` : `Remove ${prod.nameEn} from this order`}
                          className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Flexible Add Bread Type Drawer (if some types are removed/unselected) */}
            {unselectedProducts.length > 0 && (
              <div className="p-3 bg-stone-900/60 border border-dashed border-stone-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t.addBreadType}</span>
                    <span className="text-[10px] text-stone-400 font-normal">
                      ({unselectedProducts.length} {language === 'am' ? 'ሊጨመሩ የሚችሉ' : 'available'})
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={handleRestoreAllProducts}
                    className="text-[11px] text-amber-500 hover:text-amber-400 hover:underline cursor-pointer"
                  >
                    {t.restoreAllBreadTypes}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {unselectedProducts.map((p) => {
                    const priceInfo = getCustomerAgreedPrice(selectedCustomerId, p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleAddProduct(p.id)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 hover:border-amber-500/60 transition text-xs cursor-pointer group shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition" />
                        <span className="font-medium">{language === 'am' ? p.nameAm : p.nameEn}</span>
                        <span className="font-mono text-stone-400 text-[11px]">({formatCurrency(priceInfo.price)})</span>
                        {priceInfo.isAgreed && (
                          <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-800/60 px-1 py-0.2 rounded font-medium">
                            {language === 'am' ? 'ስምምነት' : 'Agreed'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Delivery Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-stone-300 mb-1">
                {language === 'am' ? 'የማድረሻ ዓይነት' : 'Delivery Method'}
              </label>
              <select
                value={deliveryType}
                onChange={(e) => setDeliveryType(e.target.value as DeliveryType)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100 focus:outline-none"
              >
                <option value="DELIVERY">{t.deliveryTypeDelivery}</option>
                <option value="PICKUP">{t.deliveryTypePickup}</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-300 mb-1">
                {language === 'am' ? 'የተጠየቀበት ሰዓት' : 'Scheduled Delivery Time'}
              </label>
              <input
                type="text"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="e.g. 07:30 AM"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-300 mb-1">
                {language === 'am' ? 'የማድረሻ አድራሻ' : 'Delivery Address'}
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Specific location / branch"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Initial Payment Options */}
          <div className="bg-stone-850 border border-stone-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-200">
                {t.initialPaymentOption}
              </label>
              <span className="text-xs text-amber-400 font-bold font-mono">
                {language === 'am' ? 'ጠቅላላ ሂሳብ:' : 'Order Total:'} {formatCurrency(totalCalculated)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentOption('NONE')}
                className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition ${
                  paymentOption === 'NONE'
                    ? 'bg-amber-600/20 border-amber-500 text-amber-400 font-bold'
                    : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                }`}
              >
                {t.noPaymentCredit}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentOption('FULL');
                  setPartialAmount(totalCalculated);
                }}
                className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition ${
                  paymentOption === 'FULL'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 font-bold'
                    : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                }`}
              >
                {t.payFull}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentOption('PARTIAL');
                  if (partialAmount === 0) setPartialAmount(Math.round(totalCalculated / 2));
                }}
                className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition ${
                  paymentOption === 'PARTIAL'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-bold'
                    : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                }`}
              >
                {t.payPartial}
              </button>
            </div>

            {/* If Payment option is FULL or PARTIAL */}
            {paymentOption !== 'NONE' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-stone-800 text-xs">
                {paymentOption === 'PARTIAL' && (
                  <div>
                    <label className="block text-stone-400 mb-1">
                      {language === 'am' ? 'የተከፈለ መጠን' : 'Amount Paid Now'}
                    </label>
                    <input
                      type="number"
                      value={partialAmount}
                      max={totalCalculated}
                      onChange={(e) => setPartialAmount(Number(e.target.value))}
                      className="w-full bg-stone-800 border border-stone-700 rounded px-2.5 py-1.5 text-stone-100 font-mono"
                    />
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {language === 'am' ? 'ቀሪ ዕዳ:' : 'Remaining Debt:'} {formatCurrency(Math.max(0, totalCalculated - partialAmount))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-stone-400 mb-1">
                    {language === 'am' ? 'የክፍያ ዘዴ' : 'Payment Method'}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-2.5 py-1.5 text-stone-100"
                  >
                    <option value="CASH">{t.methodCash}</option>
                    <option value="TELEBIRR">{t.methodTelebirr}</option>
                    <option value="BANK_TRANSFER">{t.methodBankTransfer}</option>
                    <option value="OTHER">{t.methodOther}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">
                    {t.transactionReference}
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder={paymentMethod === 'CASH' ? 'Optional voucher #' : 'e.g. TB12908871'}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-2.5 py-1.5 text-stone-100 font-mono text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="text-xs">
            <label className="block text-stone-400 mb-1">
              {language === 'am' ? 'የትዕዛዝ ተጨማሪ ማስታወሻ' : 'Order Notes'}
            </label>
            <input
              type="text"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="e.g. Call before dispatch, extra packaging..."
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-stone-100 focus:outline-none"
            />
          </div>

        </form>

        {/* Modal Footer - Sticky on Mobile */}
        <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-t border-stone-800 bg-stone-900 sm:bg-stone-850 flex items-center justify-between gap-3 shrink-0 shadow-lg safe-area-bottom">
          <div>
            <div className="text-[10px] sm:text-xs text-stone-400">
              {language === 'am' ? 'የትዕዛዝ ድምር:' : 'Order Total:'}
            </div>
            <div className="text-lg sm:text-xl font-bold text-amber-400 font-mono">
              {formatCurrency(totalCalculated)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={totalCalculated === 0}
              className="px-4 sm:px-5 py-2.5 sm:py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 text-xs sm:text-sm font-bold transition shadow-md"
            >
              {language === 'am' ? 'ትዕዛዝ መዝግብ' : 'Confirm Order'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
