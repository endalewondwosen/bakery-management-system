# **Bakery Management System — Technical Implementation Specification**
### Document Version: 1.0.0
### Companion to: `MASTER_BUSINESS_REQUIREMENTS.md`

---

## **1. Chosen Technology Stack & Architecture**

### **1.1 Overview**
The Bakery Management System is built as a responsive, high-performance web application designed for fast touch/tablet and desktop usage by bakery owners, managers, sales clerks, accountants, and delivery coordinators.

- **Frontend Framework**: React 19 with TypeScript 5.8+ (Strict Mode)
- **Styling**: Tailwind CSS v4 with modern, warm artisanal bakery visual design (warm stone, amber, crust golden accents, dark slate text, high WCAG AA contrast, zero generic AI pill clutters)
- **Icons**: Lucide React
- **Animations/Transitions**: Motion (`motion/react`)
- **State Management & Persistence**:
  - Relational-style reactive in-memory domain store with LocalStorage persistence synchronization, seeded with realistic bakery business data (Addis Ababa restaurants, burger houses, cafes, orders, partial payments, and expenses in ETB).
  - Clean separation of domain repositories, financial calculation services, and UI components.
  - Future-proof for seamless backend API integration (REST / Express proxy routes) without modifying UI components.
- **Internationalization (i18n)**:
  - First-class bilingual engine supporting English and Amharic (አማርኛ).
  - Instant runtime language toggle with persistence in user preferences.
  - Localized number and currency formatting for Ethiopian Birr (ETB / ብር).

---

## **2. Database & Domain Schema Design**

The database is normalized to preserve historical truth and prevent calculation drift.

### **2.1 Core Entities**

#### **1. Customer (`customers`)**
| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID) | Primary Key |
| `name` | `string` | Customer / Contact Person name |
| `organizationName` | `string` | Restaurant / Cafe / Business Name |
| `branch` | `string?` | Branch location / identifier (e.g., "Bole Branch", "Kazanchis") |
| `customerType` | `CustomerType` | `RESTAURANT`, `CAFE`, `BURGER_HOUSE`, `SHOP`, `HOTEL`, `OTHER` |
| `phone` | `string` | Primary contact phone (e.g. +251 91 123 4567) |
| `managerPhone` | `string?` | Secondary / Manager phone |
| `address` | `string` | Delivery / physical location |
| `status` | `CustomerStatus` | `ACTIVE`, `INACTIVE` |
| `notes` | `string?` | Delivery directions or customer notes |
| `createdAt` | `string` (ISO) | Record creation timestamp |
| `updatedAt` | `string` (ISO) | Last update timestamp |

#### **2. Customer Pricing Agreement (`customer_pricing_agreements`)**
| Field | Type | Description |
|---|---|---|
| `id` | `string` | Primary Key |
| `customerId` | `string` (FK) | Reference to `customers.id` |
| `productId` | `string` (FK) | Reference to `products.id` |
| `agreedPrice` | `number` | Agreed price per unit in ETB |
| `effectiveDate` | `string` (ISO) | When the pricing took effect |
| `isActive` | `boolean` | Flag indicating whether this rate is active |
| `notes` | `string?` | Contract or negotiation reference |

#### **3. Product (`products`)**
| Field | Type | Description |
|---|---|---|
| `id` | `string` | Primary Key |
| `nameEn` | `string` | English product name (e.g. "Burger Bread With Egg") |
| `nameAm` | `string` | Amharic product name (e.g. "እንቁላል የተቀባ") |
| `description` | `string?` | Product details / weight / packaging |
| `basePrice` | `number` | Default unit selling price in ETB |
| `category` | `string` | Bread, Pastry, Specialty |
| `isActive` | `boolean` | Availability toggle |
| `createdAt` | `string` (ISO) | Timestamp |

#### **4. Order (`orders`)**
| Field | Type | Description |
|---|---|---|
| `id` | `string` | Primary Key |
| `orderNumber` | `string` | Human-readable sequential ID (e.g. "ORD-1042") |
| `customerId` | `string` (FK) | Reference to `customers.id` |
| `orderSource` | `OrderSource` | `PHONE` (default), `WALK_IN`, `CUSTOMER_PORTAL`, `TELEGRAM`, `OTHER` |
| `status` | `OrderStatus` | `PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED` |
| `orderDate` | `string` (ISO) | Creation time |
| `totalAmount` | `number` | Immutable sum of items at creation time |
| `deliveryType` | `DeliveryType` | `DELIVERY`, `PICKUP` |
| `deliveryAddress` | `string?` | Specific delivery location |
| `scheduledTime` | `string?` | Expected delivery/pickup time |
| `driverName` | `string?` | Assigned delivery staff |
| `deliveryNotes` | `string?` | Delivery instructions |
| `notes` | `string?` | Staff order notes |
| `createdBy` | `string` | Staff member who logged the phone order |

