import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const orderStatusColors: Record<string, string> = {
  completed: 'bg-green-500',
  active: 'bg-blue-500',
  pending: 'bg-yellow-500',
  cancelled: 'bg-red-500',
};

interface Order {
  id: string;
  customer: string;
  total: string;
  status: 'completed' | 'active' | 'pending' | 'cancelled';
  date: string;
}

const recentOrders: Order[] = [
  {
    id: 'ORD-7892',
    customer: 'John Smith',
    total: '$56.34',
    status: 'completed',
    date: 'Just now',
  },
  {
    id: 'ORD-7891',
    customer: 'Jane Davis',
    total: '$125.99',
    status: 'active',
    date: '5 min ago',
  },
  {
    id: 'ORD-7890',
    customer: 'Robert Johnson',
    total: '$42.50',
    status: 'pending',
    date: '10 min ago',
  },
  {
    id: 'ORD-7889',
    customer: 'Emily Wilson',
    total: '$75.20',
    status: 'completed',
    date: '25 min ago',
  },
  {
    id: 'ORD-7888',
    customer: 'Michael Brown',
    total: '$19.99',
    status: 'cancelled',
    date: '1 hour ago',
  },
];

const RecentOrders = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="space-y-0">
          {recentOrders.map(order => (
            <div
              key={order.id}
              className="flex items-center justify-between px-6 py-3 hover:bg-muted/50"
            >
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{order.id}</span>
                  <Badge
                    className={`${orderStatusColors[order.status]} text-white`}
                    variant="outline"
                  >
                    {order.status}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">{order.customer}</span>
              </div>
              <div className="text-right">
                <div className="font-medium">{order.total}</div>
                <div className="text-xs text-muted-foreground">{order.date}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentOrders;
