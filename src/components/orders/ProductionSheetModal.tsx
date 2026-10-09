/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Daily Morning Production Sheet Modal
 * Aggregates bread quantities, delivery time batches, and ingredient requirements.
 * Includes local store offline fallback, CSV export, and wastage/safety buffer.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../i18n/useLanguage.tsx';
import { useBakeryStore } from '../../store/bakeryStore.tsx';
import { orderApi } from '../../services/apiClient.ts';
import type { DailyProductionSheetDto, ProductionProductSummary, ProductionBatchSlot } from '../../types/apiContracts.ts';
import {
  X,
  Printer,
  Calendar,
  Flame,
  Clock,
  Layers,
  ShoppingBag,
  Truck,
  CheckCircle2,
  RefreshCw,
  Scale,
  Download,
  ShieldCheck,
  Percent
} from 'lucide-react';

interface ProductionSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductionSheetModal: React.FC<ProductionSheetModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const { orders, orderItems } = useBakeryStore();
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DailyProductionSheetDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [safetyBufferPct, setSafetyBufferPct] = useState<number>(5); // 5% default safety/wastage buffer
  const [sourceMode, setSourceMode] = useState<'server' | 'local'>('server');

  // Compute local fallback from store if server is unreachable
  const computeLocalSheet = (targetDate: string): DailyProductionSheetDto => {
    const activeOrders = orders.filter(
      (o) => o.orderDate.startsWith(targetDate) && o.status !== 'CANCELLED'
    );

    const itemsByOrder = new Map<string, typeof orderItems>();
    for (const item of orderItems) {
      const list = itemsByOrder.get(item.orderId) || [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }

    const productTotals = new Map<
      string,
      { id: string; nameEn: string; nameAm: string; totalQty: number }
    >();

    let grandTotalUnits = 0;

    for (const o of activeOrders) {
      const oItems = itemsByOrder.get(o.id) || [];
      for (const it of oItems) {
        grandTotalUnits += it.quantity;
        const existing = productTotals.get(it.productId) || {
          id: it.productId,
          nameEn: it.productNameEn,
          nameAm: it.productNameAm,
          totalQty: 0,
        };
        existing.totalQty += it.quantity;
        productTotals.set(it.productId, existing);
      }
    }

    const productsSummary: ProductionProductSummary[] = Array.from(productTotals.values()).map((p) => {
      const isBun = p.nameEn.toLowerCase().includes('bun') || p.nameEn.toLowerCase().includes('burger');
      const isPastry =
        p.nameEn.toLowerCase().includes('croissant') ||
        p.nameEn.toLowerCase().includes('pastry') ||
        p.nameEn.toLowerCase().includes('cake');
      const factor = isBun ? 0.08 : isPastry ? 0.15 : 0.25;
      const estimatedFlourKg = Math.round(p.totalQty * factor * 10) / 10;

      return {
        productId: p.id,
        productNameEn: p.nameEn,
        productNameAm: p.nameAm,
        totalQuantity: p.totalQty,
        estimatedFlourKg,
      };
    });

    const totalFlourKg = productsSummary.reduce((sum, p) => sum + p.estimatedFlourKg, 0);
    const flourQuintals = Math.round((totalFlourKg / 100) * 100) / 100;
    const yeastKg = Math.round(totalFlourKg * 0.015 * 100) / 100;
    const saltKg = Math.round(totalFlourKg * 0.018 * 100) / 100;
    const sugarKg = Math.round(totalFlourKg * 0.03 * 100) / 100;
    const oilLiters = Math.round(totalFlourKg * 0.025 * 100) / 100;

    const slotsMap = new Map<string, typeof activeOrders>();
    for (const o of activeOrders) {
      const timeKey = o.scheduledTime || '06:30 AM (Standard Morning)';
      const list = slotsMap.get(timeKey) || [];
      list.push(o);
      slotsMap.set(timeKey, list);
    }

    const sortedTimes = Array.from(slotsMap.keys()).sort();
    const timeSlots: ProductionBatchSlot[] = sortedTimes.map((timeKey) => {
      const slotOrders = slotsMap.get(timeKey) || [];
      let slotLoaves = 0;

      const mappedOrders = slotOrders.map((o) => {
        const oItems = itemsByOrder.get(o.id) || [];
        const orderLoaves = oItems.reduce((sum, it) => sum + it.quantity, 0);
        slotLoaves += orderLoaves;
        const itemsSummary = oItems.map((it) => `${it.quantity}x ${it.productNameEn}`).join(', ');

        return {
          orderId: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          organizationName: o.organizationName,
          customerPhone: o.customerPhone,
          deliveryAddress: o.deliveryAddress ?? undefined,
          driverName: o.driverName ?? undefined,
          status: o.status as any,
          itemsSummary,
        };
      });

      return {
        scheduledTime: timeKey,
        orderCount: slotOrders.length,
        totalLoaves: slotLoaves,
        orders: mappedOrders,
      };
    });

    return {
      targetDate,
      totalOrders: activeOrders.length,
      totalUnits: grandTotalUnits,
      productsSummary,
      timeSlots,
      ingredientEstimates: {
        flourQuintals,
        flourKg: Math.round(totalFlourKg * 10) / 10,
        yeastKg,
        sugarKg,
        saltKg,
        oilLiters,
      },
    };
  };

  const loadSheet = async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      const sheet = await orderApi.getProductionSheet(date);
      setData(sheet);
      setSourceMode('server');
    } catch {
      // Graceful offline fallback: calculate using local store
      const localSheet = computeLocalSheet(date);
      setData(localSheet);
      setSourceMode('local');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSheet(selectedDate);
    }
  }, [isOpen, selectedDate, orders, orderItems]);

  // Adjust ingredients with selected safety/wastage margin
  const bufferedIngredients = useMemo(() => {
    if (!data) return null;
    const factor = 1 + safetyBufferPct / 100;
    const rawFlour = data.ingredientEstimates.flourKg * factor;
    return {
      flourKg: Math.round(rawFlour * 10) / 10,
      flourQuintals: Math.round((rawFlour / 100) * 100) / 100,
      yeastKg: Math.round(data.ingredientEstimates.yeastKg * factor * 100) / 100,
      saltKg: Math.round(data.ingredientEstimates.saltKg * factor * 100) / 100,
      sugarKg: Math.round(data.ingredientEstimates.sugarKg * factor * 100) / 100,
      oilLiters: Math.round(data.ingredientEstimates.oilLiters * factor * 100) / 100,
    };
  }, [data, safetyBufferPct]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!data) return;
    const headers = ['Category', 'Product / Time Slot', 'Detail / Customer', 'Quantity (Units)', 'Flour Est (kg)'];
    const rows: (string | number)[][] = [];

    // Products breakdown
    data.productsSummary.forEach((p) => {
      rows.push(['Product Requirement', `"${p.productNameEn}"`, `"${p.productNameAm || ''}"`, p.totalQuantity, p.estimatedFlourKg]);
    });

    // Time slot batches
    data.timeSlots.forEach((slot) => {
      slot.orders.forEach((o) => {
        rows.push([
          `Batch: ${slot.scheduledTime}`,
          `Order #${o.orderNumber}`,
          `"${o.organizationName} (${o.customerPhone})"`,
          `"${o.itemsSummary}"`,
          '-'
        ]);
      });
    });

    // Recipe ingredient totals
    if (bufferedIngredients) {
      rows.push(['Ingredients', 'Flour with Buffer', `${safetyBufferPct}% margin`, `${bufferedIngredients.flourQuintals} Quintals`, bufferedIngredients.flourKg]);
      rows.push(['Ingredients', 'Yeast (እርሾ)', '-', `${bufferedIngredients.yeastKg} kg`, '-']);
      rows.push(['Ingredients', 'Salt (ጨው)', '-', `${bufferedIngredients.saltKg} kg`, '-']);
      rows.push(['Ingredients', 'Sugar (ስኳር)', '-', `${bufferedIngredients.sugarKg} kg`, '-']);
      rows.push(['Ingredients', 'Cooking Oil (ዘይት)', '-', `${bufferedIngredients.oilLiters} L`, '-']);
    }

    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `Production_Sheet_${selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        
        {/* Header (Hidden in Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-stone-800 bg-stone-900/90 gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-100 flex items-center gap-2">
                <span>{language === 'am' ? 'የዕለት የዳቦ መጋገሪያ ዕቅድ' : 'Daily Production & Baking Sheet'}</span>
                {sourceMode === 'local' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-800 text-stone-400 border border-stone-700">
                    Offline Store
                  </span>
                )}
              </h2>
              <p className="text-xs text-stone-400">
                {language === 'am'
                  ? 'ለዋና ጋጋሪ እና ለአከፋፋይ ቡድን የተዘጋጀ የዕለት ማጠቃለያ'
                  : 'Baking batch schedule and recipe estimates for head baker & dispatch'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Date Selector */}
            <div className="flex items-center gap-1.5 bg-stone-800 px-2.5 py-1.5 rounded-lg border border-stone-700 text-xs">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-stone-200 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Safety Margin Selector */}
            <div className="flex items-center gap-1 bg-stone-800 px-2 py-1.5 rounded-lg border border-stone-700 text-xs">
              <span className="text-stone-400 text-[10px]">Buffer:</span>
              <select
                value={safetyBufferPct}
                onChange={(e) => setSafetyBufferPct(Number(e.target.value))}
                className="bg-transparent text-amber-400 font-semibold focus:outline-none cursor-pointer"
              >
                <option value={0} className="bg-stone-900 text-stone-100">+0% Exact</option>
                <option value={5} className="bg-stone-900 text-stone-100">+5% Safe</option>
                <option value={10} className="bg-stone-900 text-stone-100">+10% Buffer</option>
              </select>
            </div>

            {/* CSV Export Button */}
            <button
              onClick={handleExportCSV}
              title="Download CSV"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 text-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">CSV</span>
            </button>

            {/* Print Slip Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'am' ? 'አትም' : 'Print Slip'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto print:max-h-none print:p-0 print:space-y-4">
          
          {/* Printable Official Header */}
          <div className="hidden print:block border-b-2 border-stone-800 pb-4 text-center">
            <h1 className="text-xl font-bold uppercase tracking-wide">Yibeltal Bakery & Pastry</h1>
            <p className="text-xs text-stone-600">Daily Baking Plan & Dispatch Schedule | Addis Ababa, Ethiopia</p>
            <p className="text-sm font-semibold mt-1">Date: {selectedDate}</p>
          </div>

          {loading && (
            <div className="py-16 text-center text-stone-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-sm">{language === 'am' ? 'የመጋገሪያ ዕቅድ በማዘጋጀት ላይ...' : 'Aggregating daily production sheet...'}</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
              {error}
            </div>
          )}

          {data && !loading && (
            <>
              {/* Stat Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
                <div className="p-3 sm:p-4 rounded-xl bg-stone-800/60 border border-stone-700/60 print:bg-white print:border-black">
                  <span className="text-xs text-stone-400 print:text-black">
                    {language === 'am' ? 'ጠቅላላ ትዕዛዞች' : 'Total Orders'}
                  </span>
                  <p className="text-2xl font-bold text-stone-100 print:text-black mt-1">
                    {data.totalOrders}
                  </p>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-stone-800/60 border border-stone-700/60 print:bg-white print:border-black">
                  <span className="text-xs text-stone-400 print:text-black">
                    {language === 'am' ? 'ጠቅላላ ፍሬ / ዳቦ' : 'Total Units / Loaves'}
                  </span>
                  <p className="text-2xl font-bold text-amber-400 print:text-black mt-1">
                    {data.totalUnits.toLocaleString()}
                  </p>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-stone-800/60 border border-stone-700/60 print:bg-white print:border-black">
                  <span className="text-xs text-stone-400 print:text-black">
                    {language === 'am' ? 'የዱቄት ፍላጎት (ኩንታል)' : 'Flour (Quintals)'}
                  </span>
                  <p className="text-2xl font-bold text-amber-300 print:text-black mt-1">
                    {bufferedIngredients?.flourQuintals} <span className="text-xs font-normal">Qt ({bufferedIngredients?.flourKg} kg)</span>
                  </p>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-stone-800/60 border border-stone-700/60 print:bg-white print:border-black">
                  <span className="text-xs text-stone-400 print:text-black">
                    {language === 'am' ? 'እርሾ (ኪ.ግ)' : 'Yeast Estimate'}
                  </span>
                  <p className="text-2xl font-bold text-stone-200 print:text-black mt-1">
                    {bufferedIngredients?.yeastKg} <span className="text-xs font-normal">kg</span>
                  </p>
                </div>
              </div>

              {/* Recipe / Ingredient Estimation Box */}
              <div className="p-4 rounded-xl bg-stone-800/40 border border-stone-800 print:border-black space-y-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-400 print:text-black">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    <span>{language === 'am' ? 'የጥሬ ዕቃ ግብዓት ስሌት (ኢስቲሜት)' : 'Batch Ingredient Breakdown (Baker Recipe Yield)'}</span>
                  </div>
                  {safetyBufferPct > 0 && (
                    <span className="text-[10px] lowercase text-stone-400 print:text-black">
                      includes +{safetyBufferPct}% safety buffer
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div className="p-2.5 bg-stone-800 rounded-lg print:border print:bg-white">
                    <span className="text-stone-400 print:text-black">Flour (ዱቄት):</span>
                    <p className="font-semibold text-stone-200 print:text-black mt-0.5">
                      {bufferedIngredients?.flourKg} kg ({bufferedIngredients?.flourQuintals} ጆንያ)
                    </p>
                  </div>
                  <div className="p-2.5 bg-stone-800 rounded-lg print:border print:bg-white">
                    <span className="text-stone-400 print:text-black">Yeast (እርሾ):</span>
                    <p className="font-semibold text-stone-200 print:text-black mt-0.5">{bufferedIngredients?.yeastKg} kg</p>
                  </div>
                  <div className="p-2.5 bg-stone-800 rounded-lg print:border print:bg-white">
                    <span className="text-stone-400 print:text-black">Salt (ጨው):</span>
                    <p className="font-semibold text-stone-200 print:text-black mt-0.5">{bufferedIngredients?.saltKg} kg</p>
                  </div>
                  <div className="p-2.5 bg-stone-800 rounded-lg print:border print:bg-white">
                    <span className="text-stone-400 print:text-black">Sugar (ስኳር):</span>
                    <p className="font-semibold text-stone-200 print:text-black mt-0.5">{bufferedIngredients?.sugarKg} kg</p>
                  </div>
                  <div className="p-2.5 bg-stone-800 rounded-lg print:border print:bg-white">
                    <span className="text-stone-400 print:text-black">Oil (ዘይት):</span>
                    <p className="font-semibold text-stone-200 print:text-black mt-0.5">{bufferedIngredients?.oilLiters} L</p>
                  </div>
                </div>
              </div>

              {/* Product Loaf Aggregation */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-stone-200 print:text-black flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400 print:text-black" />
                  <span>{language === 'am' ? 'የዳቦ ዓይነቶች ዝርዝር' : 'Required Quantities by Product'}</span>
                </h3>

                <div className="overflow-x-auto rounded-xl border border-stone-800 print:border-black">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-stone-800/80 text-stone-300 font-semibold border-b border-stone-700 print:bg-stone-200 print:text-black">
                      <tr>
                        <th className="py-2.5 px-3">Product Name (የዳቦ ዓይነት)</th>
                        <th className="py-2.5 px-3 text-right">Required Quantity</th>
                        <th className="py-2.5 px-3 text-right">Estimated Flour</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800 text-stone-300 print:text-black print:divide-black">
                      {data.productsSummary.map((prod) => (
                        <tr key={prod.productId} className="hover:bg-stone-800/40">
                          <td className="py-2 px-3 font-medium text-stone-100 print:text-black">
                            {prod.productNameEn} {prod.productNameAm ? `(${prod.productNameAm})` : ''}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-amber-400 print:text-black">
                            {prod.totalQuantity.toLocaleString()} pcs
                          </td>
                          <td className="py-2 px-3 text-right text-stone-400 print:text-black">
                            {prod.estimatedFlourKg} kg
                          </td>
                        </tr>
                      ))}
                      {data.productsSummary.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-stone-500">
                            {language === 'am' ? 'ለዚህ ቀን ምንም ትዕዛዝ አልተመዘገበም' : 'No active orders scheduled for this date.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Baking & Dispatch Batches by Scheduled Time */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-stone-200 print:text-black flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 print:text-black" />
                  <span>{language === 'am' ? 'የማከፋፈያ ሰዓታት እና ደንበኞች' : 'Scheduled Delivery Batches & Customers'}</span>
                </h3>

                <div className="space-y-3">
                  {data.timeSlots.map((slot, index) => (
                    <div
                      key={index}
                      className="p-3 sm:p-4 rounded-xl bg-stone-800/30 border border-stone-800 print:border-black print:bg-white space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-stone-800 print:border-black pb-2">
                        <span className="font-bold text-amber-400 print:text-black text-sm flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {slot.scheduledTime}
                        </span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-stone-400 print:text-black">{slot.orderCount} orders</span>
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold print:border print:text-black">
                            {slot.totalLoaves} loaves total
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        {slot.orders.map((ord) => (
                          <div
                            key={ord.orderId}
                            className="p-2.5 rounded-lg bg-stone-800/70 border border-stone-700/50 print:bg-white print:border-stone-400"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-stone-100 print:text-black">
                                {ord.organizationName} ({ord.customerName})
                              </span>
                              <span className="text-[10px] text-stone-400 print:text-black font-mono">
                                #{ord.orderNumber}
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-400 print:text-black font-medium mt-0.5">
                              {ord.itemsSummary}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-stone-400 print:text-black mt-1">
                              <span>Phone: {ord.customerPhone}</span>
                              {ord.deliveryAddress && <span className="truncate max-w-[150px]">{ord.deliveryAddress}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {data.timeSlots.length === 0 && (
                    <div className="p-6 text-center text-stone-500 text-xs">
                      {language === 'am' ? 'ምንም የማከፋፈያ ሰዓት አልተመደበም' : 'No time slot batches found for this date.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Signatures for Print Slip */}
              <div className="hidden print:grid grid-cols-2 gap-10 pt-8 mt-8 border-t border-black text-xs text-black">
                <div>
                  <p className="font-bold">Head Baker Acknowledgment:</p>
                  <p className="mt-8 border-b border-black w-48"></p>
                  <p className="mt-1 text-[10px] text-stone-600">Name & Signature</p>
                </div>
                <div>
                  <p className="font-bold">Dispatch & Logistics Lead:</p>
                  <p className="mt-8 border-b border-black w-48"></p>
                  <p className="mt-1 text-[10px] text-stone-600">Name & Signature</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
