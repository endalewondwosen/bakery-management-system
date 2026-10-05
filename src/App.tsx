/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ThemeProvider } from './theme/useTheme.tsx';
import { LanguageProvider, useLanguage } from './i18n/useLanguage.tsx';
import { BakeryStoreProvider } from './store/bakeryStore.tsx';
import { Header } from './components/common/Header.tsx';
import { Navigation, TabType } from './components/common/Navigation.tsx';
import { MobileBottomNav } from './components/common/MobileBottomNav.tsx';
import { DashboardView } from './components/dashboard/DashboardView.tsx';
import { OrdersView } from './components/orders/OrdersView.tsx';
import { QuickOrderModal } from './components/orders/QuickOrderModal.tsx';
import { OrderDetailModal } from './components/orders/OrderDetailModal.tsx';
import { CustomersView } from './components/customers/CustomersView.tsx';
import { Customer360Modal } from './components/customers/Customer360Modal.tsx';
import { CustomerFormModal } from './components/customers/CustomerFormModal.tsx';
import { PaymentsView } from './components/payments/PaymentsView.tsx';
import { RecordPaymentModal } from './components/payments/RecordPaymentModal.tsx';
import { DebtLedgerView } from './components/debt/DebtLedgerView.tsx';
import { DailyCollectionsView } from './components/collections/DailyCollectionsView.tsx';
import { ExpensesView } from './components/expenses/ExpensesView.tsx';
import { RecordExpenseModal } from './components/expenses/RecordExpenseModal.tsx';
import { ComplaintsView } from './components/complaints/ComplaintsView.tsx';
import { ComplaintModal } from './components/complaints/ComplaintModal.tsx';
import { ProductsPricingView } from './components/products/ProductsPricingView.tsx';
import { FinancialReportsView } from './components/reports/FinancialReportsView.tsx';
import { ExpensePeriod } from './types/domain.ts';

const BakeryAppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [quickOrderOpen, setQuickOrderOpen] = useState(false);
  const [quickOrderInitialCustomerId, setQuickOrderInitialCustomerId] = useState<string | undefined>(undefined);

  const [customerFormOpen, setCustomerFormOpen] = useState(false);

  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [paymentPreselectedOrderId, setPaymentPreselectedOrderId] = useState<string | undefined>(undefined);
  const [paymentPreselectedCustomerId, setPaymentPreselectedCustomerId] = useState<string | undefined>(undefined);

  const [recordExpenseOpen, setRecordExpenseOpen] = useState(false);
  const [recordExpenseDefaultPeriod, setRecordExpenseDefaultPeriod] = useState<ExpensePeriod>('DAILY');

  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [complaintPreselectedCustomerId, setComplaintPreselectedCustomerId] = useState<string | undefined>(undefined);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Helper actions
  const handleOpenQuickOrder = (customerId?: string) => {
    setQuickOrderInitialCustomerId(customerId);
    setQuickOrderOpen(true);
  };

  const handleOpenRecordPayment = (orderId?: string, customerId?: string) => {
    setPaymentPreselectedOrderId(orderId);
    setPaymentPreselectedCustomerId(customerId);
    setRecordPaymentOpen(true);
  };

  const handleOpenNewComplaint = (customerId?: string) => {
    setComplaintPreselectedCustomerId(customerId);
    setComplaintModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Top Application Header */}
      <Header
        activeSearch={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenQuickOrder={() => handleOpenQuickOrder()}
      />

      {/* Primary Tab Navigation */}
      <Navigation
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      />

      {/* Main Work Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 pb-28 sm:pb-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            onOpenQuickOrder={() => handleOpenQuickOrder()}
            onOpenRecordPayment={(orderId, customerId) => handleOpenRecordPayment(orderId, customerId)}
            onOpenRecordExpense={() => setRecordExpenseOpen(true)}
            onSelectOrder={(id) => setSelectedOrderId(id)}
            onSelectCustomer={(id) => setSelectedCustomerId(id)}
            onNavigateTab={(tab: TabType) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'orders' && (
          <OrdersView
            onOpenQuickOrder={() => handleOpenQuickOrder()}
            onSelectOrder={(id) => setSelectedOrderId(id)}
            onOpenRecordPayment={(orderId, customerId) => handleOpenRecordPayment(orderId, customerId)}
            onSelectCustomer={(id) => setSelectedCustomerId(id)}
            initialSearchQuery={searchQuery}
          />
        )}

        {currentTab === 'customers' && (
          <CustomersView
            onSelectCustomer={(id) => setSelectedCustomerId(id)}
            onOpenQuickOrder={(id) => handleOpenQuickOrder(id)}
            onOpenAddCustomer={() => setCustomerFormOpen(true)}
            initialSearchQuery={searchQuery}
          />
        )}

        {currentTab === 'payments' && (
          <PaymentsView
            onOpenRecordPayment={() => handleOpenRecordPayment()}
            onSelectCustomer={(id) => setSelectedCustomerId(id)}
          />
        )}

        {currentTab === 'debt' && (
          <DebtLedgerView
            onOpenRecordPayment={(orderId, customerId) => handleOpenRecordPayment(orderId, customerId)}
            onSelectCustomer={(id) => setSelectedCustomerId(id)}
          />
        )}

        {currentTab === 'collections' && (
          <DailyCollectionsView />
        )}

        {currentTab === 'expenses' && (
          <ExpensesView
            onOpenRecordExpense={(period) => {
              setRecordExpenseDefaultPeriod(period || 'DAILY');
              setRecordExpenseOpen(true);
            }}
          />
        )}

        {currentTab === 'complaints' && (
          <ComplaintsView
            onOpenNewComplaint={() => handleOpenNewComplaint()}
            onSelectCustomer={(id) => setSelectedCustomerId(id)}
          />
        )}

        {currentTab === 'products' && (
          <ProductsPricingView />
        )}

        {currentTab === 'reports' && (
          <FinancialReportsView />
        )}
      </main>

      {/* Dialog Modals */}
      <QuickOrderModal
        isOpen={quickOrderOpen}
        onClose={() => setQuickOrderOpen(false)}
        preselectedCustomerId={quickOrderInitialCustomerId}
        onSuccessOrder={(newOrderId: string) => {
          setSelectedOrderId(newOrderId);
        }}
      />

      <CustomerFormModal
        isOpen={customerFormOpen}
        onClose={() => setCustomerFormOpen(false)}
        onSuccess={(newCustId: string) => {
          setSelectedCustomerId(newCustId);
        }}
      />

      <RecordPaymentModal
        isOpen={recordPaymentOpen}
        onClose={() => setRecordPaymentOpen(false)}
        preselectedOrderId={paymentPreselectedOrderId}
        preselectedCustomerId={paymentPreselectedCustomerId}
      />

      <RecordExpenseModal
        isOpen={recordExpenseOpen}
        onClose={() => setRecordExpenseOpen(false)}
        defaultPeriod={recordExpenseDefaultPeriod}
      />

      <ComplaintModal
        isOpen={complaintModalOpen}
        onClose={() => setComplaintModalOpen(false)}
        preselectedCustomerId={complaintPreselectedCustomerId}
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onOpenRecordPayment={(orderId, customerId) => {
          setSelectedOrderId(null);
          handleOpenRecordPayment(orderId, customerId);
        }}
        onCustomerSelect={(customerId) => {
          setSelectedOrderId(null);
          setSelectedCustomerId(customerId);
        }}
      />

      {/* Customer 360° Modal */}
      <Customer360Modal
        customerId={selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
        onTakeOrder={(cId) => {
          setSelectedCustomerId(null);
          handleOpenQuickOrder(cId);
        }}
        onRecordPayment={(cId) => {
          setSelectedCustomerId(null);
          handleOpenRecordPayment(undefined, cId);
        }}
        onSelectOrder={(ordId) => {
          setSelectedCustomerId(null);
          setSelectedOrderId(ordId);
        }}
      />

      {/* Mobile-First Sticky Bottom Navigation Bar */}
      <MobileBottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenQuickOrder={() => handleOpenQuickOrder()}
      />

    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BakeryStoreProvider>
          <BakeryAppContent />
        </BakeryStoreProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
