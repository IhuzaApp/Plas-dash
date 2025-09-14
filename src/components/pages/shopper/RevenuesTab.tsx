import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface RevenuesTabProps {
  paginatedRevenues: any[];
  revenuesPage: number;
  totalRevenues: number;
  setRevenuesPage: (page: number) => void;
  formatCurrency: (amount: string) => string;
  renderPagination: (
    currentPage: number,
    totalItems: number,
    onPageChange: (page: number) => void
  ) => React.ReactNode;
}

const RevenuesTab: React.FC<RevenuesTabProps> = ({
  paginatedRevenues,
  revenuesPage,
  totalRevenues,
  setRevenuesPage,
  formatCurrency,
  renderPagination,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Revenue History ({totalRevenues})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Commission %</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRevenues && paginatedRevenues.length > 0 ? (
              paginatedRevenues.map((revenue: any) => (
                <TableRow key={revenue.id}>
                  <TableCell className="font-medium">#{revenue.order_id}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {revenue.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(revenue.amount)}</TableCell>
                  <TableCell>{revenue.commission_percentage}%</TableCell>
                  <TableCell className="max-w-xs truncate">{revenue.products}</TableCell>
                  <TableCell>{format(new Date(revenue.created_at), 'MMM d, yyyy')}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {totalRevenues === 0 ? 'No revenues found' : 'Loading revenues...'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {renderPagination(revenuesPage, totalRevenues, setRevenuesPage)}
      </CardContent>
    </Card>
  );
};

export default RevenuesTab;
