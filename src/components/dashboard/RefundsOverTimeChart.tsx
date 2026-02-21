'use client';

import React, { useMemo, useState } from 'react';
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
import {
  format,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  subDays,
  subWeeks,
  subMonths,
  subYears,
} from 'date-fns';
import { TrendingUp } from 'lucide-react';
import { CHART_COLORS } from '@/lib/chartColors';
import { Button } from '@/components/ui/button';
import type { Refund } from '@/hooks/useGraphql';

const TICK_FILL = 'hsl(var(--foreground) / 0.9)';
const GRID_STROKE = 'hsl(var(--foreground) / 0.15)';

type Period = 'day' | 'week' | 'month' | 'year';

interface Props {
  refunds: Refund[];
  isLoading: boolean;
}

export default function RefundsOverTimeChart({ refunds, isLoading }: Props) {
  const [period, setPeriod] = useState<Period>('month');

  const chartData = useMemo(() => {
    if (!refunds.length) return [];
    const now = new Date();
    const getKey = (d: Date) => {
      switch (period) {
        case 'day':
          return format(startOfDay(d), 'yyyy-MM-dd');
        case 'week':
          return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        case 'month':
          return format(startOfMonth(d), 'yyyy-MM');
        case 'year':
          return format(startOfYear(d), 'yyyy');
      }
    };
    const range = period === 'day' ? 14 : period === 'week' ? 12 : period === 'month' ? 12 : 5;

    const buckets: Record<
      string,
      { approved: number; pending: number; rejected: number; in_review: number }
    > = {};
    for (let i = 0; i < range; i++) {
      let d: Date;
      if (period === 'day') d = subDays(now, range - 1 - i);
      else if (period === 'week') d = subWeeks(now, range - 1 - i);
      else if (period === 'month') d = subMonths(now, range - 1 - i);
      else d = subYears(now, range - 1 - i);
      const key = getKey(d);
      buckets[key] = { approved: 0, pending: 0, rejected: 0, in_review: 0 };
    }

    refunds.forEach(r => {
      const key = getKey(new Date(r.created_at));
      if (key && key in buckets) {
        const s = r.status.toLowerCase() as keyof (typeof buckets)[string];
        if (s in buckets[key]) buckets[key][s] += 1;
      }
    });

    const labelFormat =
      period === 'day'
        ? 'MMM d'
        : period === 'week'
          ? 'MMM d'
          : period === 'month'
            ? 'MMM yy'
            : 'yyyy';

    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({
        name:
          period === 'month'
            ? format(new Date(key + '-01'), labelFormat)
            : period === 'year'
              ? key
              : format(new Date(key), labelFormat),
        Approved: v.approved,
        Pending: v.pending,
        Rejected: v.rejected,
        'In Review': v.in_review,
      }));
  }, [refunds, period]);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Refunds Over Time
        </CardTitle>
        <div className="flex flex-wrap gap-1">
          {(['day', 'week', 'month', 'year'] as const).map(p => (
            <Button
              key={p}
              variant={period === p ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No refund data
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
                  allowDecimals={false}
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
                    <span style={{ color: TICK_FILL, fontSize: 12 }}>{value}</span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="Approved"
                  stackId="1"
                  stroke={CHART_COLORS.green}
                  fill={CHART_COLORS.green}
                  fillOpacity={0.65}
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  dataKey="Pending"
                  stackId="1"
                  stroke={CHART_COLORS.yellow}
                  fill={CHART_COLORS.yellow}
                  fillOpacity={0.65}
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  dataKey="In Review"
                  stackId="1"
                  stroke={CHART_COLORS.blue}
                  fill={CHART_COLORS.blue}
                  fillOpacity={0.65}
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  dataKey="Rejected"
                  stackId="1"
                  stroke={CHART_COLORS.red}
                  fill={CHART_COLORS.red}
                  fillOpacity={0.65}
                  strokeWidth={1.5}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
