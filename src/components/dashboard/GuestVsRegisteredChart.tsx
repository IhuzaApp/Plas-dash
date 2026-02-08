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
  Legend,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
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
import { Loader2, Users } from 'lucide-react';
import { CHART_COLORS } from '@/lib/chartColors';
import { Button } from '@/components/ui/button';

const TICK_FILL = 'hsl(var(--foreground) / 0.9)';
const GRID_STROKE = 'hsl(var(--foreground) / 0.15)';

type Period = 'day' | 'week' | 'month' | 'year';

export default function GuestVsRegisteredChart() {
  const [period, setPeriod] = useState<Period>('month');

  const { data, isLoading } = useQuery({
    queryKey: ['api', 'users'],
    queryFn: () =>
      apiGet<{ users: { created_at: string; is_guest?: boolean }[] }>('/api/queries/users'),
  });

  const chartData = useMemo(() => {
    if (!data?.users?.length) return [];
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
        default:
          return format(startOfMonth(d), 'yyyy-MM');
      }
    };
    const range = period === 'day' ? 14 : period === 'week' ? 12 : period === 'month' ? 12 : 5;
    const now = new Date();
    const buckets: Record<string, { guest: number; registered: number }> = {};
    for (let i = 0; i < range; i++) {
      let d: Date;
      if (period === 'day') d = subDays(now, range - 1 - i);
      else if (period === 'week') d = subWeeks(now, range - 1 - i);
      else if (period === 'month') d = subMonths(now, range - 1 - i);
      else d = subYears(now, range - 1 - i);
      const key = getKey(d);
      buckets[key] = { guest: 0, registered: 0 };
    }
    data.users.forEach(u => {
      const key = getKey(new Date(u.created_at));
      if (!(key in buckets)) return;
      if (u.is_guest === true) buckets[key].guest += 1;
      else buckets[key].registered += 1;
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
        Guest: v.guest,
        Registered: v.registered,
      }));
  }, [data, period]);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Guest vs Registered Users
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
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No user data
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
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend formatter={value => <span style={{ color: TICK_FILL }}>{value}</span>} />
                <Bar
                  dataKey="Guest"
                  fill={CHART_COLORS.orange}
                  radius={[4, 4, 0, 0]}
                  name="Guest (is_guest true)"
                />
                <Bar
                  dataKey="Registered"
                  fill={CHART_COLORS.green}
                  radius={[4, 4, 0, 0]}
                  name="Registered (is_guest false)"
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
