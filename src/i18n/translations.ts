/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const translations = {
  en: {
    // App branding
    appTitle: 'Bakery Management System',
    appSubtitle: 'Commercial Bakery Operations',
    tagline: 'Internal Digital Management System',

    // Navigation
    navDashboard: 'Dashboard',
    navOrders: 'Orders',
    navCustomers: 'Customers',
    navPayments: 'Payments & Verification',
    navDebtLedger: 'Customer Debt Ledger',
    navDailyCollections: 'Daily Collections',
    navExpenses: 'Expenses',
    navComplaints: 'Complaints',
    navProductsPricing: 'Products & Pricing',
    navReports: 'Reports',

    // Common actions & terms
    newOrder: 'Take Phone Order',
    recordPayment: 'Record Payment',
    logExpense: 'Log Expense',
    fileComplaint: 'Log Complaint',
    addCustomer: 'Add Customer',
    search: 'Search...',
    filter: 'Filter',
    all: 'All',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    view: 'View',
    status: 'Status',
    actions: 'Actions',
    date: 'Date',
    total: 'Total',
    subtotal: 'Subtotal',
    amount: 'Amount',
    notes: 'Notes',
    close: 'Close',
    confirm: 'Confirm',
    verify: 'Verify',
    reject: 'Reject',
    repeatOrder: 'Repeat Order',
    customer360: 'Customer 360°',
    currency: 'ETB',
    currencySymbol: 'Br',
    themeMode: 'Theme',
    themeDark: 'Dark Mode',
    themeLight: 'Light Mode',
    themeSwitchToLight: 'Switch to Light Mode',
    themeSwitchToDark: 'Switch to Dark Mode',

    // Dashboard metrics
    todaySales: "Today's Sales",
    todayCollections: "Today's Collections",
    todayExpenses: "Today's Expenses",
    outstandingReceivables: 'Total Outstanding Debt',
    pendingVerificationNotice: 'Payments Requiring Verification',
    activeDeliveries: 'Active Deliveries',
    openComplaints: 'Open Complaints',
    cashCollection: 'Cash Collected',
    telebirrCollection: 'Telebirr Collected',
    bankCollection: 'Bank Transfer Collected',
    recentOrders: 'Recent Phone Orders',
    dailyFinancialReconciliation: 'Daily Collections Reconciliation',
    salesVsCashExplanation: 'Sales represent total orders placed. Collections represent actual money received (Cash + Verified Telebirr/Bank).',

    // Products
    burgerBreadWithEgg: 'Burger Bread With Egg (እንቁላል የተቀባ)',
    burgerBreadWithoutEgg: 'Burger Bread Without Egg (እንቁላል ያልተቀባ)',
    normalBread: 'Normal Bread (መደበኛ ዳቦ)',
    fetaBread: 'Feta Bread (ፈታ ዳቦ)',
    basePrice: 'Base Price',
    agreedPrice: 'Agreed Contract Price',
    specialPricingActive: 'Custom Pricing Active',

    // Customer types
    typeRestaurant: 'Restaurant',
    typeCafe: 'Cafe',
    typeBurgerHouse: 'Burger House',
    typeShop: 'Shop',
    typeHotel: 'Hotel',
    typeOther: 'Other',

    // Order sources
    sourcePhone: 'Phone Call',
    sourceWalkIn: 'Walk-in',
    sourceCustomerPortal: 'Customer Portal',
    sourceTelegram: 'Telegram',
    sourceOther: 'Other',

    // Order statuses
    statusPending: 'Pending',
    statusConfirmed: 'Confirmed',
    statusPreparing: 'Preparing',
    statusReady: 'Ready',
    statusOutForDelivery: 'Out for Delivery',
    statusDelivered: 'Delivered',
    statusCancelled: 'Cancelled',

    // Delivery types
    deliveryTypeDelivery: 'Delivery to Address',
    deliveryTypePickup: 'Bakery Pickup',

    // Payment methods
    methodCash: 'Cash',
    methodTelebirr: 'Telebirr',
    methodBankTransfer: 'Bank Transfer',
    methodOther: 'Other',

    // Verification statuses
    verified: 'Verified',
    pendingVerification: 'Pending Verification',
    rejected: 'Rejected',

    // Payment terms
    orderTotal: 'Order Total',
    paidAmount: 'Total Paid',
    outstandingAmount: 'Outstanding Balance',
    paymentStatus: 'Payment Status',
    fullyPaid: 'Fully Paid',
    partiallyPaid: 'Partially Paid',
    unpaidCredit: 'Unpaid (Credit)',
    transactionReference: 'SMS / Txn Reference #',

    // Expense Categories
    catRawFlour: 'Raw Materials - Flour',
    catRawEggs: 'Raw Materials - Eggs',
    catRawCheeseFeta: 'Raw Materials - Cheese & Feta',
    catRawSugarOil: 'Raw Materials - Sugar & Oil',
    catPackaging: 'Packaging & Plastic Bags',
    catTransportFuel: 'Delivery Fuel & Transport',
    catUtilities: 'Utilities (Electricity & Water)',
    catRent: 'Bakery Space Rent',
    catSalaries: 'Staff Salaries',
    catMaintenance: 'Oven & Equipment Maintenance',
    catOther: 'General Other Expenses',

    // Complaint categories
    compBreadQuality: 'Bread Quality Issue',
    compWrongQuantity: 'Wrong Quantity Delivered',
    compWrongProduct: 'Wrong Product Sent',
    compLateDelivery: 'Late Delivery',
    compDeliveryProblem: 'Delivery / Driver Issue',
    compPackaging: 'Damaged Packaging',
    compPriceBilling: 'Price / Billing Discrepancy',
    compDamagedProduct: 'Crushed or Damaged Bread',
    compOther: 'Other Complaint',

    // Complaint priorities & statuses
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    priorityUrgent: 'Urgent',
    statusOpen: 'Open',
    statusUnderReview: 'Under Review',
    statusActionTaken: 'Action Taken',
    statusResolved: 'Resolved',
    statusClosed: 'Closed',

    // Resolutions
    resReplacement: 'Replacement Delivery',
    resRefund: 'Cash / Transfer Refund',
    resDiscount: 'Discount on Next Order',
    resRedelivery: 'Immediate Re-delivery',
    resExplanation: 'Customer Clarification / Apology',
    resNoAction: 'No Action Required',

    // Roles
    roleOwner: 'Bakery Owner',
    roleManager: 'Manager',
    roleOrderStaff: 'Order Taking Staff',
    roleDeliveryStaff: 'Delivery Staff',
    roleAccountant: 'Accountant',

    // Quick Order Modal
    quickOrderTitle: 'Take Phone Order (ፈጣን የስልክ ትዕዛዝ)',
    selectCustomer: 'Select or Search Customer',
    orderItemsTitle: 'Ordered Products & Quantities',
    customPriceNotice: 'Customer has negotiated contract pricing for this product.',
    initialPaymentOption: 'Payment Received at Order Time?',
    noPaymentCredit: 'No Payment (Add to Outstanding Debt)',
    payFull: 'Pay Full Amount Now',
    payPartial: 'Pay Partial Amount Now',
  },
  am: {
    // App branding
    appTitle: 'የዳቦ ቤት ማኔጅመንት ሲስተም',
    appSubtitle: 'የዳቦ ቤት የስራ አስተዳደር',
    tagline: 'ማዕከላዊ የውስጥ ዲጂታል አሰራር',

    // Navigation
    navDashboard: 'ዳሽቦርድ',
    navOrders: 'ትዕዛዞች',
    navCustomers: 'ደንበኞች',
    navPayments: 'ክፍያዎች እና ማረጋገጫ',
    navDebtLedger: 'የደንበኞች ብድር መዝገብ',
    navDailyCollections: 'የቀን ገቢ ስብስብ',
    navExpenses: 'ወጪዎች',
    navComplaints: 'ቅሬታዎች',
    navProductsPricing: 'ምርቶች እና ዋጋዎች',
    navReports: 'ሪፖርቶች',

    // Common actions & terms
    newOrder: 'የስልክ ትዕዛዝ መዝግብ',
    recordPayment: 'ክፍያ መዝግብ',
    logExpense: 'ወጪ መዝግብ',
    fileComplaint: 'ቅሬታ መዝግብ',
    addCustomer: 'አዲስ ደንበኛ ጨምር',
    search: 'ፈልግ...',
    filter: 'አጣራ',
    all: 'ሁሉም',
    save: 'አስቀምጥ',
    cancel: 'ሰርዝ',
    edit: 'አስተካክል',
    delete: 'አጥፋ',
    view: 'ተመልከት',
    status: 'ሁኔታ',
    actions: 'ተግባራት',
    date: 'ቀን',
    total: 'ጠቅላላ',
    subtotal: 'ንዑስ ድምር',
    amount: 'መጠን',
    notes: 'ማስታወሻ',
    close: 'ዝጋ',
    confirm: 'አረጋግጥ',
    verify: 'ክፍያ አረጋግጥ',
    reject: 'ውድቅ አድርግ',
    repeatOrder: 'ትዕዛዝ ድገም',
    customer360: 'የደንበኛ ሙሉ መረጃ (360°)',
    currency: 'ብር',
    currencySymbol: 'ብር',
    themeMode: 'ገጽታ',
    themeDark: 'የጨለማ ገጽታ',
    themeLight: 'የብርሃን ገጽታ',
    themeSwitchToLight: 'ወደ ብርሃን ገጽታ ቀይር',
    themeSwitchToDark: 'ወደ ጨለማ ገጽታ ቀይር',

    // Dashboard metrics
    todaySales: 'የዛሬ ሽያጭ',
    todayCollections: 'የተሰበሰበ ገንዘብ',
    todayExpenses: 'የዛሬ ወጪ',
    outstandingReceivables: 'ያልተከፈለ ጠቅላላ ብድር',
    pendingVerificationNotice: 'ማረጋገጫ የሚጠብቁ ክፍያዎች',
    activeDeliveries: 'በሂደት ላይ ያሉ ማድረሻዎች',
    openComplaints: 'ያልተፈቱ ቅሬታዎች',
    cashCollection: 'በጥሬ ገንዘብ የተሰበሰበ',
    telebirrCollection: 'በቴሌብር የተሰበሰበ',
    bankCollection: 'በባንክ የተሰበሰበ',
    recentOrders: 'የቅርብ የስልክ ትዕዛዞች',
    dailyFinancialReconciliation: 'የቀን ገቢ እና ጥሬ ገንዘብ ማመሳከሪያ',
    salesVsCashExplanation: 'ሽያጭ ማለት የተሸጠው ጠቅላላ ትዕዛዝ ሲሆን፤ ስብስብ ማለት በእጅ የገባው ትክክለኛ ገንዘብ (ጥሬ + የተረጋገጠ ቴሌብር/ባንክ) ነው።',

    // Products
    burgerBreadWithEgg: 'እንቁላል የተቀባ (Burger Bread With Egg)',
    burgerBreadWithoutEgg: 'እንቁላል ያልተቀባ (Burger Bread Without Egg)',
    normalBread: 'መደበኛ ዳቦ (Normal Bread)',
    fetaBread: 'ፈታ ዳቦ (Feta Bread)',
    basePrice: 'መደበኛ ዋጋ',
    agreedPrice: 'ልዩ የስምምነት ዋጋ',
    specialPricingActive: 'ልዩ የዋጋ ስምምነት ተፈጻሚ ሆኗል',

    // Customer types
    typeRestaurant: 'ሬስቶራንት',
    typeCafe: 'ካፌ',
    typeBurgerHouse: 'በርገር ቤት',
    typeShop: 'ሱቅ',
    typeHotel: 'ሆቴል',
    typeOther: 'ሌላ',

    // Order sources
    sourcePhone: 'ስልክ ጥሪ',
    sourceWalkIn: 'በአካል',
    sourceCustomerPortal: 'የደንበኛ ፖርታል',
    sourceTelegram: 'ቴሌግራም',
    sourceOther: 'ሌላ',

    // Order statuses
    statusPending: 'በመጠባበቅ ላይ',
    statusConfirmed: 'የተረጋገጠ',
    statusPreparing: 'በመዘጋጀት ላይ',
    statusReady: 'ዝግጁ የሆነ',
    statusOutForDelivery: 'በማድረስ ላይ',
    statusDelivered: 'ደርሷል',
    statusCancelled: 'የተሰረዘ',

    // Delivery types
    deliveryTypeDelivery: 'እስከ አድራሻ ማድረስ',
    deliveryTypePickup: 'ከዳቦ ቤት መውሰድ',

    // Payment methods
    methodCash: 'ጥሬ ገንዘብ',
    methodTelebirr: 'ቴሌብር',
    methodBankTransfer: 'የባንክ ዝውውር',
    methodOther: 'ሌላ',

    // Verification statuses
    verified: 'የተረጋገጠ',
    pendingVerification: 'ማረጋገጫ የሚጠብቅ',
    rejected: 'ውድቅ የተደረገ',

    // Payment terms
    orderTotal: 'የትዕዛዝ ጠቅላላ ዋጋ',
    paidAmount: 'የተከፈለ መጠን',
    outstandingAmount: 'ቀሪ ያልተከፈለ ዕዳ',
    paymentStatus: 'የክፍያ ሁኔታ',
    fullyPaid: 'ሙሉ በሙሉ የተከፈለ',
    partiallyPaid: 'በከፊል የተከፈለ',
    unpaidCredit: 'ያልተከፈለ (በብድር)',
    transactionReference: 'የኤስኤምኤስ / ዝውውር ማረጋገጫ ቁጥር',

    // Expense Categories
    catRawFlour: 'ጥሬ እቃ - ዱቄት',
    catRawEggs: 'ጥሬ እቃ - እንቁላል',
    catRawCheeseFeta: 'ጥሬ እቃ - ፈታ/አይብ',
    catRawSugarOil: 'ጥሬ እቃ - ስኳር እና ዘይት',
    catPackaging: 'ማሸጊያ እና ፌስታል',
    catTransportFuel: 'የትራንስፖርት እና የነዳጅ ወጪ',
    catUtilities: 'መብራት እና ውሃ',
    catRent: 'የቤት ኪራይ',
    catSalaries: 'የሰራተኞች ደመወዝ',
    catMaintenance: 'የፎርኖ እና ማሽነሪ ጥገና',
    catOther: 'ሌሎች ጠቅላላ ወጪዎች',

    // Complaint categories
    compBreadQuality: 'የዳቦ ጥራት ችግር',
    compWrongQuantity: 'የብዛት ስህተት',
    compWrongProduct: 'የተሳሳተ የዳቦ ዓይነት',
    compLateDelivery: 'የማድረሻ ሰዓት መዘግየት',
    compDeliveryProblem: 'የማድረሻ/አሽከርካሪ ችግር',
    compPackaging: 'የማሸጊያ መጎዳት',
    compPriceBilling: 'የሂሳብ/ዋጋ አለመጣጣም',
    compDamagedProduct: 'የተጨፈለቀ ወይም የተጎዳ ዳቦ',
    compOther: 'ሌላ ቅሬታ',

    // Complaint priorities & statuses
    priorityLow: 'ዝቅተኛ',
    priorityMedium: 'መካከለኛ',
    priorityHigh: 'ከፍተኛ',
    priorityUrgent: 'አስቸኳይ',
    statusOpen: 'ክፍት',
    statusUnderReview: 'በመመርመር ላይ',
    statusActionTaken: 'እርምጃ የተወሰደበት',
    statusResolved: 'የተፈታ',
    statusClosed: 'የተዘጋ',

    // Resolutions
    resReplacement: 'በሌላ ዳቦ መቀየር',
    resRefund: 'ገንዘብ መመለስ',
    resDiscount: 'በሚቀጥለው ትዕዛዝ ቅናሽ',
    resRedelivery: 'እንደገና በአስቸኳይ ማድረስ',
    resExplanation: 'ለደንበኛ ማብራሪያና ይቅርታ',
    resNoAction: 'እርምጃ አያስፈልገውም',

    // Roles
    roleOwner: 'የዳቦ ቤቱ ባለቤት',
    roleManager: 'ስራ አስኪያጅ',
    roleOrderStaff: 'ትዕዛዝ ተቀባይ ሰራተኛ',
    roleDeliveryStaff: 'አከፋፋይ ሰራተኛ',
    roleAccountant: 'የሂሳብ ባለሙያ',

    // Quick Order Modal
    quickOrderTitle: 'ፈጣን የስልክ ትዕዛዝ መመዝገቢያ',
    selectCustomer: 'ደንበኛ ይምረጡ ወይም ስልክ ይፈልጉ',
    orderItemsTitle: 'የሚታዘዙ የዳቦ ዓይነቶች እና ብዛት',
    customPriceNotice: 'ይህ ደንበኛ ለዚህ ምርት የተለየ የስምምነት ዋጋ አለው።',
    initialPaymentOption: 'ትዕዛዙ ሲወሰድ የተከፈለ ክፍያ አለ?',
    noPaymentCredit: 'ምንም ክፍያ የለም (በብድር ይጻፍ)',
    payFull: 'ሙሉውን አሁን ተከፍሏል',
    payPartial: 'በከፊል አሁን ተከፍሏል',
  }
};
