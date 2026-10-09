/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { enqueueMutation, drainMutationQueue, subscribeQueue, getPendingCount } from '../services/offlineQueue.ts';
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

  setCustomerPricingAgreement: (
    customerId: string,
    productId: string,
    agreedPrice: number,
    notes?: string
  ) => void;

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

const STORAGE_KEY_PREFIX = 'bakery_v1_';

export const BakeryStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}customers`);
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [pricingAgreements, setPricingAgreements] = useState<CustomerPricingAgreement[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}pricing_agreements`);
    return saved ? JSON.parse(saved) : initialPricingAgreements;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}products`);
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}orders`);
    return saved ? JSON.parse(saved) : initialOrders;
  });

  const [orderItems, setOrderItems] = useState<OrderItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}order_items`);
    return saved ? JSON.parse(saved) : initialOrderItems;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}payments`);
    return saved ? JSON.parse(saved) : initialPayments;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}expenses`);
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}complaints`);
    return saved ? JSON.parse(saved) : initialComplaints;
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

  // Background Bidirectional Offline-First Sync Function
  const syncWithServer = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }
    try {
      setIsSyncing(true);

      // Step 1: Drain any queued offline mutations in FIFO order
      await drainMutationQueue();

      // Step 2: Fetch and merge full server state
      const data = await syncApi.syncAll({
        customers,
        orders,
        orderItems,
        payments,
        expenses,
        complaints,
        pricingAgreements,
      });

      if (data && data.syncedAt) {
        setLastSyncedAt(data.syncedAt);
        localStorage.setItem(`${STORAGE_KEY_PREFIX}last_synced_at`, data.syncedAt);
      }
      if (data && data.customers && Array.isArray(data.customers)) setCustomers(data.customers);
      if (data && data.products && Array.isArray(data.products)) setProducts(data.products);
      if (data && data.pricingAgreements && Array.isArray(data.pricingAgreements)) setPricingAgreements(data.pricingAgreements);
      if (data && data.orders && Array.isArray(data.orders)) setOrders(data.orders);
      if (data && data.orderItems && Array.isArray(data.orderItems)) setOrderItems(data.orderItems);
      if (data && data.payments && Array.isArray(data.payments)) setPayments(data.payments);
      if (data && data.expenses && Array.isArray(data.expenses)) setExpenses(data.expenses);
      if (data && data.complaints && Array.isArray(data.complaints)) setComplaints(data.complaints);
    } catch (err) {
      // Graceful offline fallback: logs warning without interrupting user workflow
      console.warn('[Offline Sync] Backend temporarily unreachable, working in local offline mode:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [customers, orders, orderItems, payments, expenses, complaints, pricingAgreements]);

  // Network Connectivity Event Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncWithServer();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial background synchronization attempt
    const timer = setTimeout(() => {
      syncWithServer();
    }, 500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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
    const totalInvoiced = customerOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const customerPayments = payments.filter(
      p => p.customerId === customerId && p.verificationStatus === 'VERIFIED'
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
      .filter(o => o.customerId === customerId && o.status !== 'CANCELLED')
      .map(o => ({
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
      .filter(p => p.customerId === customerId)
      .map(p => ({
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
    const combined = [...customerOrders, ...customerPayments].sort(
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

    const nextOrderNum = `ORD-${orders.length + 101}`;
    const newOrderId = `ord-${Date.now()}`;
    const nowIso = new Date().toISOString();

    // Build items with historical frozen unit prices
    let calculatedTotal = 0;
    const newItems: OrderItem[] = orderData.items.map((item, index) => {
      const prod = products.find(p => p.id === item.productId);
      const agreed = getCustomerAgreedPrice(customer.id, item.productId);
      const unitPrice = item.unitPrice !== undefined ? item.unitPrice : agreed.price;
      const subtotal = item.quantity * unitPrice;
      calculatedTotal += subtotal;

      return {
        id: `item-${Date.now()}-${index}`,
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

    setOrders(prev => [newOrder, ...prev]);
    setOrderItems(prev => [...prev, ...newItems]);

    // Enqueue order mutation
    enqueueMutation({
      endpoint: '/api/orders',
      method: 'POST',
      body: {
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

      const payment: Payment = {
        id: `pay-${Date.now()}`,
        receiptNumber: `RCT-${payments.length + 1001}`,
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

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      drainMutationQueue().catch(() => {});
    }

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

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      drainMutationQueue().catch(() => {});
    }
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
    const isCash = paymentData.paymentMethod === 'CASH';
    const isVerified = paymentData.isVerified ?? isCash;

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      receiptNumber: `RCT-${payments.length + 1001}`,
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

    setPayments(prev => [newPayment, ...prev]);

    enqueueMutation({
      endpoint: '/api/payments',
      method: 'POST',
      body: {
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

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      drainMutationQueue().catch(() => {});
    }

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

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      drainMutationQueue().catch(() => {});
    }
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

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      drainMutationQueue().catch(() => {});
    }
  };

  const recordExpense = (expenseData: Omit<Expense, 'id' | 'date'> & { date?: string }): Expense => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      date: expenseData.date || new Date().toISOString()
    };
    setExpenses(prev => [newExpense, ...prev]);

    enqueueMutation({
      endpoint: '/api/expenses',
      method: 'POST',
      body: {
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

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      drainMutationQueue().catch(() => {});
    }

    return newExpense;
  };

  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer => {
    const nowIso = new Date().toISOString();
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      createdAt: nowIso,
      updatedAt: nowIso
    };
    setCustomers(prev => [...prev, newCustomer]);

    enqueueMutation({
      endpoint: '/api/customers',
      method: 'POST',
      body: customerData,
      description: `Customer ${customerData.organizationName || customerData.name}`,
    });

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      drainMutationQueue().catch(() => {});
    }

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

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      drainMutationQueue().catch(() => {});
    }
  };

  const setCustomerPricingAgreement = (
    customerId: string,
    productId: string,
    agreedPrice: number,
    notes?: string
  ) => {
    const nowIso = new Date().toISOString();
    setPricingAgreements(prev => {
      const existingIndex = prev.findIndex(
        pa => pa.customerId === customerId && pa.productId === productId
      );
      if (existingIndex >= 0) {
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
          id: `cpa-${Date.now()}`,
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
      body: { customerId, productId, agreedPrice, notes },
      description: `Agreed price ${agreedPrice} ETB for customer ${customerId}`,
    });

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      drainMutationQueue().catch(() => {});
    }
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

    const newComplaint: Complaint = {
      id: `comp-${Date.now()}`,
      complaintNumber: `CMP-${complaints.length + 101}`,
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

    setComplaints(prev => [newComplaint, ...prev]);

    enqueueMutation({
      endpoint: '/api/complaints',
      method: 'POST',
      body: {
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

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      drainMutationQueue().catch(() => {});
    }

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

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      drainMutationQueue().catch(() => {});
    }
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

  // Operational metrics memoized for maximum UI responsiveness
  const todayYMD = '2026-09-24'; // Match local simulation date or current day

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
    // Total invoiced across all active orders minus total verified payments
    const totalInvoiced = orders
      .filter(o => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const totalVerifiedPaid = payments
      .filter(p => p.verificationStatus === 'VERIFIED')
      .reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, totalInvoiced - totalVerifiedPaid);
  }, [orders, payments]);

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
        setCustomerPricingAgreement,
        fileComplaint,
        resolveComplaint,
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
