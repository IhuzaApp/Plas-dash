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
  BarChart,
  Bar,
  Cell,
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
import {
  useSystemConfig,
  useWallets,
  useAllWalletsWithTransactions,
  usePersonalWallets,
  useBusinessWallets,
} from '@/hooks/useHasuraApi';
import { Loader2, Eye, Wallet, User, Building2 } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { formatDistanceToNow } from 'date-fns';

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

// Combined overview: stats + graphs for all wallet types + transactions
function WalletsOverviewTab({ formatCurrency }: { formatCurrency: (amount: string) => string }) {
  const { data: walletsWithTx, isLoading: loadingShopper } = useAllWalletsWithTransactions();
  const { data: personalData, isLoading: loadingPersonal } = usePersonalWallets();
  const { data: businessData, isLoading: loadingBusiness } = useBusinessWallets();

  const shopperWallets = walletsWithTx?.Wallets ?? [];
  const personalWallets = personalData?.personalWallet ?? [];
  const businessWallets = businessData?.business_wallet ?? [];

  const shopperAvailable = shopperWallets.reduce(
    (s, w) => s + parseFloat(w.available_balance || '0'),
    0
  );
  const shopperReserved = shopperWallets.reduce(
    (s, w) => s + parseFloat(w.reserved_balance || '0'),
    0
  );
  const personalTotal = personalWallets.reduce((s, w) => s + parseFloat(w.balance || '0'), 0);
  const businessTotal = businessWallets.reduce((s, w) => s + parseFloat(w.amount || '0'), 0);

  const allShopperTx: any[] = shopperWallets.flatMap(w =>
    (w.Wallet_Transactions || []).map((t: any) => ({ ...t, _source: 'shopper', _walletId: w.id }))
  );
  const allBusinessTx: any[] = businessWallets.flatMap(w =>
    (w.businessTransactions || []).map((t: any) => ({
      ...t,
      _source: 'business',
      _walletId: w.id,
    }))
  );
  const combinedTransactions = [...allShopperTx, ...allBusinessTx].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );

  const [txPage, setTxPage] = useState(1);
  const txPerPage = 10;
  const txTotalPages = Math.ceil(combinedTransactions.length / txPerPage);
  const currentTx = combinedTransactions.slice((txPage - 1) * txPerPage, txPage * txPerPage);

  const isLoading = loadingShopper || loadingPersonal || loadingBusiness;
  const chartData = [
    { name: 'Shopper (available)', value: shopperAvailable, fill: '#3b82f6' },
    { name: 'Shopper (reserved)', value: shopperReserved, fill: '#f59e0b' },
    { name: 'Personal', value: personalTotal, fill: '#10b981' },
    { name: 'Business', value: businessTotal, fill: '#8b5cf6' },
  ].filter(d => d.value > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Wallet className="h-4 w-4" /> Shopper Wallets
            </div>
            <div className="text-2xl font-bold mt-1">
              {formatCurrency(shopperAvailable.toString())}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Available · {shopperWallets.length} wallet(s)
            </p>
            <p className="text-xs text-muted-foreground">
              Reserved: {formatCurrency(shopperReserved.toString())}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" /> Personal Wallets
            </div>
            <div className="text-2xl font-bold mt-1">
              {formatCurrency(personalTotal.toString())}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{personalWallets.length} wallet(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Building2 className="h-4 w-4" /> Business Wallets
            </div>
            <div className="text-2xl font-bold mt-1">
              {formatCurrency(businessTotal.toString())}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{businessWallets.length} wallet(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">Total balance</div>
            <div className="text-2xl font-bold mt-1">
              {formatCurrency(
                (shopperAvailable + shopperReserved + personalTotal + businessTotal).toString()
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Balance by type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${v}`)} />
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(String(v)), 'Balance']}
                    labelFormatter={l => l}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All transactions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Shopper wallet and business wallet transactions
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTx.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No transactions
                  </TableCell>
                </TableRow>
              ) : (
                currentTx.map((tx: any) => (
                  <TableRow key={tx._source === 'shopper' ? tx.id : `b-${tx.id}`}>
                    <TableCell className="text-muted-foreground">
                      {tx.created_at ? format(new Date(tx.created_at), 'MMM d, yyyy HH:mm') : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tx._source === 'shopper' ? 'default' : 'secondary'}>
                        {tx._source === 'shopper' ? 'Shopper' : 'Business'}
                      </Badge>
                    </TableCell>
                    <TableCell>{tx.type || tx.action || '—'}</TableCell>
                    <TableCell>
                      {tx.amount != null ? formatCurrency(String(tx.amount)) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(tx.status)} variant="secondary">
                        {tx.status || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {tx.description || '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {txTotalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                disabled={txPage <= 1}
                onClick={() => setTxPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="mx-4 flex items-center">
                Page {txPage} of {txTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={txPage >= txTotalPages}
                onClick={() => setTxPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Personal wallets tab
function PersonalWalletsTab({ formatCurrency }: { formatCurrency: (amount: string) => string }) {
  const { data, isLoading } = usePersonalWallets();
  const wallets = data?.personalWallet ?? [];
  const [page, setPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.ceil(wallets.length / perPage);
  const current = wallets.slice((page - 1) * perPage, page * perPage);
  const totalBalance = wallets.reduce((s, w) => s + parseFloat(w.balance || '0'), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">Total wallets</div>
            <div className="text-2xl font-bold mt-1">{wallets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">Total balance</div>
            <div className="text-2xl font-bold mt-1">{formatCurrency(totalBalance.toString())}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">Active users</div>
            <div className="text-2xl font-bold mt-1">
              {wallets.filter(w => w.Users?.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {current.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No personal wallets found
                </TableCell>
              </TableRow>
            ) : (
              current.map((w: any) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.Users?.name || '—'}</TableCell>
                  <TableCell>{w.Users?.email || '—'}</TableCell>
                  <TableCell>{w.Users?.phone || '—'}</TableCell>
                  <TableCell>{formatCurrency(w.balance || '0')}</TableCell>
                  <TableCell>
                    <Badge variant={w.Users?.is_active ? 'default' : 'secondary'}>
                      {w.Users?.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {w.updated_at
                      ? formatDistanceToNow(new Date(w.updated_at), { addSuffix: true })
                      : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={perPage}
            onPageChange={setPage}
            onPageSizeChange={() => { }}
            totalItems={wallets.length}
          />
        )}
      </Card>
    </div>
  );
}

// Business wallets tab
function BusinessWalletsTab({ formatCurrency }: { formatCurrency: (amount: string) => string }) {
  const { data, isLoading } = useBusinessWallets();
  const wallets = data?.business_wallet ?? [];
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const perPage = 10;
  const totalPages = Math.ceil(wallets.length / perPage);
  const current = wallets.slice((page - 1) * perPage, page * perPage);
  const totalAmount = wallets.reduce((s, w) => s + parseFloat(w.amount || '0'), 0);
  const totalTx = wallets.reduce((s, w) => s + (w.businessTransactions?.length || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">Total wallets</div>
            <div className="text-2xl font-bold mt-1">{wallets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">Total balance</div>
            <div className="text-2xl font-bold mt-1">{formatCurrency(totalAmount.toString())}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">Total transactions</div>
            <div className="text-2xl font-bold mt-1">{totalTx}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business ID</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Transactions</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {current.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No business wallets found
                </TableCell>
              </TableRow>
            ) : (
              current.map((w: any) => (
                <React.Fragment key={w.id}>
                  <TableRow>
                    <TableCell className="font-medium font-mono text-xs">
                      {w.business_id?.slice(0, 8) || '—'}…
                    </TableCell>
                    <TableCell>{formatCurrency(w.amount || '0')}</TableCell>
                    <TableCell>{w.businessTransactions?.length || 0}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {w.created_at ? format(new Date(w.created_at), 'MMM d, yyyy') : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {w.updated_at
                        ? formatDistanceToNow(new Date(w.updated_at), { addSuffix: true })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {expandedId === w.id ? 'Hide' : 'Transactions'}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedId === w.id && w.businessTransactions?.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-muted/50 p-0">
                        <div className="p-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Description</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {w.businessTransactions.map((tx: any) => (
                                <TableRow key={tx.id}>
                                  <TableCell className="text-muted-foreground">
                                    {tx.created_at
                                      ? format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')
                                      : '—'}
                                  </TableCell>
                                  <TableCell>{tx.type || '—'}</TableCell>
                                  <TableCell>{tx.action || '—'}</TableCell>
                                  <TableCell>
                                    <Badge
                                      className={getStatusBadge(tx.status)}
                                      variant="secondary"
                                    >
                                      {tx.status || '—'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="max-w-[180px] truncate">
                                    {tx.description || '—'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={perPage}
            onPageChange={setPage}
            onPageSizeChange={() => { }}
            totalItems={wallets.length}
          />
        )}
      </Card>
    </div>
  );
}

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
  const { data: systemConfig } = useSystemConfig();
  const { data: walletsData, isLoading: isLoadingWallets } = useWallets();

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

  const calculateTotalEarnings = (orders: any[], shopperId: string) => {
    if (!orders || !Array.isArray(orders)) return 0;

    const shopperOrders = orders.filter(order => order.shopper_id === shopperId);

    return shopperOrders.reduce((total, order) => {
      const status = order.status.toLowerCase();
      if (status === 'completed' || status === 'delivered') {
        const deliveryFee = parseFloat(order.delivery_fee || '0');
        const serviceFee = parseFloat(order.service_fee || '0');
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
      <PageHeader
        title="Wallet Operations"
        description="Manage wallet operations and payouts."
        actions={
          <ProcessPayoutDrawer>
            <Button>Process Payouts</Button>
          </ProcessPayoutDrawer>
        }
      />

      <Tabs defaultValue="wallets">
        <TabsList className="mb-4">
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
          <TabsTrigger value="shoppers">Wallets</TabsTrigger>
          <TabsTrigger value="personal">Personal Wallets</TabsTrigger>
          <TabsTrigger value="business">Business Wallets</TabsTrigger>
        </TabsList>

        <TabsContent value="wallets">
          <WalletsOverviewTab formatCurrency={formatCurrency} />
        </TabsContent>

        <TabsContent value="personal">
          <PersonalWalletsTab formatCurrency={formatCurrency} />
        </TabsContent>

        <TabsContent value="business">
          <BusinessWalletsTab formatCurrency={formatCurrency} />
        </TabsContent>

        <TabsContent value="shoppers">
          <div className="space-y-4">
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold">Wallets</h2>
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
