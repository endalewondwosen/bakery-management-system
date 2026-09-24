# **Bakery Management System**

## **Master Business Requirements & AI Agent Context**

> **Purpose of this document:**  
> This document is the primary business and functional context for building a Bakery Management System. The AI coding agent must understand the business requirements, workflows, relationships, and constraints described here before implementing features or making architectural decisions.

> The system is intended to replace the bakery's current paper/manual workflow with a centralized digital management system while keeping the initial user experience simple enough for the bakery owner/staff.

---

# **1. Business Context**

The bakery currently operates primarily through manual, paper-based processes.

The bakery produces and sells several types of bread, including examples such as:

* Burger bread with egg (እንቁላል የተቀባ)
* Burger bread without egg (እንቁላል ያልተቀባ)
* Normal bread (መደበኛ ዳቦ)
* Feta bread (ፈታ ዳቦ)
* Other bakery products that may be added later

The bakery serves different types of customers, particularly business customers such as:

* Restaurants  
* Cafes  
* Burger houses  
* Shops  
* Other businesses/customers

Many customers regularly order bakery products.

Currently, the bakery owner/staff commonly:

1. Receives orders by phone call.  
2. Writes the order on paper.  
3. Processes and delivers the order.  
4. Records sales manually.  
5. Receives payments manually.  
6. Allows some customers to pay partially or later.  
7. Tracks customer debt manually.  
8. Records daily expenses manually.  
9. Records daily collected money manually.  
10. Receives customer complaints by phone.  
11. Keeps customer-related information manually.

This creates difficulties with:

* Accurate record keeping  
* Finding historical transactions  
* Tracking customer balances  
* Tracking partial payments  
* Tracking outstanding debt  
* Calculating sales  
* Calculating expenses  
* Calculating profit  
* Tracking deliveries  
* Tracking customer complaints  
* Generating reports  
* Understanding customer purchasing patterns  
* Avoiding human calculation errors  
* Maintaining a reliable history of business activity

The new system should centralize these operations.

---

# **2. Main System Goal**

The primary goal is to create an internal Bakery Management System that allows the bakery owner/staff to manage the entire business digitally.

The first version is primarily an **internal system**.

Customers do NOT need to use the system initially.

The bakery owner/staff should continue taking orders by phone as they currently do, but instead of writing the information on paper, they enter it into the system.

### **Initial workflow**

Customer calls bakery  
        ↓  
Bakery owner/staff takes order  
        ↓  
Staff enters order into system  
        ↓  
Order is processed  
        ↓  
Order is delivered/picked up  
        ↓  
Payment is received  
        ↓  
Payment may be:  
    - Full  
    - Partial  
    - Delayed / credit  
        ↓  
Customer balance is updated

The system should preserve this familiar business process while replacing the paper-based record keeping.

---

# **3. Future Direction**

The initial system is internal.

However, the architecture must be designed so that a public customer-facing ordering system can be added later without rebuilding the core business logic.

Possible future channels include:

* Customer web portal  
* Customer mobile application  
* Telegram ordering / Telegram Mini App
* Other digital ordering channels

The future customer portal should use the same underlying order/customer/payment system.

### **Important architectural principle**

Do NOT design the system so that "phone order" and "online order" become completely different business entities.

Instead, the system should support different order sources:
- Phone
- Walk-in
- Customer Portal
- Telegram
- Other

Initially, almost all orders come from Phone.

---

# **4. Core Business Domains**

The system is organized around:
- Customers (and Branches)
- Products (and Agreed Pricing)
- Orders & Order Items
- Delivery
- Payments & Partial Payments
- Customer Balances / Debt Ledgers
- Expenses & Categories
- Customer Complaints & Resolutions
- Daily Collections & Cash/Digital Reconciliation
- Reports & Analytics
- Users / Staff & Roles
- Audit & Activity History

---

# **5. Customer Management**

Centralized customer database supporting both organizations and individuals.
- Customer Types: Restaurant, Cafe, Burger House, Shop, Other (extensible to Hotel, Supermarket, Catering, etc.)
- Organization name, Branch name/hierarchy, Address, Contact person name & phone, Manager phone, Status, Notes.

---

# **6. Customer Product Preferences & Agreed Pricing**

- Preferences: Preferred products and regular quantities to speed up re-ordering.
- Agreed Pricing: Product prices may vary per customer due to negotiated contracts.
  - Standard product price vs Customer agreed price.
  - Effective date / active status.
  - Historical orders preserve the actual agreed price at order creation.

---

# **7. Order & Delivery Management**

- Order source: Phone (initial default), Walk-in, Customer Portal, Telegram.
- Order items: product, quantity, unit price (applied from agreed or base price), total.
- Lifecycle: Pending → Confirmed → Preparing → Ready → Out for Delivery → Delivered / Completed (or Cancelled).
- Delivery details: Delivery type (Delivery / Pickup), address, scheduled time, actual time, status, driver/staff, notes.

---

# **8. Payment Management & Partial Payments**

- Payment is NOT a single boolean flag on the order.
- Payments are first-class transaction records.
- Methods: Cash, Telebirr, Bank Transfer, Other.
- Supports partial payments across multiple installments and multiple methods.
- Payment evidence: Transaction/reference number, receipt attachment/note, notes.
- Verification workflow: Pending Verification → Verified / Rejected (with verifiedBy, verifiedAt).

---

# **9. Customer Debt & Ledger**

- Outstanding amount = Order Total - Sum of Verified Payments.
- Customer-level running balance across all active orders.
- Customer statement showing chronological debit (orders), credit (payments), and balance.
- Debt collection flow allowing payments to be allocated against unpaid or partially paid orders.

---

# **10. Daily Collections & Expenses**

- Daily Collections View: Real breakdown by Cash, Telebirr, Bank Transfer, Total.
- Distinction: Sales Generated ≠ Payments Collected ≠ Outstanding Credit.
- Expense tracking: Date, amount, category (Flour, Eggs, Cheese/Feta, Sugar, Oil, Packaging, Fuel, Utilities, Rent, Salaries, Maintenance, Equipment, etc.), description, payment method, reference, notes.
- Financial overview: Sales, Collections, Expenses, Outstanding Receivables.

---

# **11. Customer Complaints Management**

- Dedicated business entity (not a simple text field).
- Associated with Customer, optional Order, optional Product.
- Categories: Bread quality, Wrong quantity, Wrong product, Late delivery, Delivery problem, Packaging, Billing/Price, Damaged product, Other.
- Lifecycle: Open → Under Review → Action Taken → Resolved → Closed.
- Resolutions: Replacement, Refund, Discount, Re-delivery, Explanation, No Action.
- Customer 360 view includes complete complaint history.

---

# **12. Language Support (Bilingual Amharic & English)**

- System must support both English and Amharic (አማርኛ).
- User toggle in interface.
- Complete localized navigation, labels, statuses, forms, reports, and dashboards.
- Products support actual bakery terminology:
  - "Burger Bread With Egg" -> "እንቁላል የተቀባ"
  - "Burger Bread Without Egg" -> "እንቁላል ያልተቀባ"
  - "Normal Bread" -> "መደበኛ ዳቦ"
  - "Feta Bread" -> "ፈታ ዳቦ"
