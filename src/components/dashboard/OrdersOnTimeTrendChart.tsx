'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { Loader2, TrendingUp } from 'lucide-react';
import { CHART_COLORS } from '@/lib/chartColors';
import { Button } from '@/components/ui/button';

const TICK_FILL = 'hsl(var(--foreground) / 0.9)';
const GRID_STROKE = 'hsl(var(--foreground) / 0.15)';

type GroupBy = 'day' | 'week' | 'month' | 'year';

interface TrendDataPoint {
  period: string;
  name: string;
  on_time: number;
  late: number;
}

export default function OrdersOnTimeTrendChart() {
  const [groupBy, setGroupBy] = useState<GroupBy>('week');

  const { data, isLoading } = useQuery({
    queryKey: ['api', 'orders-on-time-trend', groupBy],
    queryFn: () =>
      apiGet<{ data: TrendDataPoint[]; groupBy: string }>(
        `/api/queries/orders-on-time-trend?groupBy=${groupBy}`
      ),
  });

  const chartData = data?.data ?? [];

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Delivered On Time vs Late
        </CardTitle>
        <div className="flex flex-wrap gap-1">
          {(['day', 'week', 'month', 'year'] as const).map((p) => (
            <Button
              key={p}
              variant={groupBy === p ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setGroupBy(p)}
            >
              {p === 'day'
                ? 'Daily'
                : p === 'week'
                  ? 'Weekly'
                  : p === 'month'
                    ? 'Monthly'
                    : 'Annually'}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2">
          Total delivered orders: on time (≤90 min) vs late. All order types combined. Default: weekly.
        </p>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No delivered orders in this period
              </div>
            ) : (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: TICK_FILL }}
                  axisLine={{ stroke: GRID_STROKE }}
                  tickLine={{ stroke: GRID_STROKE }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: TICK_FILL }}
                  axisLine={{ stroke: GRID_STROKE }}
                  tickLine={{ stroke: GRID_STROKE }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend
                  formatter={(value) => <span style={{ color: TICK_FILL }}>{value}</span>}
                />
                <Area
                  type="monotone"
                  dataKey="on_time"
                  stackId="1"
                  stroke={CHART_COLORS.green}
                  fill={CHART_COLORS.green}
                  fillOpacity={0.75}
                  name="On time"
                />
                <Area
                  type="monotone"
                  dataKey="late"
                  stackId="1"
                  stroke={CHART_COLORS.red}
                  fill={CHART_COLORS.red}
                  fillOpacity={0.75}
                  name="Late"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
