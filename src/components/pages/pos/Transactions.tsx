import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Receipt, Filter, Search, Eye, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import OrderDetailDialog, { OrderDetails, OrderItem } from '@/components/order/OrderDetailDialog';
import { usePOSTransactions } from '@/hooks/useHasuraApi';
import { useSystemConfig } from '@/hooks/useHasuraApi';
import { formatCurrencyWithConfig } from '@/lib/utils';
import { useAuth } from '@/components/layout/RootLayout';

interface Transaction {
  id: string;
  transactionId: string;
  datetime: Date;
  amount: number;
  items: number;
  paymentMethod: 'cash' | 'card' | 'momo';
  status: 'completed' | 'refunded' | 'pending';
  cashier: string;
  originalData?: any; // Keep original checkout data for details
}

const Transactions = () => {
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');

  // Get session data for shop_id
  const { session } = useAuth();
  const shopId = session?.shop_id;

  // Fetch transactions data
  const { data: transactionsData, isLoading, error } = usePOSTransactions(shopId || '');
  const { data: systemConfig } = useSystemConfig();

  // Transform shopCheckouts data to match our interface
  const transactions: Transaction[] = transactionsData?.shopCheckouts?.map((checkout, index) => {
    const cartItems = JSON.parse(checkout.cartItems || '[]');
    const totalItems = cartItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    
    // Generate transaction ID: 0 + YYMM + sequence (2 digits)
    const createdDate = new Date(checkout.created_on || Date.now());
    const year = createdDate.getFullYear().toString().slice(-2); // Last 2 digits of year
    const month = (createdDate.getMonth() + 1).toString().padStart(2, '0'); // Month with leading zero
    
    // Use last 2 characters of checkout ID for unique sequence

    const sequence = checkout.number// Ensure 2 digits
    
    const transactionId = `0${year}${month}${sequence}`;
    
    return {
      id: checkout.id || 'unknown',
      transactionId: `TRX-${transactionId}`, // Always use our generated format
      datetime: createdDate,
      amount: parseFloat(checkout.total || '0'),
      items: totalItems,
      paymentMethod: (checkout.payment_method as 'cash' | 'card' | 'momo') || 'cash',
      status: 'completed' as const, // All saved checkouts are completed
      cashier: checkout.ProcessedBy?.fullnames || 'Unknown',
      originalData: checkout, // Keep original data for details
    };
  }) || [];

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter(transaction => {
    // Ensure transactionId is a string
    const transactionIdStr = typeof transaction.transactionId === 'string' ? transaction.transactionId : String(transaction.transactionId || '');
    const cashierStr = typeof transaction.cashier === 'string' ? transaction.cashier : String(transaction.cashier || '');
    
    const matchesSearch = transactionIdStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cashierStr.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPaymentMethod = paymentMethodFilter === 'all' || transaction.paymentMethod === paymentMethodFilter;
    return matchesSearch && matchesPaymentMethod;
  });

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'card':
        return <Badge className="bg-blue-500">Card</Badge>;
      case 'cash':
        return <Badge className="bg-green-500">Cash</Badge>;
      case 'momo':
        return <Badge className="bg-purple-500">MOMO</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'refunded':
        return <Badge className="bg-red-500">Refunded</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      default:
        return null;
    }
  };

  // Create transaction details from real data
  const createTransactionDetails = (transaction: Transaction): OrderDetails | null => {
    if (!transaction.originalData) return null;
    
    const cartItems = JSON.parse(transaction.originalData.cartItems || '[]');
    const items: OrderItem[] = cartItems.map((item: any, index: number) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return {
        id: `item${index}`,
        name: item.name,
        quantity,
        price: formatCurrencyWithConfig(price, systemConfig),
        total: formatCurrencyWithConfig(price * quantity, systemConfig),
      };
    });

    // Calculate subtotal, tax, delivery fee, and total
    const subtotal = cartItems.reduce((sum: number, item: any) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
    const tax = subtotal * 0.08;
    const deliveryFee = Number(transaction.originalData.delivery_fee || 0);
    const total = subtotal + tax + deliveryFee;

    return {
      id: transaction.transactionId,
      customer: transaction.originalData.ProcessedBy?.fullnames || 'Walk-in Customer',
      date: format(transaction.datetime, 'MMM dd, yyyy HH:mm'),
      total: formatCurrencyWithConfig(total, systemConfig),
      status: 'Completed',
      address: transaction.originalData.Shops?.address || 'N/A',
      phone: transaction.originalData.ProcessedBy?.phone || 'N/A',
      email: transaction.originalData.ProcessedBy?.email || 'N/A',
      paymentMethod: `${transaction.paymentMethod.toUpperCase()} Payment`,
      items,
      subtotal: formatCurrencyWithConfig(subtotal, systemConfig),
      tax: formatCurrencyWithConfig(tax, systemConfig),
      deliveryFee: formatCurrencyWithConfig(deliveryFee, systemConfig),
    };
  };

  const handleViewTransaction = (id: string) => {
    setSelectedTransaction(id);
    setIsDetailOpen(true);
  };

  const selectedTransactionDetails = (() => {
    if (!selectedTransaction) return null;
    const transaction = filteredTransactions.find(t => t.id === selectedTransaction);
    return transaction ? createTransactionDetails(transaction) : null;
  })();

  return (
    <AdminLayout>
      <PageHeader
        title="POS Transactions"
        description="View and manage all point of sale transactions"
        icon={<Receipt className="h-6 w-6" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex items-center relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search transactions..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="momo">MOMO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading transactions...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-red-500">
                      Error loading transactions: {error.message}
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No transactions found
                      {transactions.length > 0 && (
                        <div className="text-xs mt-2">
                          (Raw transactions: {transactions.length}, Filtered: {filteredTransactions.length})
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {/* Test row to verify table is working */}
                    {transactions.length === 0 && (
                      <TableRow>
                        <TableCell className="font-medium">TEST-001</TableCell>
                        <TableCell>Jan 01, 2025 12:00</TableCell>
                        <TableCell className="text-right">RWF 1,000</TableCell>
                        <TableCell className="text-right">1</TableCell>
                        <TableCell><Badge className="bg-green-500">Cash</Badge></TableCell>
                        <TableCell><Badge className="bg-green-500">Completed</Badge></TableCell>
                        <TableCell>Test User</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredTransactions.map(transaction => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.transactionId}</TableCell>
                    <TableCell>{format(transaction.datetime, 'MMM dd, yyyy HH:mm')}</TableCell>
                        <TableCell className="text-right">{formatCurrencyWithConfig(transaction.amount, systemConfig)}</TableCell>
                    <TableCell className="text-right">{transaction.items}</TableCell>
                    <TableCell>{getPaymentMethodBadge(transaction.paymentMethod)}</TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>{transaction.cashier}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewTransaction(transaction.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <OrderDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        order={selectedTransactionDetails}
      />
    </AdminLayout>
  );
};

export default Transactions;
