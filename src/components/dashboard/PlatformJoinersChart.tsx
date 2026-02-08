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
import { Loader2, Store } from 'lucide-react';
import { CHART_COLORS } from '@/lib/chartColors';
import { Button } from '@/components/ui/button';

const TICK_FILL = 'hsl(var(--foreground) / 0.9)';
const GRID_STROKE = 'hsl(var(--foreground) / 0.15)';

type Period = 'day' | 'week' | 'month' | 'year';

type JoinersData = {
  shops: { created_at: string }[];
  users: { created_at: string }[];
  restaurants: { created_at: string }[];
  businesses: { created_at: string }[];
  stores: { created_at: string }[];
};

function getKey(d: Date, period: Period): string {
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
}

function getLabel(key: string, period: Period): string {
  if (period === 'year') return key;
  if (period === 'month') return format(new Date(key + '-01'), 'MMM yy');
  return format(new Date(key), 'MMM d');
}

export default function PlatformJoinersChart() {
  const [period, setPeriod] = useState<Period>('month');

  const { data, isLoading } = useQuery({
    queryKey: ['api', 'platform-joiners'],
    queryFn: () => apiGet<JoinersData>('/api/queries/platform-joiners'),
  });

  const chartData = useMemo(() => {
    if (!data) return [];
    const range = period === 'day' ? 14 : period === 'week' ? 12 : period === 'month' ? 12 : 5;
    const now = new Date();
    const buckets: Record<
      string,
      { shops: number; users: number; restaurants: number; businesses: number; stores: number }
    > = {};
    for (let i = 0; i < range; i++) {
      let d: Date;
      if (period === 'day') d = subDays(now, range - 1 - i);
      else if (period === 'week') d = subWeeks(now, range - 1 - i);
      else if (period === 'month') d = subMonths(now, range - 1 - i);
      else d = subYears(now, range - 1 - i);
      const key = getKey(d, period);
      buckets[key] = { shops: 0, users: 0, restaurants: 0, businesses: 0, stores: 0 };
    }
    const add = (
      key: string,
      type: 'shops' | 'users' | 'restaurants' | 'businesses' | 'stores'
    ) => {
      if (key in buckets) buckets[key][type] += 1;
    };
    (data.shops || []).forEach(s => add(getKey(new Date(s.created_at), period), 'shops'));
    (data.users || []).forEach(u => add(getKey(new Date(u.created_at), period), 'users'));
    (data.restaurants || []).forEach(r =>
      add(getKey(new Date(r.created_at), period), 'restaurants')
    );
    (data.businesses || []).forEach(b => add(getKey(new Date(b.created_at), period), 'businesses'));
    (data.stores || []).forEach(s => add(getKey(new Date(s.created_at), period), 'stores'));
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({
        name: getLabel(key, period),
        Shops: v.shops,
        Users: v.users,
        Restaurants: v.restaurants,
        Businesses: v.businesses,
        Stores: v.stores,
      }));
  }, [data, period]);

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Store className="h-4 w-4" />
          Platform Joiners (Shops, Restaurants, Businesses, Stores, Users)
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
        <div className="h-[280px]">
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
                <Legend formatter={value => <span style={{ color: TICK_FILL }}>{value}</span>} />
                <Area
                  type="monotone"
                  dataKey="Shops"
                  stackId="1"
                  stroke={CHART_COLORS.green}
                  fill={CHART_COLORS.green}
                  fillOpacity={0.7}
                  name="Shops"
                />
                <Area
                  type="monotone"
                  dataKey="Restaurants"
                  stackId="1"
                  stroke={CHART_COLORS.red}
                  fill={CHART_COLORS.red}
                  fillOpacity={0.7}
                  name="Restaurants"
                />
                <Area
                  type="monotone"
                  dataKey="Businesses"
                  stackId="1"
                  stroke={CHART_COLORS.orange}
                  fill={CHART_COLORS.orange}
                  fillOpacity={0.7}
                  name="Businesses"
                />
                <Area
                  type="monotone"
                  dataKey="Stores"
                  stackId="1"
                  stroke={CHART_COLORS.yellow}
                  fill={CHART_COLORS.yellow}
                  fillOpacity={0.7}
                  name="Stores"
                />
                <Area
                  type="monotone"
                  dataKey="Users"
                  stackId="1"
                  stroke={CHART_COLORS.blue}
                  fill={CHART_COLORS.blue}
                  fillOpacity={0.7}
                  name="Users"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
