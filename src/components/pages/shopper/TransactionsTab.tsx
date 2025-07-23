import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

interface TransactionsTabProps {
  paginatedTransactions: any[];
  transactionsPage: number;
  totalTransactions: number;
  setTransactionsPage: (page: number) => void;
  formatTransactionId: (id: string, type: string, created_at: string) => string;
  formatCurrency: (amount: string) => string;
  renderPagination: (
    currentPage: number,
    totalItems: number,
    onPageChange: (page: number) => void
  ) => React.ReactNode;
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({
  paginatedTransactions,
  transactionsPage,
  totalTransactions,
  setTransactionsPage,
  formatTransactionId,
  formatCurrency,
  renderPagination,
}) => {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Related Order</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedTransactions.map(transaction => (
            <TableRow key={transaction.id}>
              <TableCell className="font-medium">
                {formatTransactionId(transaction.id, transaction.type, transaction.created_at)}
              </TableCell>
              <TableCell>{format(new Date(transaction.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
              <TableCell className="capitalize">{transaction.type}</TableCell>
              <TableCell>{formatCurrency(transaction.amount)}</TableCell>
              <TableCell>
                <Badge
                  className={
                    transaction.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : transaction.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }
                >
                  {transaction.status}
                </Badge>
              </TableCell>
              <TableCell>
                {transaction.related_order_id && transaction.Order ? (
                  <Button variant="ghost" size="sm">
                    #{transaction.Order.OrderID} ({transaction.Order.status})
                  </Button>
                ) : (
                  'N/A'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {renderPagination(transactionsPage, totalTransactions, setTransactionsPage)}
    </Card>
  );
};

export default TransactionsTab;
