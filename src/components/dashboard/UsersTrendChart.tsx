'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
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

const TICK_FILL = 'hsl(var(--foreground) / 0.9)';
const GRID_STROKE = 'hsl(var(--foreground) / 0.15)';

export interface UsersTrendBucket {
  month: string;
  name: string;
  totalUsers: number;
  activeUsers: number;
  guestUsers: number;
  customers: number;
}

export default function UsersTrendChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['api', 'users-trend'],
    queryFn: () =>
      apiGet<{ buckets: UsersTrendBucket[] }>('/api/queries/users-trend'),
  });

  const chartData = data?.buckets ?? [];

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Users stats trend (last 12 months)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No data
              </div>
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={GRID_STROKE}
                />
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
                  formatter={value => (
                    <span style={{ color: TICK_FILL }}>{value}</span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="totalUsers"
                  stroke={CHART_COLORS.blue}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Total Users"
                />
                <Line
                  type="monotone"
                  dataKey="activeUsers"
                  stroke={CHART_COLORS.green}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Active Users"
                />
                <Line
                  type="monotone"
                  dataKey="guestUsers"
                  stroke={CHART_COLORS.orange}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Guest Users"
                />
                <Line
                  type="monotone"
                  dataKey="customers"
                  stroke={CHART_COLORS.red}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Customers"
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