#### **5. Order Item (`order_items`)**
| Field | Type | Description |
|---|---|---|
| `id` | `string` | Primary Key |
| `orderId` | `string` (FK) | Reference to `orders.id` |
| `productId` | `string` (FK) | Reference to `products.id` |
| `productName` | `string` | Snapshot of product name when ordered |
| `quantity` | `number` | Quantity ordered |
| `unitPrice` | `number` | Snapshot unit price used (agreed or base) |
| `subtotal` | `number` | `quantity * unitPrice` |

#### **6. Payment (`payments`)**
| Field | Type | Description |
|---|---|---|
| `id` | `string` | Primary Key |
| `receiptNumber` | `string` | Unique payment voucher number (e.g. "RCT-5012") |
| `orderId` | `string` (FK) | Reference to `orders.id` (or primary allocated order) |
| `customerId` | `string` (FK) | Reference to `customers.id` |
| `amount` | `number` | Amount paid in ETB |
| `paymentMethod` | `PaymentMethod` | `CASH`, `TELEBIRR`, `BANK_TRANSFER`, `OTHER` |
| `transactionReference` | `string?` | Telebirr / Bank SMS Txn reference ID |
| `verificationStatus` | `VerificationStatus`| `VERIFIED`, `PENDING_VERIFICATION`, `REJECTED` |
| `verifiedBy` | `string?` | Staff member who verified bank/Telebirr SMS |
| `verifiedAt` | `string?` (ISO) | Verification timestamp |
| `paymentDate` | `string` (ISO) | When payment was received |
| `notes` | `string?` | Notes or reconciliation details |
| `recordedBy` | `string` | Staff member who entered the payment |

#### **7. Customer Debt & Running Balances**
Calculated dynamically or cached per customer:
- `Total Invoiced = SUM(orders.totalAmount WHERE status != 'CANCELLED')`
- `Total Paid = SUM(payments.amount WHERE verificationStatus = 'VERIFIED')`
- `Outstanding Debt = Total Invoiced - Total Paid`
- Customer Statement / Ledger: Chronological union of debits (orders) and credits (verified payments).

#### **8. Expense (`expenses`)**
| Field | Type | Description |
|---|---|---|
| `id` | `string` | Primary Key |
| `date` | `string` (ISO) | Expense date |
| `amount` | `number` | Expense amount in ETB |
| `category` | `ExpenseCategory` | `RAW_MATERIALS_FLOUR`, `RAW_MATERIALS_EGGS`, `RAW_MATERIALS_CHEESE_FETA`, `RAW_MATERIALS_SUGAR_OIL`, `PACKAGING`, `TRANSPORT_FUEL`, `UTILITIES`, `RENT`, `SALARIES`, `MAINTENANCE`, `OTHER` |
| `description` | `string` | Details of expense |
| `paymentMethod` | `PaymentMethod` | `CASH`, `TELEBIRR`, `BANK_TRANSFER`, `OTHER` |
| `referenceNumber` | `string?` | Supplier receipt / bill number |
| `recordedBy` | `string` | Staff name |
| `notes` | `string?` | Supplier notes |

