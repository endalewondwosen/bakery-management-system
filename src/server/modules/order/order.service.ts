/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Order Domain Service
 * Handles order placements, item breakdowns, production status workflow, and ledger updates.
 */

import { db } from '../../db/index.ts';
import * as schema from '../../db/schema.ts';
import { eq, desc, and } from 'drizzle-orm';
import type { Order, OrderItem } from '../../../types/domain.ts';
import type {
  CreateOrderDto,
  UpdateOrderStatusDto,
  DailyProductionSheetDto,
  ProductionProductSummary,
  ProductionBatchSlot,
} from '../../../types/apiContracts.ts';

export async function getAllOrders(): Promise<(Order & { items: OrderItem[] })[]> {
  const orders = await db.select().from(schema.orders).orderBy(desc(schema.orders.orderDate));
  const items = await db.select().from(schema.orderItems);

  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const item of items) {
    const list = itemsByOrder.get(item.orderId) || [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  return orders.map((o) => ({
    ...o,
    branch: o.branch ?? undefined,
    deliveryAddress: o.deliveryAddress ?? undefined,
    scheduledTime: o.scheduledTime ?? undefined,
    actualDeliveryTime: o.actualDeliveryTime ?? undefined,
    driverName: o.driverName ?? undefined,
    deliveryNotes: o.deliveryNotes ?? undefined,
    notes: o.notes ?? undefined,
    orderSource: o.orderSource as any,
    status: o.status as any,
    deliveryType: o.deliveryType as any,
    items: itemsByOrder.get(o.id) || [],
  }));
}

export async function getOrderById(id: string): Promise<(Order & { items: OrderItem[] }) | null> {
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
  if (!order) return null;

  const rawItems = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, id));

  return {
    ...order,
    branch: order.branch ?? undefined,
    deliveryAddress: order.deliveryAddress ?? undefined,
    scheduledTime: order.scheduledTime ?? undefined,
    actualDeliveryTime: order.actualDeliveryTime ?? undefined,
    driverName: order.driverName ?? undefined,
    deliveryNotes: order.deliveryNotes ?? undefined,
    notes: order.notes ?? undefined,
    orderSource: order.orderSource as any,
    status: order.status as any,
    deliveryType: order.deliveryType as any,
    items: rawItems,
  };
}

export async function createOrder(dto: CreateOrderDto): Promise<Order & { items: OrderItem[] }> {
  const now = new Date().toISOString();
  const dateStr = now.slice(0, 10).replace(/-/g, '');
  const randSeq = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `ORD-${dateStr}-${randSeq}`;
  const orderId = `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  const totalAmount = dto.items.reduce((sum, item) => sum + (item.subtotal || item.quantity * item.unitPrice), 0);

  const newOrder: Order = {
    id: orderId,
    orderNumber,
    customerId: dto.customerId,
    customerName: dto.customerName,
    organizationName: dto.organizationName,
    branch: dto.branch,
    customerPhone: dto.customerPhone,
    orderSource: dto.orderSource || 'PHONE',
    status: 'PENDING',
    orderDate: dto.orderDate,
    totalAmount,
    deliveryType: dto.deliveryType,
    deliveryAddress: dto.deliveryAddress,
    scheduledTime: dto.scheduledTime,
    notes: dto.notes,
    createdBy: dto.createdBy || 'Staff',
    updatedAt: now,
  };

  await db.insert(schema.orders).values({
    id: newOrder.id,
    orderNumber: newOrder.orderNumber,
    customerId: newOrder.customerId,
    customerName: newOrder.customerName,
    organizationName: newOrder.organizationName,
    branch: newOrder.branch || null,
    customerPhone: newOrder.customerPhone,
    orderSource: newOrder.orderSource,
    status: newOrder.status,
    orderDate: newOrder.orderDate,
    totalAmount: newOrder.totalAmount,
    deliveryType: newOrder.deliveryType,
    deliveryAddress: newOrder.deliveryAddress || null,
    scheduledTime: newOrder.scheduledTime || null,
    notes: newOrder.notes || null,
    createdBy: newOrder.createdBy,
    updatedAt: newOrder.updatedAt,
  });

  const createdItems: OrderItem[] = [];
  for (const item of dto.items) {
    const itemId = `oi-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const orderItem: OrderItem = {
      id: itemId,
      orderId: newOrder.id,
      productId: item.productId,
      productNameEn: item.productNameEn,
      productNameAm: item.productNameAm,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal || item.quantity * item.unitPrice,
    };

    await db.insert(schema.orderItems).values({
      id: orderItem.id,
      orderId: orderItem.orderId,
      productId: orderItem.productId,
      productNameEn: orderItem.productNameEn,
      productNameAm: orderItem.productNameAm,
      quantity: orderItem.quantity,
      unitPrice: orderItem.unitPrice,
      subtotal: orderItem.subtotal,
    });

    createdItems.push(orderItem);
  }

  return {
    ...newOrder,
    items: createdItems,
  };
}

export async function updateOrderStatus(id: string, dto: UpdateOrderStatusDto): Promise<(Order & { items: OrderItem[] }) | null> {
  const now = new Date().toISOString();
  const updateValues: Record<string, any> = {
    status: dto.status,
    updatedAt: now,
  };

  if (dto.notes !== undefined) updateValues.notes = dto.notes;
  if (dto.driverName !== undefined) updateValues.driverName = dto.driverName;
  if (dto.actualDeliveryTime !== undefined) updateValues.actualDeliveryTime = dto.actualDeliveryTime;

  await db.update(schema.orders).set(updateValues).where(eq(schema.orders.id, id));

  return getOrderById(id);
}

/**
 * Aggregates all orders for a target production day into a structured baking plan
 */
export async function getProductionSheet(targetDate: string): Promise<DailyProductionSheetDto> {
  const allOrders = await db.select().from(schema.orders).where(eq(schema.orders.orderDate, targetDate));
  const activeOrders = allOrders.filter((o) => o.status !== 'CANCELLED');

  const allItems = await db.select().from(schema.orderItems);
  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const item of allItems) {
    const list = itemsByOrder.get(item.orderId) || [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  // Aggregate by product
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
    // Estimations: bread loaf ~0.25kg flour, buns ~0.08kg, pastry ~0.15kg
    const isBun = p.nameEn.toLowerCase().includes('bun') || p.nameEn.toLowerCase().includes('burger');
    const isPastry = p.nameEn.toLowerCase().includes('croissant') || p.nameEn.toLowerCase().includes('pastry') || p.nameEn.toLowerCase().includes('cake');
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

  // Calculate total raw material estimates
  const totalFlourKg = productsSummary.reduce((sum, p) => sum + p.estimatedFlourKg, 0);
  const flourQuintals = Math.round((totalFlourKg / 100) * 100) / 100;
  const yeastKg = Math.round(totalFlourKg * 0.015 * 100) / 100;
  const saltKg = Math.round(totalFlourKg * 0.018 * 100) / 100;
  const sugarKg = Math.round(totalFlourKg * 0.03 * 100) / 100;
  const oilLiters = Math.round(totalFlourKg * 0.025 * 100) / 100;

  // Group by scheduled delivery time / batch
  const slotsMap = new Map<string, typeof activeOrders>();
  for (const o of activeOrders) {
    const timeKey = o.scheduledTime || '06:30 AM (Standard Batch)';
    const list = slotsMap.get(timeKey) || [];
    list.push(o);
    slotsMap.set(timeKey, list);
  }

  // Sort slots by time
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
}
