/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'en' | 'am';

export type UserRole = 'OWNER' | 'MANAGER' | 'ORDER_STAFF' | 'DELIVERY_STAFF' | 'ACCOUNTANT';

export type CustomerType = 
  | 'RESTAURANT' 
  | 'CAFE' 
  | 'BURGER_HOUSE' 
  | 'SHOP' 
  | 'HOTEL' 
  | 'OTHER';

export type CustomerStatus = 'ACTIVE' | 'INACTIVE';

export interface CustomerPreference {
  productId: string;
  regularQuantity: number;
}

export interface Customer {
  id: string;
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
  regularPreferences?: CustomerPreference[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPricingAgreement {
  id: string;
  customerId: string;
  productId: string;
  agreedPrice: number; // in ETB
  effectiveDate: string;
  isActive: boolean;
  notes?: string;
}

export interface Product {
  id: string;
  nameEn: string;
  nameAm: string;
  descriptionEn?: string;
  descriptionAm?: string;
  basePrice: number; // in ETB
  category: string;
  isActive: boolean;
  createdAt: string;
}

export type OrderSource = 'PHONE' | 'WALK_IN' | 'CUSTOMER_PORTAL' | 'TELEGRAM' | 'OTHER';

export type OrderStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'PREPARING' 
  | 'READY' 
  | 'OUT_FOR_DELIVERY' 
  | 'DELIVERED' 
  | 'CANCELLED';

export type DeliveryType = 'DELIVERY' | 'PICKUP';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productNameEn: string;
  productNameAm: string;
  quantity: number;
  unitPrice: number; // Historical price preserved
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  organizationName: string;
  branch?: string;
  customerPhone: string;
  orderSource: OrderSource;
  status: OrderStatus;
  orderDate: string; // ISO date
  totalAmount: number;
  deliveryType: DeliveryType;
  deliveryAddress?: string;
  scheduledTime?: string;
  actualDeliveryTime?: string;
  driverName?: string;
  deliveryNotes?: string;
  notes?: string;
  createdBy: string;
  updatedAt: string;
}

export type PaymentMethod = 'CASH' | 'TELEBIRR' | 'BANK_TRANSFER' | 'OTHER';

export type VerificationStatus = 'VERIFIED' | 'PENDING_VERIFICATION' | 'REJECTED';

export interface Payment {
  id: string;
  receiptNumber: string;
  orderId: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference?: string; // e.g. Telebirr SMS or Bank Txn ID
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  paymentDate: string;
  notes?: string;
  recordedBy: string;
}

export type ExpenseCategory = 
  | 'RAW_FLOUR' 
  | 'RAW_EGGS' 
  | 'RAW_CHEESE_FETA' 
  | 'RAW_SUGAR_OIL' 
  | 'PACKAGING' 
  | 'TRANSPORT_FUEL' 
  | 'UTILITIES' 
  | 'RENT' 
  | 'SALARIES' 
  | 'MAINTENANCE' 
  | 'OTHER';

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  recordedBy: string;
  notes?: string;
}

export type ComplaintCategory = 
  | 'BREAD_QUALITY' 
  | 'WRONG_QUANTITY' 
  | 'WRONG_PRODUCT' 
  | 'LATE_DELIVERY' 
  | 'DELIVERY_PROBLEM' 
  | 'PACKAGING' 
  | 'PRICE_BILLING' 
  | 'DAMAGED_PRODUCT' 
  | 'OTHER';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ComplaintStatus = 'OPEN' | 'UNDER_REVIEW' | 'ACTION_TAKEN' | 'RESOLVED' | 'CLOSED';

export type ResolutionType = 
  | 'REPLACEMENT' 
  | 'REFUND' 
  | 'DISCOUNT' 
  | 'REDELIVERY' 
  | 'EXPLANATION' 
  | 'NO_ACTION' 
  | 'OTHER';

export interface Complaint {
  id: string;
  complaintNumber: string;
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
  status: ComplaintStatus;
  resolutionType?: ResolutionType;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface CustomerStatementEntry {
  date: string;
  type: 'ORDER' | 'PAYMENT';
  referenceId: string;
  description: string;
  debit: number;  // Order amount increases balance
  credit: number; // Payment decreases balance
  runningBalance: number;
  status?: string;
}
