/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { enqueueMutation, drainMutationQueue, subscribeQueue, getPendingCount, startAutoDrain } from '../services/offlineQueue.ts';
import { syncApi } from '../services/apiClient.ts';
import {
  Customer,
  CustomerPricingAgreement,
  Product,
  Order,
  OrderItem,
  Payment,
  Expense,
  Complaint,
  CustomerStatementEntry,
  OrderStatus,
  PaymentMethod,
  ComplaintStatus,
  ResolutionType,
  ComplaintPriority,
  DeliveryType,
  OrderSource
} from '../types/domain.ts';
import {
  initialCustomers,
  initialPricingAgreements,
  initialProducts,
  initialOrders,
  initialOrderItems,
  initialPayments,
  initialExpenses,
  initialComplaints
} from './mockData.ts';

interface BakeryStoreContextType {
  customers: Customer[];
  pricingAgreements: CustomerPricingAgreement[];
  products: Product[];
  orders: Order[];
  orderItems: OrderItem[];
  payments: Payment[];
  expenses: Expense[];
  complaints: Complaint[];

  // Actions
  createOrder: (orderData: {
    customerId: string;
    deliveryType: DeliveryType;
    deliveryAddress?: string;
    scheduledTime?: string;
    driverName?: string;
    deliveryNotes?: string;
    notes?: string;
    items: { productId: string; quantity: number; unitPrice?: number }[];
    initialPayment?: {
      amount: number;
      paymentMethod: PaymentMethod;
      transactionReference?: string;
      isVerified?: boolean;
    };
  }) => Order;

  repeatOrder: (previousOrderId: string) => Order;

  updateOrderStatus: (orderId: string, status: OrderStatus, actualDeliveryTime?: string) => void;

  recordPayment: (paymentData: {
    orderId: string;
    customerId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    transactionReference?: string;
    notes?: string;
    isVerified?: boolean;
    recordedBy?: string;
  }) => Payment;

  verifyPayment: (paymentId: string, verifiedBy: string) => void;
  rejectPayment: (paymentId: string) => void;

  recordExpense: (expenseData: Omit<Expense, 'id' | 'date'> & { date?: string }) => Expense;

