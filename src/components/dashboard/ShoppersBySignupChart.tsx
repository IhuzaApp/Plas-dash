'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { format, subMonths, startOfMonth, startOfYear } from 'date-fns';
import { Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CHART_COLORS } from '@/lib/chartColors';

const TICK_FILL = 'hsl(var(--foreground) / 0.9)';
const GRID_STROKE = 'hsl(var(--foreground) / 0.15)';

type GroupBy = 'month' | 'year';

export default function ShoppersBySignupChart() {
  const [groupBy, setGroupBy] = useState<GroupBy>('month');

  const { data, isLoading } = useQuery({
    queryKey: ['api', 'shoppers'],
    queryFn: () => apiGet<{ shoppers: { created_at: string }[] }>('/api/queries/shoppers'),
  });

  const chartData = useMemo(() => {
    if (!data?.shoppers?.length) return [];
    const now = new Date();
    const buckets: Record<string, number> = {};

    if (groupBy === 'month') {
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(now, i);
        const key = format(startOfMonth(d), 'yyyy-MM');
        buckets[key] = 0;
      }
      data.shoppers.forEach((s) => {
        const key = format(startOfMonth(new Date(s.created_at)), 'yyyy-MM');
        if (key in buckets) buckets[key]++;
      });
      return Object.entries(buckets)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, count]) => ({ name: format(new Date(key + '-01'), 'MMM yy'), count }));
    }

    // by year
    const startYear = now.getFullYear() - 5;
    for (let y = startYear; y <= now.getFullYear(); y++) {
      buckets[String(y)] = 0;
    }
    data.shoppers.forEach((s) => {
      const y = startOfYear(new Date(s.created_at)).getFullYear();
      const key = String(y);
      if (key in buckets) buckets[key]++;
    });
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, count }));
  }, [data, groupBy]);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Shoppers by Sign-up
        </CardTitle>
        <div className="flex gap-1">
          <Button
            variant={groupBy === 'month' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setGroupBy('month')}
          >
            By Month
          </Button>
          <Button
            variant={groupBy === 'year' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setGroupBy('year')}
          >
            By Year
          </Button>
        </div>
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
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  formatter={(value: number) => [value, 'Shoppers']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar
                  dataKey="count"
                  fill={CHART_COLORS.green}
                  stroke={CHART_COLORS.green}
                  radius={[4, 4, 0, 0]}
                  name="Shoppers"
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
