import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOrders, useSystemConfig } from '@/hooks/useHasuraApi';
import { Loader2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const orderStatusColors: Record<string, string> = {
  delivered: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  shopping: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-blue-100 text-blue-800',
  on_the_way: 'bg-blue-100 text-blue-800',
};

const RecentOrders = () => {
  const { data, isLoading } = useOrders();
  const { data: systemConfig } = useSystemConfig();

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    const currency = systemConfig?.System_configuratioins[0]?.currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(num);
  };

  const getRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get the 5 most recent orders
  const recentOrders = data?.Orders
    ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    ?.slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : recentOrders && recentOrders.length > 0 ? (
          <div className="space-y-0">
            {recentOrders.map(order => (
              <div
                key={order.id}
                className="flex items-center justify-between px-6 py-3 hover:bg-muted/50"
              >
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">#{order.OrderID}</span>
                    <Badge
                      className={orderStatusColors[order.status.toLowerCase()]}
                      variant="outline"
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {order.User?.name || 'Unknown Customer'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(order.total)}</div>
                  <div className="text-xs text-muted-foreground">
                    {getRelativeTime(order.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            No recent orders found
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentOrders;
