/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Shared API Contracts & DTOs (Data Transfer Objects)
 * Perfectly aligned with domain.ts and schema.ts
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
  CustomerStatementEntry,
  CustomerType,
  CustomerStatus,
  OrderSource,
  OrderStatus,
  PaymentMethod,
  VerificationStatus,
  DeliveryType,
  ExpenseCategory,
  ExpensePeriod,
  ExpenseUnit,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  ResolutionType,
} from './domain.ts';

// Standard Envelope for API Responses
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: string;
}

// ============================================================================
// CUSTOMER MODULE DTOs
// ============================================================================
export interface CreateCustomerDto {
  name: string;
  organizationName: string;
  branch?: string;
  customerType: CustomerType;
  phone: string;
  managerPhone?: string;
  address: string;
  status: CustomerStatus;
  notes?: string;
  preferredDeliveryTime?: string;
  regularPreferences?: {
    productId: string;
    regularQuantity: number;
  }[];
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}

export interface CustomerStatementResponseDto {
  customer: Customer;
  currentBalance: number;
  totalOrders: number;
  totalPayments: number;
  statement: CustomerStatementEntry[];
}

// ============================================================================
// PRODUCT & PRICING DTOs
// ============================================================================
export interface CreateProductDto {
  nameEn: string;
  nameAm: string;
  descriptionEn?: string;
  descriptionAm?: string;
  basePrice: number;
  category: string;
  isActive: boolean;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface SetPricingAgreementDto {
  customerId: string;
  productId: string;
  agreedPrice: number;
  effectiveDate?: string;
  isActive?: boolean;
  notes?: string;
}

// ============================================================================
// ORDER MODULE DTOs
// ============================================================================
export interface CreateOrderItemInput {
  productId: string;
  productNameEn: string;
  productNameAm: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CreateOrderDto {
  customerId: string;
  customerName: string;
  organizationName: string;
  branch?: string;
  customerPhone: string;
  orderSource?: OrderSource;
  orderDate: string;
  deliveryType: DeliveryType;
  deliveryAddress?: string;
  scheduledTime?: string;
  notes?: string;
  createdBy?: string;
  items: CreateOrderItemInput[];
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  notes?: string;
  driverName?: string;
  actualDeliveryTime?: string;
}

// ============================================================================
// PAYMENT MODULE DTOs
// ============================================================================
export interface RecordPaymentDto {
  customerId: string;
  customerName: string;
  orderId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  paymentDate: string;
  recordedBy?: string;
  notes?: string;
  verificationStatus?: VerificationStatus;
}

export interface VerifyPaymentDto {
  verifiedBy: string;
  notes?: string;
}

// ============================================================================
// EXPENSE MODULE DTOs
// ============================================================================
export interface CreateExpenseDto {
  date: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  recordedBy?: string;
  notes?: string;
  expensePeriod?: ExpensePeriod;
  unit?: ExpenseUnit | string;
  quantity?: number;
  unitPrice?: number;
}

// ============================================================================
// COMPLAINT MODULE DTOs
// ============================================================================
export interface CreateComplaintDto {
  customerId: string;
  customerName: string;
  orderId?: string;
  orderNumber?: string;
  productId?: string;
  productName?: string;
  category: ComplaintCategory;
  description: string;
  quantityAffected?: number;
  priority: ComplaintPriority;
}

export interface ResolveComplaintDto {
  status: ComplaintStatus;
  resolutionType?: ResolutionType;
  resolutionNotes: string;
  resolvedBy: string;
}

// ============================================================================
// SYNC & ANALYTICS DTOs
// ============================================================================
export interface SyncPayloadDto {
  customers?: Customer[];
  products?: Product[];
  pricingAgreements?: CustomerPricingAgreement[];
  orders?: Order[];
  orderItems?: OrderItem[];
  payments?: Payment[];
  expenses?: Expense[];
  complaints?: Complaint[];
}

export interface SyncResponseDto {
  syncedAt: string;
  customers: Customer[];
  products: Product[];
  pricingAgreements: CustomerPricingAgreement[];
  orders: Order[];
  orderItems: OrderItem[];
  payments: Payment[];
  expenses: Expense[];
  complaints: Complaint[];
}

export interface DashboardMetricsDto {
  totalCustomers: number;
  activeCustomers: number;
  todayOrdersCount: number;
  todaySalesAmount: number;
  totalReceivables: number;
  pendingPaymentVerifications: number;
  openComplaints: number;
}

// ============================================================================
// PRIORITY 2: PRODUCTION SHEET & TELEBIRR AUDIT DTOs
// ============================================================================
export interface ProductionProductSummary {
  productId: string;
  productNameEn: string;
  productNameAm: string;
  totalQuantity: number;
  estimatedFlourKg: number;
}

export interface ProductionBatchSlot {
  scheduledTime: string;
  orderCount: number;
  totalLoaves: number;
  orders: {
    orderId: string;
    orderNumber: string;
    customerName: string;
    organizationName: string;
    customerPhone: string;
    deliveryAddress?: string;
    driverName?: string;
    status: OrderStatus;
    itemsSummary: string;
  }[];
}

export interface DailyProductionSheetDto {
  targetDate: string;
  totalOrders: number;
  totalUnits: number;
  productsSummary: ProductionProductSummary[];
  timeSlots: ProductionBatchSlot[];
  ingredientEstimates: {
    flourQuintals: number;
    flourKg: number;
    yeastKg: number;
    sugarKg: number;
    saltKg: number;
    oilLiters: number;
  };
}

export interface VerifyReferenceDto {
  transactionReference: string;
  excludePaymentId?: string;
}

export interface VerifyReferenceResultDto {
  isDuplicate: boolean;
  existingPayment?: {
    id: string;
    receiptNumber: string;
    customerName: string;
    amount: number;
    paymentDate: string;
  };
}

export interface ParsedTelebirrResultDto {
  transactionReference?: string;
  amount?: number;
  customerPhone?: string;
  payerName?: string;
  isValidTelebirrSms: boolean;
}

// ============================================================================
// PRIORITY 3: PROFIT & LOSS (P&L) REPORTING DTOs
// ============================================================================
export interface DailyPnLDto {
  startDate: string;
  endDate: string;
  revenue: {
    invoicedTotal: number;
    collectedTotal: number;
    collectedCash: number;
    collectedTelebirr: number;
    collectedBank: number;
    outstandingReceivables: number;
  };
  expenses: {
    cogsTotal: number;
    operatingOverheadTotal: number;
    grandTotal: number;
    byCategory: { category: string; amount: number; percentage: number }[];
  };
  profitability: {
    grossProfit: number;
    netProfit: number;
    operatingMarginPercent: number;
  };
}
