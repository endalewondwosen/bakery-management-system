/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Granular Type-Safe REST API Client for Bakery System
 * Connects frontend views and services directly to backend modules.
 */

import type {
  Customer,
  Product,
  CustomerPricingAgreement,
  Order,
  OrderItem,
  Payment,
  Expense,
  Complaint,
} from '../types/domain.ts';
import type {
  ApiResponse,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerStatementResponseDto,
  CreateProductDto,
  UpdateProductDto,
  SetPricingAgreementDto,
  CreateOrderDto,
  UpdateOrderStatusDto,
  RecordPaymentDto,
  VerifyPaymentDto,
  CreateExpenseDto,
  CreateComplaintDto,
  ResolveComplaintDto,
  SyncPayloadDto,
  SyncResponseDto,
  DashboardMetricsDto,
  DailyProductionSheetDto,
  VerifyReferenceResultDto,
  ParsedTelebirrResultDto,
  DailyPnLDto,
} from '../types/apiContracts.ts';

/**
 * Universal JSON Fetch Helper with Automatic Response Envelope Unwrapping
 */
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
      else if (errJson.message) errorMsg = errJson.message;
    } catch {
      // Non-JSON response
    }
    throw new Error(errorMsg);
  }

  const json = (await response.json()) as ApiResponse<T> | T;
  // If response has { success: true, data: T }, unwrap it; otherwise return raw json
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return (json as ApiResponse<T>).data;
  }
  return json as T;
}

// ============================================================================
// CUSTOMER API
// ============================================================================
export const customerApi = {
  getAll: () => request<Customer[]>('/api/customers'),
  getById: (id: string) => request<Customer>(`/api/customers/${id}`),
  create: (dto: CreateCustomerDto) =>
    request<Customer>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  update: (id: string, dto: UpdateCustomerDto) =>
    request<Customer>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),
  getStatement: (customerId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const qs = params.toString();
    return request<CustomerStatementResponseDto>(`/api/customers/${customerId}/statement${qs ? `?${qs}` : ''}`);
  },
};

// ============================================================================
// PRODUCT & PRICING API
// ============================================================================
export const productApi = {
  getAll: () => request<Product[]>('/api/products'),
  getById: (id: string) => request<Product>(`/api/products/${id}`),
  create: (dto: CreateProductDto) =>
    request<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  update: (id: string, dto: UpdateProductDto) =>
    request<Product>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),
  getAgreements: () => request<CustomerPricingAgreement[]>('/api/pricing-agreements'),
  setAgreement: (dto: SetPricingAgreementDto) =>
    request<CustomerPricingAgreement>('/api/pricing-agreements', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
};

// ============================================================================
// ORDER API
// ============================================================================
export const orderApi = {
  getAll: () => request<(Order & { items: OrderItem[] })[]>('/api/orders'),
  getById: (id: string) => request<Order & { items: OrderItem[] }>(`/api/orders/${id}`),
  create: (dto: CreateOrderDto) =>
    request<Order & { items: OrderItem[] }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  updateStatus: (id: string, dto: UpdateOrderStatusDto) =>
    request<Order & { items: OrderItem[] }>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),
  getProductionSheet: (date?: string) => {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    return request<DailyProductionSheetDto>(`/api/orders/production-sheet${qs}`);
  },
};

// ============================================================================
// PAYMENT API
// ============================================================================
export const paymentApi = {
  getAll: () => request<Payment[]>('/api/payments'),
  getById: (id: string) => request<Payment>(`/api/payments/${id}`),
  record: (dto: RecordPaymentDto) =>
    request<Payment>('/api/payments', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  verify: (id: string, dto: VerifyPaymentDto) =>
    request<Payment>(`/api/payments/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),
  reject: (id: string, reason: string) =>
    request<Payment>(`/api/payments/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),
  checkDuplicateReference: (ref: string, excludeId?: string) => {
    const params = new URLSearchParams({ ref });
    if (excludeId) params.set('excludeId', excludeId);
    return request<VerifyReferenceResultDto>(`/api/payments/verify-ref?${params.toString()}`);
  },
  parseTelebirrSms: (smsText: string) =>
    request<ParsedTelebirrResultDto>('/api/payments/parse-telebirr', {
      method: 'POST',
      body: JSON.stringify({ smsText }),
    }),
};

// ============================================================================
// EXPENSE API
// ============================================================================
export const expenseApi = {
  getAll: () => request<Expense[]>('/api/expenses'),
  create: (dto: CreateExpenseDto) =>
    request<Expense>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
};

// ============================================================================
// COMPLAINT API
// ============================================================================
export const complaintApi = {
  getAll: () => request<Complaint[]>('/api/complaints'),
  getById: (id: string) => request<Complaint>(`/api/complaints/${id}`),
  create: (dto: CreateComplaintDto) =>
    request<Complaint>('/api/complaints', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  resolve: (id: string, dto: ResolveComplaintDto) =>
    request<Complaint>(`/api/complaints/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),
};

// ============================================================================
// ANALYTICS API
// ============================================================================
export const analyticsApi = {
  getMetrics: () => request<DashboardMetricsDto>('/api/analytics/metrics'),
  getPnLReport: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const qs = params.toString();
    return request<DailyPnLDto>(`/api/analytics/pnl${qs ? `?${qs}` : ''}`);
  },
};

// ============================================================================
// BULK SYNCHRONIZATION API
// ============================================================================
export const syncApi = {
  syncAll: (payload: SyncPayloadDto) =>
    request<SyncResponseDto>('/api/sync', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
