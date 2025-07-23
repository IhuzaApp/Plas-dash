import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import modular tab components
import ShopperWalletTab from './ShopperWalletTab';
import ShopperOrdersTab from './ShopperOrdersTab';
import TransactionsTab from './TransactionsTab';
import RatingsTab from './RatingsTab';
import TicketsTab from './TicketsTab';
import DeliveryIssuesTab from './DeliveryIssuesTab';
import InvoicesTab from './InvoicesTab';
import RevenuesTab from './RevenuesTab';

interface ShopperTabsProps {
  // Wallet tab
  wallet: any;
  totalEarnings: number;
  pendingPayouts: number;
  formatCurrency: (amount: string) => string;
  
  // Orders tab
  paginatedOrders: any[];
  ordersPage: number;
  totalOrders: number;
  setOrdersPage: (page: number) => void;
  
  // Transactions tab
  paginatedTransactions: any[];
  transactionsPage: number;
  totalTransactions: number;
  setTransactionsPage: (page: number) => void;
  formatTransactionId: (id: string, type: string, created_at: string) => string;
  
  // Ratings tab
  paginatedRatings: any[];
  ratingsPage: number;
  totalRatings: number;
  setRatingsPage: (page: number) => void;
  calculateAverageRating: (ratings: any[]) => string;
  detailedShopper: any;
  
  // Tickets tab
  paginatedTickets: any[];
  ticketsPage: number;
  totalTickets: number;
  setTicketsPage: (page: number) => void;
  
  // Delivery issues tab
  paginatedDeliveryIssues: any[];
  deliveryIssuesPage: number;
  totalDeliveryIssues: number;
  setDeliveryIssuesPage: (page: number) => void;
  
  // Invoices tab
  paginatedInvoices: any[];
  invoicesPage: number;
  totalInvoices: number;
  setInvoicesPage: (page: number) => void;
  
  // Revenues tab
  paginatedRevenues: any[];
  revenuesPage: number;
  totalRevenues: number;
  setRevenuesPage: (page: number) => void;
  
  // Pagination
  renderPagination: (currentPage: number, totalItems: number, onPageChange: (page: number) => void) => React.ReactNode;
}

const ShopperTabs: React.FC<ShopperTabsProps> = ({
  wallet,
  totalEarnings,
  pendingPayouts,
  formatCurrency,
  paginatedOrders,
  ordersPage,
  totalOrders,
  setOrdersPage,
  paginatedTransactions,
  transactionsPage,
  totalTransactions,
  setTransactionsPage,
  formatTransactionId,
  paginatedRatings,
  ratingsPage,
  totalRatings,
  setRatingsPage,
  calculateAverageRating,
  detailedShopper,
  paginatedTickets,
  ticketsPage,
  totalTickets,
  setTicketsPage,
  paginatedDeliveryIssues,
  deliveryIssuesPage,
  totalDeliveryIssues,
  setDeliveryIssuesPage,
  paginatedInvoices,
  invoicesPage,
  totalInvoices,
  setInvoicesPage,
  paginatedRevenues,
  revenuesPage,
  totalRevenues,
  setRevenuesPage,
  renderPagination,
}) => {
  return (
    <Tabs defaultValue="wallet" className="space-y-4">
      <TabsList className="grid w-full grid-cols-8">
        <TabsTrigger value="wallet">Wallet</TabsTrigger>
        <TabsTrigger value="orders">Orders</TabsTrigger>
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
        <TabsTrigger value="ratings">Ratings</TabsTrigger>
        <TabsTrigger value="tickets">Tickets</TabsTrigger>
        <TabsTrigger value="delivery-issues">Issues</TabsTrigger>
        <TabsTrigger value="invoices">Invoices</TabsTrigger>
        <TabsTrigger value="revenues">Revenues</TabsTrigger>
      </TabsList>

      {/* Wallet Tab */}
      <TabsContent value="wallet">
        <ShopperWalletTab
          wallet={wallet}
          totalEarnings={totalEarnings}
          pendingPayouts={pendingPayouts}
          formatCurrency={formatCurrency}
        />
      </TabsContent>

      {/* Orders Tab */}
      <TabsContent value="orders">
        <ShopperOrdersTab
          paginatedOrders={paginatedOrders}
          ordersPage={ordersPage}
          totalOrders={totalOrders}
          setOrdersPage={setOrdersPage}
          formatCurrency={formatCurrency}
          renderPagination={renderPagination}
        />
      </TabsContent>

      {/* Transactions Tab */}
      <TabsContent value="transactions">
        <TransactionsTab
          paginatedTransactions={paginatedTransactions}
          transactionsPage={transactionsPage}
          totalTransactions={totalTransactions}
          setTransactionsPage={setTransactionsPage}
          formatTransactionId={formatTransactionId}
          formatCurrency={formatCurrency}
          renderPagination={renderPagination}
        />
      </TabsContent>

      {/* Ratings Tab */}
      <TabsContent value="ratings">
        <RatingsTab
          paginatedRatings={paginatedRatings}
          ratingsPage={ratingsPage}
          totalRatings={totalRatings}
          setRatingsPage={setRatingsPage}
          calculateAverageRating={calculateAverageRating}
          detailedShopper={detailedShopper}
          renderPagination={renderPagination}
        />
      </TabsContent>

      {/* Tickets Tab */}
      <TabsContent value="tickets">
        <TicketsTab
          paginatedTickets={paginatedTickets}
          ticketsPage={ticketsPage}
          totalTickets={totalTickets}
          setTicketsPage={setTicketsPage}
          renderPagination={renderPagination}
        />
      </TabsContent>

      {/* Delivery Issues Tab */}
      <TabsContent value="delivery-issues">
        <DeliveryIssuesTab
          paginatedDeliveryIssues={paginatedDeliveryIssues}
          deliveryIssuesPage={deliveryIssuesPage}
          totalDeliveryIssues={totalDeliveryIssues}
          setDeliveryIssuesPage={setDeliveryIssuesPage}
          renderPagination={renderPagination}
        />
      </TabsContent>

      {/* Invoices Tab */}
      <TabsContent value="invoices">
        <InvoicesTab
          paginatedInvoices={paginatedInvoices}
          invoicesPage={invoicesPage}
          totalInvoices={totalInvoices}
          setInvoicesPage={setInvoicesPage}
          formatCurrency={formatCurrency}
          renderPagination={renderPagination}
        />
      </TabsContent>

      {/* Revenues Tab */}
      <TabsContent value="revenues">
        <RevenuesTab
          paginatedRevenues={paginatedRevenues}
          revenuesPage={revenuesPage}
          totalRevenues={totalRevenues}
          setRevenuesPage={setRevenuesPage}
          formatCurrency={formatCurrency}
          renderPagination={renderPagination}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ShopperTabs; 