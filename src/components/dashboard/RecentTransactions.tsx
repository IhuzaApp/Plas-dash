import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Eye } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import TransactionDetailsDialog from './TransactionDetailsDialog';

interface RecentTransactionsProps {
  isLoadingTransactions: boolean;
  filteredTransactions: any[];
  currentTransactions: any[];
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  formatCurrency: (amount: string) => string;
  selectedTransaction: any;
  setSelectedTransaction: (t: any) => void;
}

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

const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  isLoadingTransactions,
  filteredTransactions,
  currentTransactions,
  totalPages,
  currentPage,
  setCurrentPage,
  totalItems,
  itemsPerPage,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  formatCurrency,
  selectedTransaction,
  setSelectedTransaction,
}) => (
  <Card className="col-span-1 md:col-span-2">
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>Recent Transactions</CardTitle>
      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="reserve">Reserve</SelectItem>
            <SelectItem value="earnings">Earnings</SelectItem>
            <SelectItem value="payment">Payment</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Order ID</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoadingTransactions ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                </div>
              </TableCell>
            </TableRow>
          ) : filteredTransactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No transactions found
              </TableCell>
            </TableRow>
          ) : (
            currentTransactions.map((transaction: any) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">#{transaction.id.slice(-8)}</TableCell>
                <TableCell>
                  {format(new Date(transaction.created_at), 'MMM d, yyyy HH:mm')}
                </TableCell>
                <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                <TableCell>
                  <Badge className={getTypeBadge(transaction.type)}>
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusBadge(transaction.status)}>
                    {transaction.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {transaction.Order ? `#${transaction.Order.OrderID}` : 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTransaction(transaction)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View More
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {!isLoadingTransactions && filteredTransactions.length > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            pageSize={itemsPerPage}
            onPageSizeChange={newPageSize => {
              setCurrentPage(1);
              // Since itemsPerPage is a constant, we don't actually change it
              // but we need to provide this prop to satisfy the type
            }}
          />
        </div>
      )}
      {selectedTransaction && (
        <TransactionDetailsDialog
          isOpen={!!selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          transaction={selectedTransaction}
          formatCurrency={formatCurrency}
        />
      )}
    </CardContent>
  </Card>
);

export default RecentTransactions; 