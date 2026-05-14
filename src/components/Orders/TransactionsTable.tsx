import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Search, CreditCard, ArrowRightLeft, Receipt, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface TransactionsTableProps {
  orders: any[];
  formatCurrency: (amount: string) => string;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ orders, formatCurrency }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const allTransactions = useMemo(() => {
    const transactions: any[] = [];

    orders.forEach(order => {
      // Wallet Transactions
      if (order.Wallet_Transactions && Array.isArray(order.Wallet_Transactions)) {
        order.Wallet_Transactions.forEach((tx: any) => {
          transactions.push({
            ...tx,
            source: 'Wallet',
            orderId: order.OrderID || order.id,
            orderType: order.type,
            parentOrder: order,
          });
        });
      }

      // Order Transactions
      if (order.order_transactions && Array.isArray(order.order_transactions)) {
        order.order_transactions.forEach((tx: any) => {
          transactions.push({
            ...tx,
            source: 'Order',
            orderId: order.OrderID || order.id,
            orderType: order.type,
            parentOrder: order,
          });
        });
      }

      // Business Transactions
      if (order.businessTransactions && Array.isArray(order.businessTransactions)) {
        order.businessTransactions.forEach((tx: any) => {
          transactions.push({
            ...tx,
            source: 'Business',
            orderId: order.OrderID || order.id,
            orderType: order.type,
            parentOrder: order,
          });
        });
      }
    });

    // Sort by date desc
    return transactions.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [orders]);

  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return allTransactions;
    const term = searchTerm.toLowerCase();
    return allTransactions.filter(
      tx =>
        tx.id?.toLowerCase().includes(term) ||
        tx.orderId?.toString().toLowerCase().includes(term) ||
        tx.reference_id?.toLowerCase().includes(term) ||
        tx.description?.toLowerCase().includes(term) ||
        tx.type?.toLowerCase().includes(term) ||
        tx.phone?.toLowerCase().includes(term)
    );
  }, [allTransactions, searchTerm]);

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'success') return 'bg-green-100 text-green-800';
    if (s === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (s === 'failed' || s === 'error') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'Wallet':
        return <CreditCard className="h-4 w-4 text-blue-500" />;
      case 'Order':
        return <Receipt className="h-4 w-4 text-purple-500" />;
      case 'Business':
        return <ArrowRightLeft className="h-4 w-4 text-emerald-500" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions by ID, Order ID, reference, or description..."
            className="pl-8"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx, idx) => (
                <TableRow key={tx.id || idx}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {format(new Date(tx.created_at), 'MMM d, HH:mm')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-medium">
                      #{tx.orderId?.toString().split('-')[0]}
                      <Badge variant="outline" className="text-[9px] px-1 h-3.5 uppercase">
                        {tx.orderType}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getSourceIcon(tx.source)}
                      <span className="text-xs">{tx.source}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs capitalize">{tx.type || tx.action || '—'}</span>
                  </TableCell>
                  <TableCell className="font-semibold text-sm">
                    {tx.amount ? formatCurrency(tx.amount) : '—'}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {tx.reference_id || tx.phone || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(tx.status)} text-[10px] h-5`}>
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                    {tx.description || '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default TransactionsTable;
