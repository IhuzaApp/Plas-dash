import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ProcessPayoutDrawer from '@/components/wallet/ProcessPayoutDrawer';
import { useWalletTransactions, useSystemConfig, useWallets } from '@/hooks/useHasuraApi';
import { Loader2, Eye } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { formatDistanceToNow } from 'date-fns';
import { useGraphqlQuery } from '@/hooks/useGraphql';
import { GET_ALL_REVENUE, GET_ALL_REFUNDS } from '@/lib/graphql/queries';
import { isThisMonth, isThisWeek, isThisYear, parseISO } from 'date-fns';
import RevenueStats from '@/components/dashboard/RevenueStats';
import RevenueOverview from '@/components/dashboard/RevenueOverview';
import RecentTransactions from '@/components/dashboard/RecentTransactions';

// Helper functions moved outside components
const getStatusBadge = (status: string) => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case 'completed':
    case 'success':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getTypeBadge = (type: string) => {
  const typeLower = type.toLowerCase();
  switch (typeLower) {
    case 'reserve':
      return 'bg-blue-100 text-blue-800';
    case 'earnings':
      return 'bg-green-100 text-green-800';
    case 'payment':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const TransactionDetailsDialog = ({
  isOpen,
  onClose,
  transaction,
  formatCurrency,
}: {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  formatCurrency: (amount: string) => string;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="font-semibold">Transaction ID:</div>
            <div className="col-span-3">#{transaction.id}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="font-semibold">Date:</div>
            <div className="col-span-3">{format(new Date(transaction.created_at), 'PPpp')}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="font-semibold">Amount:</div>
            <div className="col-span-3">{formatCurrency(transaction.amount)}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="font-semibold">Type:</div>
            <div className="col-span-3">
              <Badge className={getTypeBadge(transaction.type)}>{transaction.type}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="font-semibold">Status:</div>
            <div className="col-span-3">
              <Badge className={getStatusBadge(transaction.status)}>{transaction.status}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="font-semibold">Wallet:</div>
            <div className="col-span-3">
              Wallet #{transaction.wallet_id}
              <div className="text-sm text-muted-foreground">
                Balance: {formatCurrency(transaction.Wallet?.available_balance || '0')}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="font-semibold">Wallet Owner:</div>
            <div className="col-span-3">
              {transaction.Wallet?.User ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {transaction.Wallet.User.profile_picture && (
                      <img
                        src={transaction.Wallet.User.profile_picture}
                        alt="Profile"
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span>{transaction.Wallet.User.name}</span>
                    {!transaction.Wallet.User.is_active && (
                      <Badge variant="outline" className="text-red-500">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Email: {transaction.Wallet.User.email}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Phone: {transaction.Wallet.User.phone}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Gender: {transaction.Wallet.User.gender}
                  </div>
                </div>
              ) : (
                'N/A'
              )}
            </div>
          </div>
          {transaction.Order && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-semibold">Related Order:</div>
                <div className="col-span-3">#{transaction.Order.OrderID}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-semibold">Order Status:</div>
                <div className="col-span-3">
                  <Badge>{transaction.Order.status}</Badge>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Wallets = () => {
  const { data: transactionsData, isLoading: isLoadingTransactions } = useWalletTransactions();
  const { data: systemConfig } = useSystemConfig();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const itemsPerPage = 5;
  const { data: walletsData, isLoading: isLoadingWallets } = useWallets();
  const { data: revenueData, isLoading: isLoadingRevenue } = useGraphqlQuery<any>(GET_ALL_REVENUE);
  const { data: refundsData, isLoading: isLoadingRefunds } = useGraphqlQuery<any>(GET_ALL_REFUNDS);
  const [revenueFilter, setRevenueFilter] = useState<'month' | 'week' | 'year'>('month');

  // Helper to filter revenue by selected period
  const filterRevenueByPeriod = (r: any) => {
    const date = parseISO(r.created_at);
    if (revenueFilter === 'month') return isThisMonth(date);
    if (revenueFilter === 'week') return isThisWeek(date);
    if (revenueFilter === 'year') return isThisYear(date);
    return true;
  };

  const allRevenue: any[] = revenueData?.Revenue || [];
  const totalRevenue = allRevenue.reduce((sum: number, r: any) => sum + parseFloat(r.amount), 0);
  const filteredRevenue = allRevenue.filter(filterRevenueByPeriod);
  const filteredRevenueTotal = filteredRevenue.reduce((sum: number, r: any) => sum + parseFloat(r.amount), 0);

  // Revenue by type breakdown
  const revenueByType: Record<string, number> = filteredRevenue.reduce((acc: Record<string, number>, r: any) => {
    const type = r.type || 'other';
    const amount = parseFloat(r.amount);
    acc[type] = (acc[type] || 0) + amount;
    return acc;
  }, {});

  // Pending payouts: sum of all refund amounts
  const allRefunds: any[] = refundsData?.Refunds || [];
  const pendingPayouts = allRefunds.reduce((sum: number, r: any) => sum + parseFloat(r.amount), 0);

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    const currency = systemConfig?.System_configuratioins[0]?.currency || 'RWF';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const filteredTransactions =
    transactionsData?.Wallet_Transactions.filter(transaction => {
      return (
        (statusFilter === 'all' ||
          transaction.status.toLowerCase() === statusFilter.toLowerCase()) &&
        (typeFilter === 'all' || transaction.type.toLowerCase() === typeFilter.toLowerCase())
      );
    }) || [];

  // Calculate pagination
  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const calculateTotalEarnings = (orders: any[], shopperId: string) => {
    if (!orders || !Array.isArray(orders)) return 0;

    const shopperOrders = orders.filter(order => order.shopper_id === shopperId);

    return shopperOrders.reduce((total, order) => {
      const status = order.status.toLowerCase();
      if (status === 'completed' || status === 'delivered') {
        const deliveryFee = parseFloat(order.delivery_fee || '0');
        const serviceFee = parseFloat(order.service_fee || '0');
        console.log('Order fees:', {
          orderId: order.id,
          shopperId: order.shopper_id,
          deliveryFee,
          serviceFee,
          status: order.status,
          total: deliveryFee + serviceFee,
        });
        return total + deliveryFee + serviceFee;
      }
      return total;
    }, 0);
  };

  const calculatePendingPayment = (availableBalance: string) => {
    return parseFloat(availableBalance);
  };

  return (
    <AdminLayout>
      <PageHeader title="Wallets" description="Manage company and shopper wallets." />

      <Tabs defaultValue="company">
        <TabsList className="mb-4">
          <TabsTrigger value="company">Company Wallet</TabsTrigger>
          <TabsTrigger value="shoppers">Shopper Wallets</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <RevenueStats
            isLoadingRevenue={isLoadingRevenue}
            isLoadingRefunds={isLoadingRefunds}
            totalRevenue={totalRevenue}
            filteredRevenueTotal={filteredRevenueTotal}
            pendingPayouts={pendingPayouts}
            revenueByType={revenueByType}
            revenueFilter={revenueFilter}
            setRevenueFilter={setRevenueFilter}
            formatCurrency={formatCurrency}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RevenueOverview filteredRevenue={filteredRevenue} />
            <RecentTransactions
              isLoadingTransactions={isLoadingTransactions}
              filteredTransactions={filteredTransactions}
              currentTransactions={currentTransactions}
              totalPages={totalPages}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              formatCurrency={formatCurrency}
              selectedTransaction={selectedTransaction}
              setSelectedTransaction={setSelectedTransaction}
            />
          </div>
        </TabsContent>

        <TabsContent value="shoppers">
          <div className="space-y-4">
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold">Shopper Wallets</h2>
              <ProcessPayoutDrawer>
                <Button>Process Payouts</Button>
              </ProcessPayoutDrawer>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shopper</TableHead>
                    <TableHead>Current Balance</TableHead>
                    <TableHead>Reserved Balance</TableHead>
                    <TableHead>Total Earnings</TableHead>
                    <TableHead>Pending Payment</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingWallets ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24">
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : walletsData?.Wallets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        No wallets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    walletsData?.Wallets.map((wallet: any) => {
                      const user = wallet.User;
                      if (!user) return null;

                      const allOrders = (walletsData as any)?.Orders || [];

                      console.log('Processing wallet:', {
                        userId: user.id,
                        shopperId: wallet.shopper_id,
                        orders: allOrders,
                      });

                      const totalEarnings = calculateTotalEarnings(allOrders, wallet.shopper_id);
                      const pendingPayment = calculatePendingPayment(
                        wallet.available_balance || '0'
                      );

                      const completedOrders = allOrders.filter(
                        (order: any) =>
                          order.shopper_id === wallet.shopper_id &&
                          order.status.toLowerCase() === 'delivered'
                      );

                      const totalOrders = allOrders.filter(
                        (order: any) => order.shopper_id === wallet.shopper_id
                      );

                      return (
                        <TableRow key={wallet.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {user.profile_picture && (
                                <img
                                  src={user.profile_picture}
                                  alt="Profile"
                                  className="w-8 h-8 rounded-full"
                                />
                              )}
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(wallet.available_balance || '0')}</TableCell>
                          <TableCell>{formatCurrency(wallet.reserved_balance || '0')}</TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {formatCurrency(totalEarnings.toString())}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              From {completedOrders.length} delivered orders
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Total orders: {totalOrders.length}
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(pendingPayment.toString())}</TableCell>
                          <TableCell>
                            {wallet.last_updated
                              ? formatDistanceToNow(new Date(wallet.last_updated), {
                                  addSuffix: true,
                                })
                              : 'Never'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.is_active ? 'default' : 'secondary'}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              View History
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default Wallets;