  addCustomer: (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (id: string, customerData: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  addProduct: (productData: Omit<Product, 'id' | 'createdAt'>) => Product;
  updateProduct: (id: string, productData: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  updateOrder: (
    orderId: string,
    orderData: {
      deliveryType?: DeliveryType;
      deliveryAddress?: string;
      scheduledTime?: string;
      driverName?: string;
      deliveryNotes?: string;
      notes?: string;
      status?: OrderStatus;
      items?: { productId: string; quantity: number; unitPrice?: number }[];
    }
  ) => void;
  deleteOrder: (orderId: string) => void;

  updateExpense: (id: string, expenseData: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  updateComplaint: (id: string, complaintData: Partial<Complaint>) => void;
  deleteComplaint: (id: string) => void;

  setCustomerPricingAgreement: (
    customerId: string,
    productId: string,
    agreedPrice: number,
    notes?: string
  ) => void;
  deletePricingAgreement: (id: string) => void;

  fileComplaint: (complaintData: {
    customerId: string;
    orderId?: string;
    productId?: string;
    category: Complaint['category'];
    description: string;
    quantityAffected?: number;
    priority: ComplaintPriority;
  }) => Complaint;

  resolveComplaint: (
    complaintId: string,
    resolutionType: ResolutionType,
    resolutionNotes: string,
    resolvedBy: string
  ) => void;

  updateComplaintStatus: (complaintId: string, status: ComplaintStatus) => void;

  // Calculators & Helpers
  getOrderItems: (orderId: string) => OrderItem[];
  getOrderPayments: (orderId: string) => Payment[];
  getOrderPaidAmount: (orderId: string) => number;
  getOrderOutstandingAmount: (orderId: string) => number;
  
  getCustomerAgreedPrice: (customerId: string, productId: string) => {
    price: number;
    isAgreed: boolean;
    agreement?: CustomerPricingAgreement;
  };

  getCustomerBalance: (customerId: string) => {
    totalInvoiced: number;
    totalPaid: number;
    outstandingBalance: number;
  };

  getCustomerStatement: (customerId: string) => CustomerStatementEntry[];

  // Daily Operational Metrics
  todaySales: number;
  todayCollections: {
    cash: number;
    telebirr: number;
    bankTransfer: number;
    total: number;
  };
  todayExpensesTotal: number;
  totalOutstandingDebt: number;
  pendingVerificationCount: number;
  openComplaintsCount: number;
  activeDeliveriesCount: number;

  resetToInitialData: () => void;

  // Offline & Backend Sync Capabilities
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  syncWithServer: () => Promise<void>;
  pendingMutationsCount: number;
}

const BakeryStoreContext = createContext<BakeryStoreContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'bakery_v2_';
const DELETED_IDS_STORAGE_KEY = `${STORAGE_KEY_PREFIX}deleted_entity_ids_v1`;

interface LocalDeletedMap {
  customers: string[];
  orders: string[];
  expenses: string[];
  complaints: string[];
  products: string[];
  pricingAgreements: string[];
}

export function getLocalDeletedIds(): LocalDeletedMap {
  if (typeof window === 'undefined') {
    return { customers: [], orders: [], expenses: [], complaints: [], products: [], pricingAgreements: [] };
  }
  try {
    const raw = localStorage.getItem(DELETED_IDS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { customers: [], orders: [], expenses: [], complaints: [], products: [], pricingAgreements: [] };
  } catch {
    return { customers: [], orders: [], expenses: [], complaints: [], products: [], pricingAgreements: [] };
  }
}

export function recordLocalDeletedId(
  type: keyof LocalDeletedMap,
  id: string
) {
  if (typeof window === 'undefined' || !id) return;
  try {
    const cur = getLocalDeletedIds();
    if (!cur[type]) cur[type] = [];
    if (!cur[type].includes(id)) {
      cur[type].push(id);
      localStorage.setItem(DELETED_IDS_STORAGE_KEY, JSON.stringify(cur));
    }
  } catch (e) {
    console.error('Failed to record local deleted ID:', e);
  }
}

export function mergeRemoteDeletedIds(
  remoteDeleted?: Partial<Record<keyof LocalDeletedMap, string[]>>
) {
  if (typeof window === 'undefined' || !remoteDeleted) return;
  try {
    const cur = getLocalDeletedIds();
    let changed = false;
    const keys: (keyof LocalDeletedMap)[] = ['customers', 'orders', 'expenses', 'complaints', 'products', 'pricingAgreements'];
    for (const key of keys) {
      if (remoteDeleted[key] && Array.isArray(remoteDeleted[key])) {
        if (!cur[key]) cur[key] = [];
        for (const id of remoteDeleted[key]!) {
          if (!cur[key].includes(id)) {
            cur[key].push(id);
            changed = true;
          }
        }
      }
    }
    if (changed) {
      localStorage.setItem(DELETED_IDS_STORAGE_KEY, JSON.stringify(cur));
    }
  } catch (e) {
    console.error('Failed to merge remote deleted IDs:', e);
  }
}

// Purge legacy mock cache from browser localStorage on startup
if (typeof window !== 'undefined') {
  try {
    const legacyKeys = [
      'bakery_v1_customers',
      'bakery_v1_orders',
      'bakery_v1_order_items',
      'bakery_v1_payments',
      'bakery_v1_expenses',
      'bakery_v1_complaints',
      'bakery_v1_pricing_agreements',
      'bakery_v1_last_synced_at',
    ];
    legacyKeys.forEach(k => localStorage.removeItem(k));
  } catch {
    // Ignore storage restrictions
  }
}

function dedupeCustomers(list: Customer[]): Customer[] {
  const seenId = new Set<string>();
  const seenOrgPhone = new Set<string>();
  const result: Customer[] = [];
  for (const c of list) {
    if (!c || !c.id) continue;
    if (seenId.has(c.id)) continue;

    // Only deduplicate by phone if it is a real phone number (not placeholder '-' and has at least 9 digits)
    const cleanPhone = (c.phone || '').replace(/[^\d]/g, '');
    const cleanOrg = (c.organizationName || c.name || '').trim().toLowerCase();
    const isRealPhone = cleanPhone.length >= 9;
    const orgPhoneKey = isRealPhone && cleanOrg ? `${cleanOrg}_${cleanPhone}` : null;

    if (orgPhoneKey && seenOrgPhone.has(orgPhoneKey)) {
      continue;
    }

    seenId.add(c.id);
    if (orgPhoneKey) seenOrgPhone.add(orgPhoneKey);
    result.push(c);
  }
  return result;
}

function dedupeOrders(list: Order[]): Order[] {
  const seenId = new Set<string>();
  const seenOrderNum = new Set<string>();
  const result: Order[] = [];
  for (const o of list) {
    if (!o || !o.id) continue;
    if (seenId.has(o.id) || (o.orderNumber && seenOrderNum.has(o.orderNumber.trim()))) {
      continue;
    }
    seenId.add(o.id);
    if (o.orderNumber) seenOrderNum.add(o.orderNumber.trim());
    result.push(o);
  }
  return result;
}

function dedupePayments(list: Payment[]): Payment[] {
  const seenId = new Set<string>();
  const seenRec = new Set<string>();
  const result: Payment[] = [];
  for (const p of list) {
    if (!p || !p.id) continue;
    if (seenId.has(p.id) || (p.receiptNumber && seenRec.has(p.receiptNumber.trim()))) {
      continue;
    }
    seenId.add(p.id);
    if (p.receiptNumber) seenRec.add(p.receiptNumber.trim());
    result.push(p);
  }
  return result;
}

function dedupeComplaints(list: Complaint[]): Complaint[] {
  const seenId = new Set<string>();
  const seenNum = new Set<string>();
  const result: Complaint[] = [];
  for (const c of list) {
    if (!c || !c.id) continue;
    if (seenId.has(c.id) || (c.complaintNumber && seenNum.has(c.complaintNumber.trim()))) {
      continue;
    }
    seenId.add(c.id);
    if (c.complaintNumber) seenNum.add(c.complaintNumber.trim());
    result.push(c);
  }
  return result;
}

export const BakeryStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const deletedCust = new Set(getLocalDeletedIds().customers);
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}customers`);
    const list = saved ? dedupeCustomers(JSON.parse(saved)) : initialCustomers;
    return list.filter(c => !deletedCust.has(c.id));
  });

  const [pricingAgreements, setPricingAgreements] = useState<CustomerPricingAgreement[]>(() => {
    const deletedAgr = new Set(getLocalDeletedIds().pricingAgreements);
    const deletedCust = new Set(getLocalDeletedIds().customers);
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}pricing_agreements`);
    const list = saved ? JSON.parse(saved) : initialPricingAgreements;
    return list.filter((pa: CustomerPricingAgreement) => !deletedAgr.has(pa.id) && !deletedCust.has(pa.customerId));
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const deletedProd = new Set(getLocalDeletedIds().products);
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}products`);
    const list = saved ? JSON.parse(saved) : initialProducts;
    return list.filter((p: Product) => !deletedProd.has(p.id));
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const deletedOrd = new Set(getLocalDeletedIds().orders);
    const deletedCust = new Set(getLocalDeletedIds().customers);
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}orders`);
    const list = saved ? dedupeOrders(JSON.parse(saved)) : initialOrders;
    return list.filter(o => !deletedOrd.has(o.id) && !deletedCust.has(o.customerId));
  });

  const [orderItems, setOrderItems] = useState<OrderItem[]>(() => {
    const deletedOrd = new Set(getLocalDeletedIds().orders);
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}order_items`);
    const list = saved ? JSON.parse(saved) : initialOrderItems;
    return list.filter((i: OrderItem) => !deletedOrd.has(i.orderId));
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const deletedCust = new Set(getLocalDeletedIds().customers);
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}payments`);
    const list = saved ? dedupePayments(JSON.parse(saved)) : initialPayments;
    return list.filter(p => !deletedCust.has(p.customerId));
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const deletedExp = new Set(getLocalDeletedIds().expenses);
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}expenses`);
    const list = saved ? JSON.parse(saved) : initialExpenses;
    return list.filter((e: Expense) => !deletedExp.has(e.id));
  });

  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    const deletedComp = new Set(getLocalDeletedIds().complaints);
    const deletedCust = new Set(getLocalDeletedIds().customers);
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}complaints`);
    const list = saved ? dedupeComplaints(JSON.parse(saved)) : initialComplaints;
    return list.filter(c => !deletedComp.has(c.id) && !deletedCust.has(c.customerId));
  });

  // Offline & Sync States
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}last_synced_at`);
  });
  const [pendingMutationsCount, setPendingMutationsCount] = useState<number>(() => getPendingCount());

  // Subscribe to offline mutation queue changes
  useEffect(() => {
    const unsubscribe = subscribeQueue((queue) => {
      setPendingMutationsCount(queue.length);
    });
    return unsubscribe;
  }, []);

  // Reference to current store state so syncWithServer retains a stable callback identity
  // without re-triggering the initial mount synchronization effect.
  const stateRef = useRef({
    customers,
    products,
    orders,
    orderItems,
    payments,
    expenses,
    complaints,
    pricingAgreements,
  });

  useEffect(() => {
    stateRef.current = {
      customers,
      products,
      orders,
      orderItems,
      payments,
      expenses,
      complaints,
      pricingAgreements,
    };
  }, [customers, products, orders, orderItems, payments, expenses, complaints, pricingAgreements]);

  const isSyncingRef = useRef<boolean>(false);

  // Background Bidirectional Offline-First Sync Function
  const syncWithServer = useCallback(async () => {
    if (isSyncingRef.current) {
      return; // Prevent duplicate concurrent sync runs
    }
    try {
      isSyncingRef.current = true;
      setIsSyncing(true);

      // Step 1: Drain any queued offline mutations in FIFO order
      await drainMutationQueue();

      // Step 2: Fetch and merge full server state
      const current = stateRef.current;
      const localDeleted = getLocalDeletedIds();
      const deletedCust = new Set(localDeleted.customers);
      const deletedOrd = new Set(localDeleted.orders);
      const deletedExp = new Set(localDeleted.expenses);
      const deletedComp = new Set(localDeleted.complaints);
      const deletedProd = new Set(localDeleted.products);
      const deletedAgr = new Set(localDeleted.pricingAgreements);

      const data = await syncApi.syncAll({
        customers: current.customers.filter(c => !deletedCust.has(c.id)),
        orders: current.orders.filter(o => !deletedOrd.has(o.id) && !deletedCust.has(o.customerId)),
        orderItems: current.orderItems.filter(i => !deletedOrd.has(i.orderId)),
        payments: current.payments.filter(p => !deletedCust.has(p.customerId) && (!p.orderId || !deletedOrd.has(p.orderId))),
        expenses: current.expenses.filter(e => !deletedExp.has(e.id)),
        complaints: current.complaints.filter(c => !deletedComp.has(c.id) && !deletedCust.has(c.customerId)),
        pricingAgreements: current.pricingAgreements.filter(pa => !deletedAgr.has(pa.id) && !deletedCust.has(pa.customerId) && !deletedProd.has(pa.productId)),
        deletedIds: localDeleted,
      });

      setIsOnline(true);

      if (data && data.deletedIds) {
        mergeRemoteDeletedIds(data.deletedIds);
      }

      const activeDeleted = getLocalDeletedIds();
      const allDeletedCust = new Set(activeDeleted.customers);
      const allDeletedOrd = new Set(activeDeleted.orders);
      const allDeletedExp = new Set(activeDeleted.expenses);
      const allDeletedComp = new Set(activeDeleted.complaints);
      const allDeletedProd = new Set(activeDeleted.products);
      const allDeletedAgr = new Set(activeDeleted.pricingAgreements);

      if (data && data.syncedAt) {
        setLastSyncedAt(data.syncedAt);
        localStorage.setItem(`${STORAGE_KEY_PREFIX}last_synced_at`, data.syncedAt);
      }
      if (data && data.customers && Array.isArray(data.customers)) {
        setCustomers((prev) => {
          const serverClean = data.customers.filter(c => !allDeletedCust.has(c.id));
          const serverIds = new Set(serverClean.map(c => c.id));
          const unSyncedLocal = prev.filter(c => !serverIds.has(c.id) && !allDeletedCust.has(c.id));
          const merged = dedupeCustomers([...serverClean, ...unSyncedLocal]);
          return JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged;
        });
      }
      if (data && data.products && Array.isArray(data.products)) {
        setProducts((prev) => {
          const serverClean = data.products.filter(p => !allDeletedProd.has(p.id));
          return JSON.stringify(prev) === JSON.stringify(serverClean) ? prev : serverClean;
        });
      }
      if (data && data.pricingAgreements && Array.isArray(data.pricingAgreements)) {
        setPricingAgreements((prev) => {
          const serverClean = data.pricingAgreements.filter(pa => !allDeletedAgr.has(pa.id) && !allDeletedCust.has(pa.customerId) && !allDeletedProd.has(pa.productId));
          const serverKeys = new Set(serverClean.map(pa => `${pa.customerId}_${pa.productId}`));
          const unSyncedLocal = prev.filter(pa => !serverKeys.has(`${pa.customerId}_${pa.productId}`) && !allDeletedAgr.has(pa.id) && !allDeletedCust.has(pa.customerId));
          const seen = new Set<string>();
          const combined = [...serverClean, ...unSyncedLocal].filter((pa) => {
            const key = `${pa.customerId}_${pa.productId}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          return JSON.stringify(prev) === JSON.stringify(combined) ? prev : combined;
        });
      }
      if (data && data.orders && Array.isArray(data.orders)) {
        setOrders((prev) => {
          const serverClean = data.orders.filter(o => !allDeletedOrd.has(o.id) && !allDeletedCust.has(o.customerId));
          const serverIds = new Set(serverClean.map(o => o.id));
          const unSyncedLocal = prev.filter(o => !serverIds.has(o.id) && !allDeletedOrd.has(o.id) && !allDeletedCust.has(o.customerId));
          const merged = dedupeOrders([...serverClean, ...unSyncedLocal]);
          return JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged;
        });
      }
      if (data && data.orderItems && Array.isArray(data.orderItems)) {
        setOrderItems((prev) => {
          const serverClean = data.orderItems.filter(i => !allDeletedOrd.has(i.orderId));
          const serverIds = new Set(serverClean.map(i => i.id));
          const unSyncedLocal = prev.filter(i => !serverIds.has(i.id) && !allDeletedOrd.has(i.orderId));
          const seen = new Set<string>();
          const combined = [...serverClean, ...unSyncedLocal].filter((i) => {
            if (seen.has(i.id)) return false;
            seen.add(i.id);
            return true;
          });
          return JSON.stringify(prev) === JSON.stringify(combined) ? prev : combined;
        });
      }
      if (data && data.payments && Array.isArray(data.payments)) {
        setPayments((prev) => {
          const serverClean = data.payments.filter(p => !allDeletedCust.has(p.customerId) && (!p.orderId || !allDeletedOrd.has(p.orderId)));
          const serverIds = new Set(serverClean.map(p => p.id));
          const unSyncedLocal = prev.filter(p => !serverIds.has(p.id) && !allDeletedCust.has(p.customerId));
          const merged = dedupePayments([...serverClean, ...unSyncedLocal]);
          return JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged;
        });
      }
      if (data && data.expenses && Array.isArray(data.expenses)) {
        setExpenses((prev) => {
          const serverClean = data.expenses.filter(e => !allDeletedExp.has(e.id));
          const serverIds = new Set(serverClean.map(e => e.id));
          const unSyncedLocal = prev.filter(e => !serverIds.has(e.id) && !allDeletedExp.has(e.id));
          const seen = new Set<string>();
          const combined = [...serverClean, ...unSyncedLocal].filter((e) => {
            if (seen.has(e.id)) return false;
            seen.add(e.id);
            return true;
          });
          return JSON.stringify(prev) === JSON.stringify(combined) ? prev : combined;
        });
      }
      if (data && data.complaints && Array.isArray(data.complaints)) {
        setComplaints((prev) => {
          const serverClean = data.complaints.filter(c => !allDeletedComp.has(c.id) && !allDeletedCust.has(c.customerId));
          const serverIds = new Set(serverClean.map(c => c.id));
          const unSyncedLocal = prev.filter(c => !serverIds.has(c.id) && !allDeletedComp.has(c.id) && !allDeletedCust.has(c.customerId));
          const merged = dedupeComplaints([...serverClean, ...unSyncedLocal]);
          return JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged;
        });
      }
    } catch (err: any) {
      // If network error occurred, mark offline status
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOnline(false);
      }
      console.warn('[Offline Sync] Backend temporarily unreachable, working in local offline mode:', err);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  // Recurring background synchronization & lifecycle event listeners (cross-device real-time sync)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      drainMutationQueue().then(() => syncWithServer()).catch(() => {});
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        drainMutationQueue().then(() => syncWithServer()).catch(() => {});
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    // If service worker updates in background, re-sync immediately
    const handleControllerChange = () => {
      syncWithServer();
    };
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    }

    // Start auto queue drainer (runs every 5s)
    const stopDrainer = startAutoDrain(5000);

    // Immediate sync on mount
    syncWithServer();

    // Periodic background sync loop every 5s to fetch updates made on other devices (phone, laptop, etc.)
    const recurringSyncInterval = setInterval(() => {
      syncWithServer();
    }, 5000);

    return () => {
      stopDrainer();
      clearInterval(recurringSyncInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      }
    };
  }, [syncWithServer]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}customers`, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}pricing_agreements`, JSON.stringify(pricingAgreements));
  }, [pricingAgreements]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}products`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}orders`, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}order_items`, JSON.stringify(orderItems));
  }, [orderItems]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}payments`, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}expenses`, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}complaints`, JSON.stringify(complaints));
  }, [complaints]);

  // Helpers
  const getOrderItems = (orderId: string): OrderItem[] => {
    return orderItems.filter(item => item.orderId === orderId);
  };

  const getOrderPayments = (orderId: string): Payment[] => {
    return payments.filter(p => p.orderId === orderId);
  };

  const getOrderPaidAmount = (orderId: string): number => {
    return payments
      .filter(p => p.orderId === orderId && p.verificationStatus === 'VERIFIED')
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const getOrderOutstandingAmount = (orderId: string): number => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === 'CANCELLED') return 0;
    const paid = getOrderPaidAmount(orderId);
    return Math.max(0, order.totalAmount - paid);
  };

  const getCustomerAgreedPrice = (customerId: string, productId: string) => {
    const agreement = pricingAgreements.find(
      pa => pa.customerId === customerId && pa.productId === productId && pa.isActive
    );
    const product = products.find(p => p.id === productId);
    const basePrice = product ? product.basePrice : 0;

    if (agreement) {
      return {
        price: agreement.agreedPrice,
        isAgreed: true,
        agreement
      };
    }
    return {
      price: basePrice,
      isAgreed: false
    };
  };

  const getCustomerBalance = (customerId: string) => {
    const customerOrders = orders.filter(o => o.customerId === customerId && o.status !== 'CANCELLED');
    const customerOrderIds = new Set(customerOrders.map(o => o.id));
    const totalInvoiced = customerOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const customerPayments = payments.filter(
      p => (p.customerId === customerId || (p.orderId && customerOrderIds.has(p.orderId))) &&
           p.verificationStatus === 'VERIFIED'
    );
    const totalPaid = customerPayments.reduce((sum, p) => sum + p.amount, 0);

    const outstandingBalance = Math.max(0, totalInvoiced - totalPaid);

    return {
      totalInvoiced,
      totalPaid,
      outstandingBalance
    };
  };

  const getCustomerStatement = (customerId: string): CustomerStatementEntry[] => {
    const customerOrders = orders
      .filter(o => o.customerId === customerId && o.status !== 'CANCELLED');
    const customerOrderIds = new Set(customerOrders.map(o => o.id));

    const orderEntries = customerOrders.map(o => ({
      date: o.orderDate,
      type: 'ORDER' as const,
      referenceId: o.orderNumber,
      description: `Order ${o.orderNumber} (${o.deliveryType === 'DELIVERY' ? 'Delivery' : 'Pickup'})`,
      debit: o.totalAmount,
      credit: 0,
      runningBalance: 0,
      status: o.status
    }));

    const customerPayments = payments
      .filter(p => (p.customerId === customerId || (p.orderId && customerOrderIds.has(p.orderId))));

    const paymentEntries = customerPayments.map(p => ({
      date: p.paymentDate,
      type: 'PAYMENT' as const,
      referenceId: p.receiptNumber,
      description: `Payment ${p.receiptNumber} (${p.paymentMethod}${p.transactionReference ? ` - ${p.transactionReference}` : ''})`,
      debit: 0,
      credit: p.verificationStatus === 'VERIFIED' ? p.amount : 0,
      runningBalance: 0,
      status: p.verificationStatus
    }));

    // Sort chronologically ascending
    const combined = [...orderEntries, ...paymentEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Compute running balance
    let balance = 0;
    return combined.map(entry => {
      balance = balance + entry.debit - entry.credit;
      return {
        ...entry,
        runningBalance: Math.max(0, balance)
      };
    });
  };

  // Actions
  const createOrder = (orderData: {
    customerId: string;
    deliveryType: DeliveryType;
    deliveryAddress?: string;
    scheduledTime?: string;
    driverName?: string;
    deliveryNotes?: string;
    notes?: string;
    items: { productId: string; quantity: number; unitPrice?: number }[];
    initialPayment?: {
      amount: number;
      paymentMethod: PaymentMethod;
      transactionReference?: string;
      isVerified?: boolean;
    };
  }): Order => {
    const customer = customers.find(c => c.id === orderData.customerId);
    if (!customer) throw new Error('Customer not found');

    const nowIso = new Date().toISOString();
    const dateStr = nowIso.slice(0, 10).replace(/-/g, '');
    const randSeq = Math.floor(1000 + Math.random() * 9000);
    const nextOrderNum = `ORD-${dateStr}-${randSeq}`;
    const newOrderId = `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    // Build items with historical frozen unit prices
    let calculatedTotal = 0;
    const newItems: OrderItem[] = orderData.items.map((item, index) => {
      const prod = products.find(p => p.id === item.productId);
      const agreed = getCustomerAgreedPrice(customer.id, item.productId);
      const unitPrice = item.unitPrice !== undefined ? item.unitPrice : agreed.price;
      const subtotal = item.quantity * unitPrice;
      calculatedTotal += subtotal;

      return {
        id: `item-${Date.now().toString(36)}-${index}`,
        orderId: newOrderId,
        productId: item.productId,
        productNameEn: prod?.nameEn || 'Bread',
        productNameAm: prod?.nameAm || 'ዳቦ',
        quantity: item.quantity,
        unitPrice,
        subtotal
      };
    });

    const newOrder: Order = {
      id: newOrderId,
      orderNumber: nextOrderNum,
      customerId: customer.id,
      customerName: customer.name,
      organizationName: customer.organizationName,
      branch: customer.branch,
      customerPhone: customer.phone,
      orderSource: 'PHONE', // Fast default for phone taking
      status: 'CONFIRMED',
      orderDate: nowIso,
      totalAmount: calculatedTotal,
      deliveryType: orderData.deliveryType,
      deliveryAddress: orderData.deliveryAddress || customer.address,
      scheduledTime: orderData.scheduledTime || customer.preferredDeliveryTime || 'As soon as possible',
      driverName: orderData.driverName,
      deliveryNotes: orderData.deliveryNotes,
      notes: orderData.notes,
      createdBy: 'Bakery Staff',
      updatedAt: nowIso
    };

    setOrders(prev => dedupeOrders([newOrder, ...prev]));
    setOrderItems(prev => [...prev, ...newItems]);

    // Enqueue order mutation
    enqueueMutation({
      endpoint: '/api/orders',
      method: 'POST',
      body: {
        id: newOrderId,
        orderNumber: nextOrderNum,
        customerId: customer.id,
        customerName: customer.name,
        organizationName: customer.organizationName,
        branch: customer.branch,
        customerPhone: customer.phone,
        orderSource: 'PHONE',
        orderDate: nowIso,
        deliveryType: orderData.deliveryType,
        deliveryAddress: orderData.deliveryAddress || customer.address,
        scheduledTime: orderData.scheduledTime || customer.preferredDeliveryTime,
        notes: orderData.notes,
        createdBy: 'Bakery Staff',
        items: newItems.map((it) => ({
          id: it.id,
          productId: it.productId,
          productNameEn: it.productNameEn,
          productNameAm: it.productNameAm,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          subtotal: it.subtotal,
        })),
      },
      description: `Order ${nextOrderNum} (${customer.organizationName})`,
    });

    // If initial payment was made
    if (orderData.initialPayment && orderData.initialPayment.amount > 0) {
      const isVerified = orderData.initialPayment.isVerified ?? 
        (orderData.initialPayment.paymentMethod === 'CASH');
      const payRand = Math.floor(1000 + Math.random() * 9000);

      const payment: Payment = {
        id: `pay-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        receiptNumber: `RCT-${dateStr}-${payRand}`,
        orderId: newOrderId,
        customerId: customer.id,
        customerName: `${customer.organizationName} (${customer.name})`,
        amount: orderData.initialPayment.amount,
        paymentMethod: orderData.initialPayment.paymentMethod,
        transactionReference: orderData.initialPayment.transactionReference,
        verificationStatus: isVerified ? 'VERIFIED' : 'PENDING_VERIFICATION',
        verifiedBy: isVerified ? 'Bakery Staff' : undefined,
        verifiedAt: isVerified ? nowIso : undefined,
        paymentDate: nowIso,
        recordedBy: 'Bakery Staff',
        notes: `Initial payment at order entry.`
      };
      setPayments(prev => [payment, ...prev]);

      enqueueMutation({
        endpoint: '/api/payments',
        method: 'POST',
        body: {
          id: payment.id,
          receiptNumber: payment.receiptNumber,
          customerId: customer.id,
          customerName: `${customer.organizationName} (${customer.name})`,
          orderId: newOrderId,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          transactionReference: payment.transactionReference,
          paymentDate: nowIso,
          recordedBy: payment.recordedBy,
          notes: payment.notes,
          verificationStatus: payment.verificationStatus,
        },
        description: `Initial payment ${payment.receiptNumber} (${payment.amount} ETB)`,
      });
    }

    // Flush immediately and synchronize state with server
    drainMutationQueue().then(() => syncWithServer()).catch(() => {});

    return newOrder;
  };

  const repeatOrder = (previousOrderId: string): Order => {
    const prevOrder = orders.find(o => o.id === previousOrderId);
    if (!prevOrder) throw new Error('Previous order not found');

    const prevItems = getOrderItems(previousOrderId);

    // Creates a fresh new order using current agreed prices for the customer
    return createOrder({
      customerId: prevOrder.customerId,
      deliveryType: prevOrder.deliveryType,
      deliveryAddress: prevOrder.deliveryAddress,
      scheduledTime: prevOrder.scheduledTime,
      notes: `Repeat order derived from ${prevOrder.orderNumber}`,
      items: prevItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    });
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, actualDeliveryTime?: string) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status,
            actualDeliveryTime: actualDeliveryTime || o.actualDeliveryTime,
            updatedAt: new Date().toISOString()
          };
        }
        return o;
      })
    );

    enqueueMutation({
      endpoint: `/api/orders/${orderId}/status`,
      method: 'PATCH',
      body: {
        status,
        actualDeliveryTime: actualDeliveryTime || undefined,
      },
      description: `Order ${orderId} -> ${status}`,
    });

    drainMutationQueue().then(() => syncWithServer()).catch(() => {});
  };

  const updateOrder = (
    orderId: string,
    orderData: {
      deliveryType?: DeliveryType;
      deliveryAddress?: string;
      scheduledTime?: string;
      driverName?: string;
      deliveryNotes?: string;
      notes?: string;
      status?: OrderStatus;
      items?: { productId: string; quantity: number; unitPrice?: number }[];
    }
  ) => {
    const nowIso = new Date().toISOString();
    let updatedTotal: number | undefined = undefined;
    let newItemsList: OrderItem[] | undefined = undefined;

    if (orderData.items && Array.isArray(orderData.items)) {
      let total = 0;
      newItemsList = orderData.items.map((it, idx) => {
        const prod = products.find(p => p.id === it.productId);
        const unitPrice = it.unitPrice !== undefined ? it.unitPrice : (prod?.basePrice || 0);
        const subtotal = it.quantity * unitPrice;
        total += subtotal;
        return {
          id: `item-${Date.now().toString(36)}-${idx}`,
          orderId,
          productId: it.productId,
          productNameEn: prod?.nameEn || 'Bread',
          productNameAm: prod?.nameAm || 'ዳቦ',
          quantity: it.quantity,
          unitPrice,
          subtotal,
        };
      });
      updatedTotal = total;

      setOrderItems(prev => [
        ...prev.filter(it => it.orderId !== orderId),
        ...newItemsList!,
      ]);
    }

    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            deliveryType: orderData.deliveryType !== undefined ? orderData.deliveryType : o.deliveryType,
            deliveryAddress: orderData.deliveryAddress !== undefined ? orderData.deliveryAddress : o.deliveryAddress,
            scheduledTime: orderData.scheduledTime !== undefined ? orderData.scheduledTime : o.scheduledTime,
            driverName: orderData.driverName !== undefined ? orderData.driverName : o.driverName,
            deliveryNotes: orderData.deliveryNotes !== undefined ? orderData.deliveryNotes : o.deliveryNotes,
            notes: orderData.notes !== undefined ? orderData.notes : o.notes,
            status: orderData.status !== undefined ? orderData.status : o.status,
            totalAmount: updatedTotal !== undefined ? updatedTotal : o.totalAmount,
            updatedAt: nowIso,
          };
        }
        return o;
      })
    );

    enqueueMutation({
      endpoint: `/api/orders/${orderId}`,
      method: 'PUT',
      body: {
        ...orderData,
        items: newItemsList,
      },
      description: `Edit order ${orderId}`,
    });

    drainMutationQueue().then(() => syncWithServer()).catch(() => {});
  };

  const deleteOrder = (orderId: string) => {
    recordLocalDeletedId('orders', orderId);
    stateRef.current.orders = stateRef.current.orders.filter(o => o.id !== orderId);
    stateRef.current.orderItems = stateRef.current.orderItems.filter(it => it.orderId !== orderId);

    setOrders(prev => {
      const next = prev.filter(o => o.id !== orderId);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}orders`, JSON.stringify(next));
      return next;
    });
    setOrderItems(prev => {
      const next = prev.filter(it => it.orderId !== orderId);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}order_items`, JSON.stringify(next));
      return next;
    });
    setPayments(prev => {
      const next = prev.filter(p => p.orderId !== orderId);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}payments`, JSON.stringify(next));
      return next;
    });

    enqueueMutation({
      endpoint: `/api/orders/${orderId}`,
      method: 'DELETE',
      description: `Delete order ${orderId}`,
    });

    drainMutationQueue().then(() => syncWithServer()).catch(() => {});
  };

  const recordPayment = (paymentData: {
    orderId: string;
    customerId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    transactionReference?: string;
    notes?: string;
    isVerified?: boolean;
    recordedBy?: string;
  }): Payment => {
    const customer = customers.find(c => c.id === paymentData.customerId);
    const nowIso = new Date().toISOString();
    const dateStr = nowIso.slice(0, 10).replace(/-/g, '');
    const randSeq = Math.floor(1000 + Math.random() * 9000);
    const isCash = paymentData.paymentMethod === 'CASH';
    const isVerified = paymentData.isVerified ?? isCash;

    const newPayment: Payment = {
      id: `pay-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      receiptNumber: `RCT-${dateStr}-${randSeq}`,
      orderId: paymentData.orderId,
      customerId: paymentData.customerId,
      customerName: customer ? `${customer.organizationName} (${customer.name})` : 'Customer',
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      transactionReference: paymentData.transactionReference,
      verificationStatus: isVerified ? 'VERIFIED' : 'PENDING_VERIFICATION',
      verifiedBy: isVerified ? (paymentData.recordedBy || 'Bakery Staff') : undefined,
      verifiedAt: isVerified ? nowIso : undefined,
      paymentDate: nowIso,
      notes: paymentData.notes,
      recordedBy: paymentData.recordedBy || 'Bakery Staff'
    };

    setPayments(prev => dedupePayments([newPayment, ...prev]));

    enqueueMutation({
      endpoint: '/api/payments',
      method: 'POST',
      body: {
        id: newPayment.id,
        receiptNumber: newPayment.receiptNumber,
        customerId: paymentData.customerId,
        customerName: newPayment.customerName,
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        transactionReference: paymentData.transactionReference,
        paymentDate: nowIso,
        recordedBy: newPayment.recordedBy,
        notes: paymentData.notes,
        verificationStatus: newPayment.verificationStatus,
      },
      description: `Payment ${newPayment.receiptNumber} (${newPayment.amount} ETB via ${newPayment.paymentMethod})`,
    });

    // Flush immediately and synchronize state with server
    drainMutationQueue().then(() => syncWithServer()).catch(() => {});

    return newPayment;
  };

  const verifyPayment = (paymentId: string, verifiedBy: string) => {
    const nowIso = new Date().toISOString();
    setPayments(prev =>
      prev.map(p => {
        if (p.id === paymentId) {
          return {
            ...p,
            verificationStatus: 'VERIFIED',
            verifiedBy,
            verifiedAt: nowIso
          };
        }
        return p;
      })
    );

    enqueueMutation({
      endpoint: `/api/payments/${paymentId}/verify`,
      method: 'PATCH',
      body: { verifiedBy },
      description: `Verify payment ${paymentId}`,
    });

    drainMutationQueue().then(() => syncWithServer()).catch(() => {});
  };

  const rejectPayment = (paymentId: string) => {
    setPayments(prev =>
      prev.map(p => {
        if (p.id === paymentId) {
          return {
            ...p,
            verificationStatus: 'REJECTED'
          };
        }
        return p;
      })
    );

    enqueueMutation({
      endpoint: `/api/payments/${paymentId}/reject`,
      method: 'PATCH',
      body: { reason: 'Payment rejected by staff audit' },
      description: `Reject payment ${paymentId}`,
    });

    drainMutationQueue().then(() => syncWithServer()).catch(() => {});
  };

  const recordExpense = (expenseData: Omit<Expense, 'id' | 'date'> & { date?: string }): Expense => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      date: expenseData.date || new Date().toISOString()
    };
    setExpenses(prev => [newExpense, ...prev]);

    enqueueMutation({
      endpoint: '/api/expenses',
      method: 'POST',
      body: {
        id: newExpense.id,
        date: newExpense.date,
        amount: newExpense.amount,
        category: newExpense.category,
        description: newExpense.description,
        paymentMethod: newExpense.paymentMethod,
        referenceNumber: newExpense.referenceNumber,
        recordedBy: newExpense.recordedBy || 'Staff',
        notes: newExpense.notes,
        expensePeriod: newExpense.expensePeriod,
        unit: newExpense.unit,
        quantity: newExpense.quantity,
        unitPrice: newExpense.unitPrice,
      },
      description: `Expense ${newExpense.amount} ETB (${newExpense.category})`,
    });

    // Flush immediately and synchronize state with server
    drainMutationQueue().then(() => syncWithServer()).catch(() => {});

    return newExpense;
  };

  const updateExpense = (id: string, expenseData: Partial<Expense>) => {
    setExpenses(prev =>
      prev.map(e => (e.id === id ? { ...e, ...expenseData } : e))
    );

    enqueueMutation({
      endpoint: `/api/expenses/${id}`,
      method: 'PUT',
      body: expenseData,
      description: `Edit expense ${id}`,
    });

    drainMutationQueue().then(() => syncWithServer()).catch(() => {});
  };

  const deleteExpense = (id: string) => {
    recordLocalDeletedId('expenses', id);
    stateRef.current.expenses = stateRef.current.expenses.filter(e => e.id !== id);

    setExpenses(prev => {
      const next = prev.filter(e => e.id !== id);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}expenses`, JSON.stringify(next));
      return next;
    });

    enqueueMutation({
      endpoint: `/api/expenses/${id}`,
      method: 'DELETE',
      description: `Delete expense ${id}`,
    });

    drainMutationQueue().then(() => syncWithServer()).catch(() => {});
  };

  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer => {
    const nowIso = new Date().toISOString();
    const cleanOrg = (customerData.organizationName || customerData.name || '').trim().toLowerCase();
    const cleanPhone = (customerData.phone || '').trim();

    // Prevent local duplicate ONLY if a real phone (at least 6 digits) and organization are present
    if (cleanPhone && cleanPhone !== '-' && cleanPhone.length >= 6 && cleanOrg) {
      const existing = customers.find(
        (c) => (c.phone || '').trim() === cleanPhone && (c.organizationName || '').trim().toLowerCase() === cleanOrg
      );
      if (existing) {
        return existing;
      }
    }

    const orgDisplayName = (customerData.organizationName || customerData.name || 'Customer').trim();
    const personName = (customerData.name || customerData.organizationName || orgDisplayName).trim();

    const normalizedData = {
      ...customerData,
      organizationName: orgDisplayName,
      name: personName,
      phone: cleanPhone || '-',
      address: (customerData.address || '').trim() || '-',
      customerType: customerData.customerType || 'BURGER_HOUSE',
    };

    const newCustomer: Customer = {
      ...normalizedData,
      id: `cust-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: nowIso,
      updatedAt: nowIso
    };
    setCustomers(prev => dedupeCustomers([...prev, newCustomer]));

    enqueueMutation({
      endpoint: '/api/customers',
      method: 'POST',
      body: {
        ...normalizedData,
        id: newCustomer.id,
      },
      description: `Customer ${orgDisplayName}`,
    });

    // Flush immediately and synchronize state with server
    drainMutationQueue().then(() => syncWithServer()).catch(() => {});

    return newCustomer;
  };

  const updateCustomer = (id: string, customerData: Partial<Customer>) => {
    setCustomers(prev =>
      prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            ...customerData,
            updatedAt: new Date().toISOString()
          };
        }
        return c;
      })
    );

    enqueueMutation({
      endpoint: `/api/customers/${id}`,
      method: 'PUT',
      body: customerData,
      description: `Update customer ${id}`,
    });

    drainMutationQueue().then(() => syncWithServer()).catch(() => {});
  };

  const deleteCustomer = (id: string) => {
    // 1. Mark customer as permanently deleted locally
    recordLocalDeletedId('customers', id);

    // 2. Synchronously purge from stateRef so subsequent syncWithServer never pushes this customer
    stateRef.current.customers = stateRef.current.customers.filter(c => c.id !== id);
    stateRef.current.pricingAgreements = stateRef.current.pricingAgreements.filter(pa => pa.customerId !== id);
    stateRef.current.complaints = stateRef.current.complaints.filter(c => c.customerId !== id);

    // 3. Update React states & localStorage
    setCustomers(prev => {
      const next = prev.filter(c => c.id !== id);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}customers`, JSON.stringify(next));
      return next;
    });
    setPricingAgreements(prev => {
      const next = prev.filter(pa => pa.customerId !== id);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}pricing_agreements`, JSON.stringify(next));
      return next;
    });
    setComplaints(prev => {
      const next = prev.filter(c => c.customerId !== id);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}complaints`, JSON.stringify(next));
      return next;
    });

    enqueueMutation({
      endpoint: `/api/customers/${id}`,
      method: 'DELETE',
      description: `Delete customer ${id}`,
    });

    drainMutationQueue().then(() => syncWithServer()).catch(() => {});
  };

  const setCustomerPricingAgreement = (
    customerId: string,
    productId: string,
    agreedPrice: number,
    notes?: string
  ) => {
    const nowIso = new Date().toISOString();
    let agreementId = `cpa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    setPricingAgreements(prev => {
      const existingIndex = prev.findIndex(
        pa => pa.customerId === customerId && pa.productId === productId
      );
      if (existingIndex >= 0) {
        agreementId = prev[existingIndex].id;
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          agreedPrice,
          isActive: true,
          notes: notes || updated[existingIndex].notes,
          effectiveDate: nowIso
        };
        return updated;
      } else {
        const newAgreement: CustomerPricingAgreement = {
          id: agreementId,
          customerId,
          productId,
          agreedPrice,
          effectiveDate: nowIso,
          isActive: true,
          notes
        };
        return [...prev, newAgreement];
      }
    });

    enqueueMutation({
      endpoint: '/api/pricing-agreements',
      method: 'POST',
      body: { id: agreementId, customerId, productId, agreedPrice, notes },
      description: `Agreed price ${agreedPrice} ETB for customer ${customerId}`,
    });

    drainMutationQueue().then(() => syncWithServer()).catch(() => {});
  };

  const deletePricingAgreement = (id: string) => {
    recordLocalDeletedId('pricingAgreements', id);
    stateRef.current.pricingAgreements = stateRef.current.pricingAgreements.filter(pa => pa.id !== id);

    setPricingAgreements(prev => {
      const next = prev.filter(pa => pa.id !== id);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}pricing_agreements`, JSON.stringify(next));
      return next;
    });

    enqueueMutation({
      endpoint: `/api/pricing-agreements/${id}`,
      method: 'DELETE',
      description: `Delete pricing agreement ${id}`,
    });

    drainMutationQueue().then(() => syncWithServer()).catch(() => {});
  };

  const addProduct = (productData: Omit<Product, 'id' | 'createdAt'>): Product => {
    const nowIso = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: nowIso,
    };

    setProducts(prev => [...prev, newProduct]);

    enqueueMutation({
      endpoint: '/api/products',
      method: 'POST',
      body: newProduct,
      description: `Create product ${newProduct.nameEn}`,
    });

    drainMutationQueue().then(() => syncWithServer()).catch(() => {});

    return newProduct;
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            ...productData,
          };
        }
        return p;
      })
    );

    enqueueMutation({
      endpoint: `/api/products/${id}`,
      method: 'PUT',
      body: productData,
      description: `Update product ${id}`,
    });

    drainMutationQueue().then(() => syncWithServer()).catch(() => {});
  };

  const deleteProduct = (id: string) => {
    recordLocalDeletedId('products', id);
    stateRef.current.products = stateRef.current.products.filter(p => p.id !== id);
    stateRef.current.pricingAgreements = stateRef.current.pricingAgreements.filter(pa => pa.productId !== id);

    setProducts(prev => {
      const next = prev.filter(p => p.id !== id);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}products`, JSON.stringify(next));
      return next;
    });
    setPricingAgreements(prev => {
      const next = prev.filter(pa => pa.productId !== id);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}pricing_agreements`, JSON.stringify(next));
      return next;
    });

    enqueueMutation({
      endpoint: `/api/products/${id}`,
      method: 'DELETE',
      description: `Delete product ${id}`,
    });

    drainMutationQueue().then(() => syncWithServer()).catch(() => {});
  };

  const fileComplaint = (complaintData: {
    customerId: string;
    orderId?: string;
    productId?: string;
    category: Complaint['category'];
    description: string;
    quantityAffected?: number;
    priority: ComplaintPriority;
  }): Complaint => {
    const customer = customers.find(c => c.id === complaintData.customerId);
    const order = orders.find(o => o.id === complaintData.orderId);
    const prod = products.find(p => p.id === complaintData.productId);

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSeq = Math.floor(100 + Math.random() * 900);

    const newComplaint: Complaint = {
      id: `comp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      complaintNumber: `CMP-${dateStr}-${randSeq}`,
      customerId: complaintData.customerId,
      customerName: customer ? customer.organizationName : 'Customer',
      orderId: complaintData.orderId,
      orderNumber: order?.orderNumber,
      productId: complaintData.productId,
      productName: prod ? `${prod.nameEn} (${prod.nameAm})` : undefined,
      category: complaintData.category,
      description: complaintData.description,
      quantityAffected: complaintData.quantityAffected,
      priority: complaintData.priority,
      status: 'OPEN',
      createdAt: new Date().toISOString()
    };

    setComplaints(prev => dedupeComplaints([newComplaint, ...prev]));

    enqueueMutation({
      endpoint: '/api/complaints',
      method: 'POST',
      body: {
        id: newComplaint.id,
        complaintNumber: newComplaint.complaintNumber,
        customerId: complaintData.customerId,
        customerName: newComplaint.customerName,
        orderId: complaintData.orderId,
        orderNumber: newComplaint.orderNumber,
        productId: complaintData.productId,
        productName: newComplaint.productName,
        category: complaintData.category,
        description: complaintData.description,
        quantityAffected: complaintData.quantityAffected,
        priority: complaintData.priority,
      },
      description: `Complaint ${newComplaint.complaintNumber} (${newComplaint.category})`,
    });

    // Flush immediately and synchronize state with server
    drainMutationQueue().then(() => syncWithServer()).catch(() => {});

    return newComplaint;
  };

  const resolveComplaint = (
    complaintId: string,
    resolutionType: ResolutionType,
    resolutionNotes: string,
    resolvedBy: string
  ) => {
    const nowIso = new Date().toISOString();
    setComplaints(prev =>
      prev.map(c => {
        if (c.id === complaintId) {
          return {
            ...c,
            status: 'RESOLVED',
            resolutionType,
            resolutionNotes,
            resolvedBy,
            resolvedAt: nowIso
          };
        }
        return c;
      })
    );

    enqueueMutation({
      endpoint: `/api/complaints/${complaintId}/resolve`,
      method: 'PATCH',
      body: {
        status: 'RESOLVED',
        resolutionType,
        resolutionNotes,
        resolvedBy,
      },
      description: `Resolve complaint ${complaintId}`,
    });

    drainMutationQueue().then(() => syncWithServer()).catch(() => {});
  };

  const updateComplaintStatus = (complaintId: string, status: ComplaintStatus) => {
    setComplaints(prev =>
      prev.map(c => {
        if (c.id === complaintId) {
          return { ...c, status };
        }
        return c;
      })
    );
  };

  const updateComplaint = (id: string, complaintData: Partial<Complaint>) => {
    setComplaints(prev =>
      prev.map(c => (c.id === id ? { ...c, ...complaintData } : c))
    );

    enqueueMutation({
      endpoint: `/api/complaints/${id}`,
      method: 'PUT',
      body: complaintData,
      description: `Edit complaint ${id}`,
    });

    drainMutationQueue().then(() => syncWithServer()).catch(() => {});
  };

  const deleteComplaint = (id: string) => {
    recordLocalDeletedId('complaints', id);
    stateRef.current.complaints = stateRef.current.complaints.filter(c => c.id !== id);

    setComplaints(prev => {
      const next = prev.filter(c => c.id !== id);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}complaints`, JSON.stringify(next));
      return next;
    });

    enqueueMutation({
      endpoint: `/api/complaints/${id}`,
      method: 'DELETE',
      description: `Delete complaint ${id}`,
    });

    drainMutationQueue().then(() => syncWithServer()).catch(() => {});
  };

  const resetToInitialData = () => {
    setCustomers(initialCustomers);
    setPricingAgreements(initialPricingAgreements);
    setProducts(initialProducts);
    setOrders(initialOrders);
    setOrderItems(initialOrderItems);
    setPayments(initialPayments);
    setExpenses(initialExpenses);
    setComplaints(initialComplaints);
    localStorage.clear();
  };

  // Operational metrics dynamically matching real local day
  const todayYMD = new Date().toISOString().slice(0, 10);

  const todaySales = useMemo(() => {
    return orders
      .filter(o => o.orderDate.startsWith(todayYMD) && o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orders]);

  const todayCollections = useMemo(() => {
    const todayVerifiedPayments = payments.filter(
      p => p.paymentDate.startsWith(todayYMD) && p.verificationStatus === 'VERIFIED'
    );

    let cash = 0;
    let telebirr = 0;
    let bankTransfer = 0;

    todayVerifiedPayments.forEach(p => {
      if (p.paymentMethod === 'CASH') cash += p.amount;
      else if (p.paymentMethod === 'TELEBIRR') telebirr += p.amount;
      else if (p.paymentMethod === 'BANK_TRANSFER') bankTransfer += p.amount;
    });

    return {
      cash,
      telebirr,
      bankTransfer,
      total: cash + telebirr + bankTransfer
    };
  }, [payments]);

  const todayExpensesTotal = useMemo(() => {
    return expenses
      .filter(e => e.date.startsWith(todayYMD))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const totalOutstandingDebt = useMemo(() => {
    // Sum of all customers' calculated outstanding debt for complete consistency with Debt Ledger
    return customers.reduce((sum, c) => {
      const bal = getCustomerBalance(c.id);
      return sum + bal.outstandingBalance;
    }, 0);
  }, [customers, orders, payments]);

  const pendingVerificationCount = useMemo(() => {
    return payments.filter(p => p.verificationStatus === 'PENDING_VERIFICATION').length;
  }, [payments]);

  const openComplaintsCount = useMemo(() => {
    return complaints.filter(c => c.status === 'OPEN' || c.status === 'UNDER_REVIEW').length;
  }, [complaints]);

  const activeDeliveriesCount = useMemo(() => {
    return orders.filter(
      o => o.deliveryType === 'DELIVERY' && 
      (o.status === 'PREPARING' || o.status === 'READY' || o.status === 'OUT_FOR_DELIVERY')
    ).length;
  }, [orders]);

  return (
    <BakeryStoreContext.Provider
      value={{
        customers,
        pricingAgreements,
        products,
        orders,
        orderItems,
        payments,
        expenses,
        complaints,
        createOrder,
        repeatOrder,
        updateOrderStatus,
        recordPayment,
        verifyPayment,
        rejectPayment,
        recordExpense,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addProduct,
        updateProduct,
        deleteProduct,
        updateOrder,
        deleteOrder,
        updateExpense,
        deleteExpense,
        setCustomerPricingAgreement,
        deletePricingAgreement,
        fileComplaint,
        resolveComplaint,
        updateComplaint,
        deleteComplaint,
        updateComplaintStatus,
        getOrderItems,
        getOrderPayments,
        getOrderPaidAmount,
        getOrderOutstandingAmount,
        getCustomerAgreedPrice,
        getCustomerBalance,
        getCustomerStatement,
        todaySales,
        todayCollections,
        todayExpensesTotal,
        totalOutstandingDebt,
        pendingVerificationCount,
        openComplaintsCount,
        activeDeliveriesCount,
        resetToInitialData,
        isOnline,
        isSyncing,
        lastSyncedAt,
        syncWithServer,
        pendingMutationsCount
      }}
    >
      {children}
    </BakeryStoreContext.Provider>
  );
};

export const useBakeryStore = (): BakeryStoreContextType => {
  const context = useContext(BakeryStoreContext);
  if (!context) {
    throw new Error('useBakeryStore must be used within a BakeryStoreProvider');
  }
  return context;
};
