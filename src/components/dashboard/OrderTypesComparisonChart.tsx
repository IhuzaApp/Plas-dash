'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Loader2, ShoppingBag } from 'lucide-react';
import { CHART_COLORS } from '@/lib/chartColors';

const ORDER_LABELS: Record<string, string> = {
  regular: 'Regular',
  reel: 'Reel',
  restaurant: 'Restaurant',
  business: 'Business',
};

export default function OrderTypesComparisonChart() {
  const { orderBreakdown, isLoading } = useDashboardData();

  const chartData = React.useMemo(() => {
    if (!orderBreakdown) return [];
    return Object.entries(orderBreakdown).map(([type, count]) => ({
      name: ORDER_LABELS[type] ?? type,
      orders: count,
      fill: getFill(type),
    }));
  }, [orderBreakdown]);

  function getFill(type: string): string {
    switch (type) {
      case 'regular':
        return CHART_COLORS.green;
      case 'reel':
        return CHART_COLORS.blue;
      case 'restaurant':
        return CHART_COLORS.red;
      case 'business':
        return CHART_COLORS.orange;
      default:
        return CHART_COLORS.yellow;
    }
  }

  const TICK_FILL = 'hsl(var(--foreground) / 0.9)';
  const GRID_STROKE = 'hsl(var(--foreground) / 0.15)';

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShoppingBag className="h-4 w-4" />
          Order Types Comparison
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Reel orders, restaurant orders, business orders, and regular orders.
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No order data
              </div>
            ) : (
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID_STROKE} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: TICK_FILL }}
                  axisLine={{ stroke: GRID_STROKE }}
                  tickLine={{ stroke: GRID_STROKE }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={55}
                  tick={{ fontSize: 12, fill: TICK_FILL }}
                  axisLine={{ stroke: GRID_STROKE }}
                  tickLine={{ stroke: GRID_STROKE }}
                />
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString(), 'Orders']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend formatter={value => <span style={{ color: TICK_FILL }}>{value}</span>} />
                <Bar dataKey="orders" name="Orders" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} stroke={entry.fill} strokeWidth={1} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
