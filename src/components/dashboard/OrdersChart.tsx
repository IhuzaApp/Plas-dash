import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useOrders } from '@/hooks/useHasuraApi';
import { format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';

// Custom tooltip for showing shop names
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length && payload[0].payload.shops) {
    return (
      <div className="rounded border bg-white p-3 shadow">
        <div className="font-semibold mb-1">{label}</div>
        <div>
          Orders: <span className="font-bold">{payload[0].value}</span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">Shops:</div>
        <ul className="text-xs pl-3 list-disc">
          {payload[0].payload.shops.map((shop: string) => (
            <li key={shop}>{shop}</li>
          ))}
        </ul>
      </div>
    );
  }
  return null;
};

const RevenueChart = () => {
  const { data, isLoading } = useOrders();

  // Group orders by day and sum revenue/orders
  const chartData = React.useMemo(() => {
    if (!data?.Orders) return [];
    const grouped: Record<string, { orders: number; shops: Set<string> }> = {};
    data.Orders.forEach(order => {
      const day = format(parseISO(order.created_at), 'yyyy-MM-dd');
      if (!grouped[day]) grouped[day] = { orders: 0, shops: new Set() };
      grouped[day].orders += 1;
      const shopName =
        (order as any).Shop && typeof (order as any).Shop.name === 'string'
          ? (order as any).Shop.name
          : null;
      if (shopName) {
        grouped[day].shops.add(shopName);
      }
    });
    // Convert to array sorted by day
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, { orders, shops }]) => ({
        name: format(parseISO(day), 'MMM d'),
        orders,
        shops: Array.from(shops).length > 0 ? Array.from(shops) : ['N/A'],
      }));
  }, [data]);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Orders Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <AreaChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
