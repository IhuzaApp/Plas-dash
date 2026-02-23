'use client';

import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { format, parseISO, startOfMonth, startOfYear, getYear } from 'date-fns';
import { Loader2, TrendingUp } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RevenueRecord {
  id: string;
  amount: string;
  type: string;
  created_at: string;
  Plasbusiness_id?: string;
  shop_id?: string;
  shopper_id?: string;
  restaurant_id?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Display label + color for each revenue type
const REVENUE_TYPES: Record<string, { label: string; color: string }> = {
  commission: { label: 'Commission', color: '#6366f1' },
  plasa_fee: { label: 'Plasa Fee', color: '#22c55e' },
  withdraw_charges: { label: 'Withdraw Charges', color: '#f59e0b' },
  product_profit: { label: 'Product Profit', color: '#3b82f6' },
  delivery_fee: { label: 'Delivery Fee', color: '#ec4899' },
  service_fee: { label: 'Service Fee', color: '#14b8a6' },
  reel_commission: { label: 'Reel Commission', color: '#f97316' },
  restaurant_commission: { label: 'Restaurant Commission', color: '#8b5cf6' },
  other: { label: 'Other', color: '#94a3b8' },
};

function getTypeConfig(type: string) {
  return REVENUE_TYPES[type] ?? { label: type, color: '#94a3b8' };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0);
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg text-sm min-w-[180px]">
      <div className="font-semibold mb-2">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
            {getTypeConfig(p.name).label}
          </span>
          <span className="font-medium tabular-nums">{formatCurrency(p.value)}</span>
        </div>
      ))}
      <div className="mt-2 pt-2 border-t flex justify-between font-semibold">
        <span>Total</span>
        <span className="tabular-nums">{formatCurrency(total)}</span>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const RevenueTrendChart = () => {
  const [granularity, setGranularity] = useState<'month' | 'year'>('month');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['revenue-all'],
    queryFn: () =>
      apiGet<{ Revenue: RevenueRecord[] }>('/api/queries/revenue').then(r => r.Revenue),
    staleTime: 5 * 60 * 1000,
  });

  const records = data ?? [];

  // Collect distinct years for the year filter
  const years = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => set.add(String(getYear(parseISO(r.created_at)))));
    return Array.from(set).sort().reverse();
  }, [records]);

  // Collect all distinct types present in the data
  const types = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => set.add(r.type ?? 'other'));
    return Array.from(set);
  }, [records]);

  // Filter records by selected year
  const filtered = useMemo(() => {
    if (selectedYear === 'all') return records;
    return records.filter(r => String(getYear(parseISO(r.created_at))) === selectedYear);
  }, [records, selectedYear]);

  // Aggregate into chart data points
  const chartData = useMemo(() => {
    const buckets: Record<string, Record<string, number>> = {};

    filtered.forEach(r => {
      const date = parseISO(r.created_at);
      const key =
        granularity === 'month' ? format(startOfMonth(date), 'MMM yyyy') : String(getYear(date));
      const type = r.type ?? 'other';
      const amount = parseFloat(r.amount ?? '0');
      if (!buckets[key]) buckets[key] = {};
      buckets[key][type] = (buckets[key][type] ?? 0) + amount;
    });

    return Object.entries(buckets)
      .map(([period, values]) => ({ period, ...values }))
      .sort((a, b) => {
        // Sort chronologically
        const parseKey = (k: string) => {
          if (/^\d{4}$/.test(k)) return new Date(Number(k), 0).getTime();
          return new Date(k).getTime();
        };
        return parseKey(a.period) - parseKey(b.period);
      });
  }, [filtered, granularity]);

  // Totals per type for the summary cards
  const totals = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(r => {
      const type = r.type ?? 'other';
      map[type] = (map[type] ?? 0) + parseFloat(r.amount ?? '0');
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const grandTotal = totals.reduce((s, [, v]) => s + v, 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Revenue Trends
            </CardTitle>
            <CardDescription>
              Revenue over time, broken down by category &mdash; {formatCurrency(grandTotal)} total
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Year filter */}
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => setSelectedYear('all')}
                className={`text-xs px-2 py-1 rounded-md border transition-colors ${selectedYear === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              >
                All Years
              </button>
              {years.map(y => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`text-xs px-2 py-1 rounded-md border transition-colors ${selectedYear === y ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                >
                  {y}
                </button>
              ))}
            </div>

            {/* Granularity */}
            <div className="flex rounded-md border overflow-hidden text-xs">
              <button
                onClick={() => setGranularity('month')}
                className={`px-3 py-1.5 transition-colors ${granularity === 'month' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setGranularity('year')}
                className={`px-3 py-1.5 transition-colors border-l ${granularity === 'year' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              >
                Yearly
              </button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {totals.map(([type, total]) => {
            const cfg = getTypeConfig(type);
            const pct = grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(1) : '0';
            return (
              <div key={type} className="rounded-lg border p-3 space-y-1 text-sm">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ background: cfg.color }}
                  />
                  <span className="text-xs text-muted-foreground truncate">{cfg.label}</span>
                </div>
                <div className="font-semibold tabular-nums">{formatCurrency(total)}</div>
                <div className="text-xs text-muted-foreground">{pct}% of total</div>
              </div>
            );
          })}
        </div>

        {/* ── Stacked bar chart ── */}
        <Tabs defaultValue="stacked">
          <TabsList className="mb-4">
            <TabsTrigger value="stacked">Stacked</TabsTrigger>
            <TabsTrigger value="line">Lines</TabsTrigger>
          </TabsList>

          <TabsContent value="stacked">
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                    width={52}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value: string) => getTypeConfig(value).label}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                  {types.map(type => (
                    <Bar
                      key={type}
                      dataKey={type}
                      stackId="rev"
                      fill={getTypeConfig(type).color}
                      radius={type === types[types.length - 1] ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="line">
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                    width={52}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value: string) => getTypeConfig(value).label}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                  {types.map(type => (
                    <Line
                      key={type}
                      type="monotone"
                      dataKey={type}
                      stroke={getTypeConfig(type).color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RevenueTrendChart;
