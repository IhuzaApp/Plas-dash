'use client';

import React, { useMemo } from 'react';
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
import { format, startOfMonth, subMonths } from 'date-fns';
import { Loader2, UserCheck } from 'lucide-react';
import { CHART_COLORS } from '@/lib/chartColors';

const TICK_FILL = 'hsl(var(--foreground) / 0.9)';
const GRID_STROKE = 'hsl(var(--foreground) / 0.15)';

export default function ApprovedShoppersOverTimeChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['api', 'shoppers'],
    queryFn: () =>
      apiGet<{ shoppers: { created_at: string; status?: string }[] }>('/api/queries/shoppers'),
  });

  const chartData = useMemo(() => {
    if (!data?.shoppers?.length) return [];
    const approved = data.shoppers.filter(
      (s) => s.status === 'approved' || s.status === 'completed'
    );
    const pending = data.shoppers.filter((s) => (s.status ?? '') === 'pending');
    const other = data.shoppers.filter(
      (s) =>
        s.status !== 'approved' &&
        s.status !== 'completed' &&
        (s.status ?? '') !== 'pending'
    );

    const now = new Date();
    const buckets: {
      key: string;
      date: Date;
      approved: number;
      pending: number;
      other: number;
    }[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);
      const start = startOfMonth(d);
      const endOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);

      const approvedCount = approved.filter((s) => new Date(s.created_at) <= endOfMonth).length;
      const pendingCount = pending.filter((s) => new Date(s.created_at) <= endOfMonth).length;
      const otherCount = other.filter((s) => new Date(s.created_at) <= endOfMonth).length;

      buckets.push({
        key: format(start, 'yyyy-MM'),
        date: start,
        approved: approvedCount,
        pending: pendingCount,
        other: otherCount,
      });
    }

    return buckets.map((b) => ({
      name: format(b.date, 'MMM yy'),
      Approved: b.approved,
      Pending: b.pending,
      Other: b.other,
    }));
  }, [data]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          Shoppers Over Time (by status)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No shopper data
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
                  allowDecimals={false}
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
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(value) => <span style={{ color: TICK_FILL }}>{value}</span>}
                />
                <Area
                  type="monotone"
                  dataKey="Approved"
                  stackId="1"
                  stroke={CHART_COLORS.green}
                  strokeWidth={2}
                  fill={CHART_COLORS.green}
                  fillOpacity={0.75}
                  name="Approved"
                />
                <Area
                  type="monotone"
                  dataKey="Pending"
                  stackId="1"
                  stroke={CHART_COLORS.orange}
                  strokeWidth={2}
                  fill={CHART_COLORS.orange}
                  fillOpacity={0.75}
                  name="Pending"
                />
                <Area
                  type="monotone"
                  dataKey="Other"
                  stackId="1"
                  stroke={CHART_COLORS.blue}
                  strokeWidth={2}
                  fill={CHART_COLORS.blue}
                  fillOpacity={0.75}
                  name="Other"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
