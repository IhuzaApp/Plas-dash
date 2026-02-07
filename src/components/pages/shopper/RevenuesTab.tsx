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

function parseProducts(products: any): Array<{ product?: string; name?: string; quantity?: number; price?: number; final_price?: number }> {
  if (products == null) return [];
  if (Array.isArray(products)) return products;
  if (typeof products === 'string') {
    try {
      const parsed = JSON.parse(products);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  }
  return [];
}

function getOrderIdAndSource(revenue: any): { orderId: string; source: string } {
  const order = revenue.Order ?? revenue.order;
  const reelOrder = revenue.reel_orders ?? revenue.reel_order;
  const restaurantOrder = revenue.restaurant_orders ?? revenue.restaurant_order;
  const businessOrder = revenue.businessProductOrders ?? revenue.businessProductOrder;

  if (order?.OrderID != null) return { orderId: String(order.OrderID), source: 'Regular' };
  if (reelOrder?.OrderID != null) return { orderId: String(reelOrder.OrderID), source: 'Reel' };
  if (restaurantOrder?.OrderID != null) return { orderId: String(restaurantOrder.OrderID), source: 'Restaurant' };
  if (businessOrder?.OrderID != null) return { orderId: String(businessOrder.OrderID), source: 'Business' };
  // Fallback when nested relations are missing: use FK ids and infer source
  if (revenue.order_id) return { orderId: String(revenue.order_id).slice(0, 8), source: 'Regular' };
  if (revenue.reel_order_id) return { orderId: String(revenue.reel_order_id).slice(0, 8), source: 'Reel' };
  if (revenue.restaurant_order_id) return { orderId: String(revenue.restaurant_order_id).slice(0, 8), source: 'Restaurant' };
  if (revenue.businessOrder_Id) return { orderId: String(revenue.businessOrder_Id).slice(0, 8), source: 'Business' };
  return { orderId: '—', source: revenue.type || '—' };
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
              <TableHead>Source</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Commission %</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRevenues && paginatedRevenues.length > 0 ? (
              paginatedRevenues.map((revenue: any) => {
                const { orderId, source } = getOrderIdAndSource(revenue);
                const items = parseProducts(revenue.products);
                return (
                  <TableRow key={revenue.id}>
                    <TableCell className="font-medium">#{orderId}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {revenue.type || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(String(revenue.amount))}</TableCell>
                    <TableCell>{revenue.commission_percentage != null ? `${revenue.commission_percentage}%` : '—'}</TableCell>
                    <TableCell className="max-w-sm">
                      {items.length > 0 ? (
                        <ul className="list-disc list-inside space-y-0.5 text-xs">
                          {items.map((item, i) => {
                            const name = item.product ?? item.name ?? 'Item';
                            const qty = item.quantity ?? 1;
                            const price = item.final_price ?? item.price ?? 0;
                            return (
                              <li key={i}>
                                {name} × {qty}
                                {price ? ` @ ${formatCurrency(String(price))}` : ''}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{revenue.created_at ? format(new Date(revenue.created_at), 'MMM d, yyyy') : '—'}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