#### **9. Customer Complaint (`complaints`)**
| Field | Type | Description |
|---|---|---|
| `id` | `string` | Primary Key |
| `complaintNumber` | `string` | e.g. "CMP-203" |
| `customerId` | `string` (FK) | Reference to `customers.id` |
| `orderId` | `string?` (FK) | Optional reference to `orders.id` |
| `productId` | `string?` (FK) | Optional reference to `products.id` |
| `category` | `ComplaintCategory`| `BREAD_QUALITY`, `WRONG_QUANTITY`, `WRONG_PRODUCT`, `LATE_DELIVERY`, `DELIVERY_PROBLEM`, `PACKAGING`, `PRICE_BILLING`, `DAMAGED_PRODUCT`, `OTHER` |
| `description` | `string` | Customer feedback details |
| `quantityAffected` | `number?` | Number of breads affected |
| `priority` | `ComplaintPriority`| `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `status` | `ComplaintStatus` | `OPEN`, `UNDER_REVIEW`, `ACTION_TAKEN`, `RESOLVED`, `CLOSED` |
| `resolutionType` | `ResolutionType?`| `REPLACEMENT`, `REFUND`, `DISCOUNT`, `REDELIVERY`, `EXPLANATION`, `NO_ACTION` |
| `resolutionNotes` | `string?` | Description of how it was settled |
| `resolvedBy` | `string?` | Staff/owner name |
| `resolvedAt` | `string?` (ISO) | Resolution timestamp |
| `createdAt` | `string` (ISO) | Submission timestamp |

---

## **3. Frontend Application Structure**

```
src/
├── types/
│   └── domain.ts            # Core TypeScript interfaces, enums, DTOs
├── i18n/
│   ├── translations.ts      # English & Amharic dictionaries
│   └── useLanguage.tsx      # Language toggle hook & context
├── store/
│   ├── mockData.ts          # Seed data with realistic Ethiopian bakery operations
│   ├── bakeryStore.ts       # Central reactive state engine & LocalStorage persistence
│   └── financialCalculations.ts # Authoritative sales, collection, debt, and profit rules
├── components/
│   ├── common/
│   │   ├── Header.tsx       # Brand header, search bar, language switcher, quick action
│   │   ├── Navigation.tsx   # Clean desktop & mobile navigation tabs
│   │   ├── Modal.tsx        # Accessible dialog wrapper
│   │   └── MetricCard.tsx   # Domain-native KPI cards with zero slop
│   ├── dashboard/
│   │   └── DashboardView.tsx # Real-time daily collection, sales vs debt, deliveries, quick metrics
│   ├── orders/
│   │   ├── OrdersView.tsx   # Order list with filters, quick statuses, phone orders
│   │   ├── QuickOrderModal.tsx # Fast 30-second phone order entry with repeat order support
│   │   └── OrderDetailModal.tsx # Full order breakdown, items, payment history, recording payments
│   ├── customers/
│   │   ├── CustomersView.tsx # Customer list, branch filtering, debt indicators
│   │   ├── Customer360Modal.tsx # Complete 360-view: orders, payments, statement ledger, complaints, pricing
│   │   └── CustomerFormModal.tsx # Add/Edit customer profile & branches
│   ├── payments/
│   │   ├── PaymentsView.tsx # Payment transactions, verification queue, Telebirr/Bank confirmation
│   │   └── RecordPaymentModal.tsx # Record partial/full payment, allocate to order, upload/enter SMS ref
│   ├── debt/
│   │   └── DebtLedgerView.tsx # Outstanding balances, customer aging, debt collection flow
│   ├── expenses/
│   │   ├── ExpensesView.tsx # Expense logs, category breakdown, daily totals
│   │   └── RecordExpenseModal.tsx # Quick expense entry
│   ├── complaints/
│   │   ├── ComplaintsView.tsx # Customer complaints desk, lifecycle transitions, resolution drawer
│   │   └── ComplaintModal.tsx # Register new complaint, assign resolution
│   ├── reports/
│   │   └── ReportsView.tsx   # Sales reports, daily collections breakdown (Cash/Telebirr/Bank), debt report
│   └── products/
│       └── ProductsPricingView.tsx # Products catalog, base prices, customer-specific agreed pricing table
└── App.tsx                  # Root application router & layout orchestrator
```

---

## **4. Strict Financial Calculation & Business Rules**

1. **Sales ≠ Collections**:
   - `Daily Sales`: Sum of totals of all valid orders created on that day.
   - `Daily Collections`: Sum of all verified payments received on that day (regardless of whether they pay today's order or older debt).
2. **Immutability of Historical Order Prices**:
   - When a product base price or customer agreed price changes, historical `order_items.unitPrice` and `orders.totalAmount` MUST remain unchanged.
3. **Partial Payments & Multi-Method Allocation**:
   - An order with total 12,000 ETB can have Payment 1 (4,000 ETB Cash) and Payment 2 (3,000 ETB Telebirr). Outstanding = 5,000 ETB.
4. **Verification Safeguard**:
   - Unverified payments (`PENDING_VERIFICATION`) are tagged and visually highlighted; they do not settle debt until verified by the owner or authorized staff.
5. **No Negative Debt Phantom Balances**:
   - Payments exceeding the order total trigger a validation alert or are handled explicitly as advance/credit balance.

---

## **5. Acceptance Criteria Checklist**

- [x] Bilingual English & Amharic UI with seamless instant switching.
- [x] Fast phone-order logging with customer auto-suggest and agreed customer pricing.
- [x] Repeat order functionality ("Re-order previous") creating a clean new order.
- [x] Partial payment recording with multiple payment methods (Cash, Telebirr, Bank Transfer).
- [x] Verification workflow for Telebirr / Bank SMS references.
- [x] 360-degree customer view: history of orders, payments, debt ledger, agreed prices, and complaints.
- [x] Dedicated Customer Complaints module with status lifecycle and resolution tracking.
- [x] Daily Collections screen separating Cash, Telebirr, and Bank transfers.
- [x] Daily Expenses categorized by raw materials, packaging, utilities, rent, and salaries.
- [x] Clean, artisanal bakery design honoring the domain without generic AI template slop.
