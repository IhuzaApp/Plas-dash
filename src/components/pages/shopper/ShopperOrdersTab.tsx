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

interface ShopperOrdersTabProps {
  paginatedOrders: any[];
  ordersPage: number;
  totalOrders: number;
  setOrdersPage: (page: number) => void;
  formatCurrency: (amount: string) => string;
  renderPagination: (
    currentPage: number,
    totalItems: number,
    onPageChange: (page: number) => void
  ) => React.ReactNode;
}

const ShopperOrdersTab: React.FC<ShopperOrdersTabProps> = ({
  paginatedOrders,
  ordersPage,
  totalOrders,
  setOrdersPage,
  formatCurrency,
  renderPagination,
}) => {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Shop</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedOrders.map(order => (
            <TableRow key={`${order.orderType ?? 'regular'}-${order.id}`}>
              <TableCell className="font-medium">#{order.displayId ?? order.OrderID}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {(order.orderType ?? 'regular').charAt(0).toUpperCase() +
                    (order.orderType ?? 'regular').slice(1)}
                </Badge>
              </TableCell>
              <TableCell>{format(new Date(order.created_at || 0), 'MMM d, yyyy HH:mm')}</TableCell>
              <TableCell>{order.customerName ?? order.orderedBy?.name ?? order.User?.name}</TableCell>
              <TableCell>
                <Badge
                  className={
                    order.status === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                  }
                >
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell>{formatCurrency(order.total)}</TableCell>
              <TableCell>{order.shopName ?? order.Shop?.name}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {renderPagination(ordersPage, totalOrders, setOrdersPage)}
    </Card>
  );
};

export default ShopperOrdersTab;
