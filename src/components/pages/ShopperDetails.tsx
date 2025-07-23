import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import {
  useShopperDetails,
  useShopperWallet,
  useShopperOrders,
  useUpdateShopperStatus,
  useShopperFullDetails,
  type Order,
} from '@/hooks/useShoppers';
import { useSystemConfig } from '@/hooks/useHasuraApi';

// Import modular components
import ShopperProfileCard from './shopper/ShopperProfileCard';
import ShopperStatsOverview from './shopper/ShopperStatsOverview';
import ShopperActions from './shopper/ShopperActions';
import ShopperTabs from './shopper/ShopperTabs';

const ITEMS_PER_PAGE = 10;

type uuid = string;

interface ShopperDetailsProps {
  shopperId: uuid;
}

const ShopperDetails: React.FC<ShopperDetailsProps> = ({ shopperId }) => {
  const router = useRouter();
  const { data: shopperData, isLoading: isLoadingShopper } = useShopperDetails(shopperId);
  const { data: walletData, isLoading: isLoadingWallet } = useShopperWallet(shopperId);
  const { data: ordersData, isLoading: isLoadingOrders } = useShopperOrders(shopperId);
  const { data: systemConfig } = useSystemConfig();
  const userId = shopperData?.shoppers[0]?.user_id;
  const { data: fullDetails, isLoading: isLoadingFullDetails } = useShopperFullDetails(
    userId || ''
  );
  const updateShopperStatus = useUpdateShopperStatus();

  const handleBackToShoppers = () => {
    router.push('/shoppers');
  };

  const shopper = shopperData?.shoppers[0];
  const user = shopperData?.Users[0];
  const wallet = walletData?.Wallets[0];
  const orders = ordersData?.Orders || [];
  const detailedShopper = fullDetails?.shoppers[0];

  const [ordersPage, setOrdersPage] = useState(1);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [ratingsPage, setRatingsPage] = useState(1);
  const [ticketsPage, setTicketsPage] = useState(1);
  const [deliveryIssuesPage, setDeliveryIssuesPage] = useState(1);
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [revenuesPage, setRevenuesPage] = useState(1);

  const formatTransactionId = (id: string, type: string, created_at: string) => {
    const date = new Date(created_at);
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${type.toUpperCase()}-${year}${month}${day}-${hour}${minute}`;
  };

  const formatCurrency = (amount: string) => {
    const currency = systemConfig?.System_configuratioins[0]?.currency || 'RWF';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount || '0'));
  };

  const handleApprove = async () => {
    if (shopper) {
      await updateShopperStatus.mutateAsync({
        shopper_id: shopper.id,
        status: 'approved',
        active: true,
        background_check_completed: true,
      });
    }
  };

  const handleReject = async () => {
    if (shopper) {
      await updateShopperStatus.mutateAsync({
        shopper_id: shopper.id,
        status: 'rejected',
        active: false,
        background_check_completed: false,
      });
    }
  };

  const calculateAverageRating = (ratings: any[]) => {
    if (!ratings || ratings.length === 0) return '0.0';
    const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    return (total / ratings.length).toFixed(1);
  };

  const paginateData = <T extends any>(data: T[], page: number): T[] => {
    if (!data || data.length === 0) return [];
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return data.slice(start, end);
  };

  const getPageCount = (totalItems: number) => Math.ceil(totalItems / ITEMS_PER_PAGE);

  const renderPagination = (
    currentPage: number,
    totalItems: number,
    onPageChange: (page: number) => void
  ) => {
    const pageCount = getPageCount(totalItems);
    if (pageCount <= 1) return null;

    return (
      <div className="flex items-center justify-between space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="flex items-center space-x-1">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map(page => (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === pageCount}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  // Calculate earnings and payouts
  const totalEarnings = orders
    .filter(order => order.status === 'delivered')
    .reduce((sum, order) => sum + parseFloat(order.delivery_fee || '0') + parseFloat(order.service_fee || '0'), 0);

  const pendingPayouts = parseFloat(wallet?.available_balance || '0');

  // Ensure data is properly structured
  const ratings = detailedShopper?.User?.Ratings || [];
  const tickets = detailedShopper?.User?.tickets || [];
  const deliveryIssues = detailedShopper?.User?.Delivery_Issues || [];
  const invoices = detailedShopper?.User?.Invoices || [];
  const revenues = detailedShopper?.Revenues || [];

  // Get paginated data
  const paginatedOrders = paginateData(orders, ordersPage);
  const paginatedTransactions = paginateData(wallet?.Wallet_Transactions || [], transactionsPage);
  const paginatedRatings = paginateData(ratings, ratingsPage);
  const paginatedTickets = paginateData(tickets, ticketsPage);
  const paginatedDeliveryIssues = paginateData(deliveryIssues, deliveryIssuesPage);
  const paginatedInvoices = paginateData(invoices, invoicesPage);
  const paginatedRevenues = paginateData(revenues, revenuesPage);



  // Calculate statistics
  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t: any) => t.status !== 'closed')?.length || 0;
  const totalDeliveryIssues = deliveryIssues.length;
  const resolvedDeliveryIssues = deliveryIssues.filter((i: any) => i.status === 'resolved')?.length || 0;
  const totalInvoices = invoices.length;
  
  // Calculate total revenue from both delivered orders and Revenues table
  const orderRevenue = totalEarnings;
  const revenuesTableTotal = revenues.reduce((sum: number, r: any) => sum + parseFloat(r.amount || '0'), 0) || 0;
  const totalRevenue = orderRevenue + revenuesTableTotal;

  // Loading and error states
  if (isLoadingShopper || isLoadingWallet || isLoadingOrders || isLoadingFullDetails) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!shopper || !user) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
          <p className="text-red-500">Plasa not found.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToShoppers}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shoppers
          </Button>
        </div>

        {/* Header Section */}
        <PageHeader
          title={shopper.full_name}
          description={`${user.email} • ${user.phone}`}
          actions={
            <ShopperActions
              shopper={shopper}
              detailedShopper={detailedShopper}
              isLoadingFullDetails={isLoadingFullDetails}
              handleApprove={handleApprove}
              handleReject={handleReject}
              calculateAverageRating={calculateAverageRating}
            />
          }
        />

        {/* Profile Overview */}
        <ShopperProfileCard shopper={shopper} user={user} />

        {/* Statistics Overview */}
        <ShopperStatsOverview
          orders={orders}
          detailedShopper={detailedShopper}
          totalRevenue={totalRevenue}
          openTickets={openTickets}
          formatCurrency={formatCurrency}
          calculateAverageRating={calculateAverageRating}
        />



        {/* Main Content Tabs */}
        <ShopperTabs
          wallet={wallet}
          totalEarnings={totalEarnings}
          pendingPayouts={pendingPayouts}
          formatCurrency={formatCurrency}
          paginatedOrders={paginatedOrders}
          ordersPage={ordersPage}
          totalOrders={orders.length}
          setOrdersPage={setOrdersPage}
          paginatedTransactions={paginatedTransactions}
          transactionsPage={transactionsPage}
          totalTransactions={wallet?.Wallet_Transactions?.length || 0}
          setTransactionsPage={setTransactionsPage}
          formatTransactionId={formatTransactionId}
          paginatedRatings={paginatedRatings}
          ratingsPage={ratingsPage}
          totalRatings={ratings.length}
          setRatingsPage={setRatingsPage}
          calculateAverageRating={calculateAverageRating}
          detailedShopper={detailedShopper}
          paginatedTickets={paginatedTickets}
          ticketsPage={ticketsPage}
          totalTickets={totalTickets}
          setTicketsPage={setTicketsPage}
          paginatedDeliveryIssues={paginatedDeliveryIssues}
          deliveryIssuesPage={deliveryIssuesPage}
          totalDeliveryIssues={totalDeliveryIssues}
          setDeliveryIssuesPage={setDeliveryIssuesPage}
          paginatedInvoices={paginatedInvoices}
          invoicesPage={invoicesPage}
          totalInvoices={totalInvoices}
          setInvoicesPage={setInvoicesPage}
          paginatedRevenues={paginatedRevenues}
          revenuesPage={revenuesPage}
          totalRevenues={revenues.length}
          setRevenuesPage={setRevenuesPage}
          renderPagination={renderPagination}
        />
      </div>
    </AdminLayout>
  );
};

export default ShopperDetails;
