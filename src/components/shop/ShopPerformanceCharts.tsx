'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import { Loader2, TrendingUp, Package, PieChartIcon, BarChart3 } from 'lucide-react';
import { PIE_COLORS, CHART_COLORS, CHART_PALETTE } from '@/lib/chartColors';
import { formatCurrencyWithConfig } from '@/lib/utils';
import { useSystemConfig } from '@/hooks/useHasuraApi';

const TICK_FILL = 'hsl(var(--foreground) / 0.9)';
const GRID_STROKE = 'hsl(var(--foreground) / 0.15)';

type Order = {
  id: string;
  OrderID?: string;
  status: string;
  total: string;
  created_at: string;
  Order_Items?: Array<{
    id: string;
    quantity: number;
    price: string;
    Product?: { name?: string; ProductName?: { name?: string } } | null;
  }>;
};

type ShopWithOrders = {
  Orders?: Order[] | null;
};

/** Reel orders for this shop (from useReelOrders filtered by Shop.id) */
export type ReelOrderForShop = {
  id: string;
  status: string;
  total: string;
  created_at: string;
};

interface ShopPerformanceChartsProps {
  shop: ShopWithOrders | null | undefined;
  reelOrders?: ReelOrderForShop[] | null;
  isLoading?: boolean;
}

export default function ShopPerformanceCharts({ shop, reelOrders = [], isLoading }: ShopPerformanceChartsProps) {
  const { data: configData } = useSystemConfig();
  const config = configData?.System_configuratioins?.[0]
    ? {
        System_configuratioins: configData.System_configuratioins,
      }
    : { System_configuratioins: [{ currency: 'RWF' }] };

  const orders = useMemo(() => shop?.Orders ?? [], [shop?.Orders]);
  const reels = useMemo(() => reelOrders ?? [], [reelOrders]);

  // Combined list for status pie and trend (regular + reel)
  const allOrdersForStatus = useMemo(() => {
    const regular = orders.map((o) => ({ status: o.status }));
    const reel = reels.map((o) => ({ status: o.status }));
    return [...regular, ...reel];
  }, [orders, reels]);

  const allOrdersForTrend = useMemo(() => {
    const regular = orders.map((o) => ({ total: o.total, created_at: o.created_at }));
    const reel = reels.map((o) => ({ total: o.total, created_at: o.created_at }));
    return [...regular, ...reel];
  }, [orders, reels]);

  // 1. Order status breakdown (pie) – includes regular + reel orders
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    allOrdersForStatus.forEach((o) => {
      const s = (o.status || 'unknown').toLowerCase().replace(/_/g, ' ');
      const label = s.charAt(0).toUpperCase() + s.slice(1);
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allOrdersForStatus]);

  // 2. Revenue & orders over time (last 14 days) – includes regular + reel orders
  type TrendPoint = {
    date: string;
    fullDate: string;
    revenue: number;
    orders: number;
    regularOrders?: number;
    reelOrders?: number;
  };
  const trendData = useMemo(() => {
    const dayMap: Record<string, TrendPoint> = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = subDays(now, i);
      const key = format(d, 'yyyy-MM-dd');
      dayMap[key] = {
        date: format(d, 'MMM d'),
        fullDate: key,
        revenue: 0,
        orders: 0,
        regularOrders: 0,
        reelOrders: 0,
      };
    }
    orders.forEach((o) => {
      const key = format(parseISO(o.created_at), 'yyyy-MM-dd');
      if (!dayMap[key]) {
        dayMap[key] = {
          date: format(parseISO(o.created_at), 'MMM d'),
          fullDate: key,
          revenue: 0,
          orders: 0,
          regularOrders: 0,
          reelOrders: 0,
        };
      }
      dayMap[key].revenue += parseFloat(o.total || '0');
      dayMap[key].orders += 1;
      dayMap[key].regularOrders! += 1;
    });
    reels.forEach((o) => {
      const key = format(parseISO(o.created_at), 'yyyy-MM-dd');
      if (!dayMap[key]) {
        dayMap[key] = {
          date: format(parseISO(o.created_at), 'MMM d'),
          fullDate: key,
          revenue: 0,
          orders: 0,
          regularOrders: 0,
          reelOrders: 0,
        };
      }
      dayMap[key].revenue += parseFloat(o.total || '0');
      dayMap[key].orders += 1;
      dayMap[key].reelOrders! += 1;
    });
    const sorted = Object.values(dayMap).sort(
      (a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
    );
    return sorted;
  }, [orders, reels]);

  // 3. Top products by quantity sold
  const topProductsData = useMemo(() => {
    const byName: Record<string, number> = {};
    orders.forEach((order) => {
      order.Order_Items?.forEach((item) => {
        const name =
          item.Product?.ProductName?.name ?? item.Product?.name ?? 'Unknown';
        byName[name] = (byName[name] || 0) + (item.quantity || 0);
      });
    });
    return Object.entries(byName)
      .map(([name, quantity]) => ({ name: name.length > 20 ? name.slice(0, 20) + '…' : name, quantity, fullName: name }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);
  }, [orders]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center justify-center h-[280px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-center h-[280px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        Shop performance
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Order status pie chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Orders by status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                {statusData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No order data
                  </div>
                ) : (
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={72}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                          stroke="hsl(var(--card))"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [value, 'Orders']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend formatter={(v) => <span style={{ color: TICK_FILL }}>{v}</span>} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue over time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Revenue & orders over time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                {trendData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No trend data
                  </div>
                ) : (
                  <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="shopRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.green} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                    <XAxis dataKey="date" tick={{ fill: TICK_FILL }} fontSize={11} />
                    <YAxis
                      yAxisId="revenue"
                      tick={{ fill: TICK_FILL }}
                      fontSize={11}
                      tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                    />
                    <YAxis yAxisId="orders" orientation="right" tick={{ fill: TICK_FILL }} fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length || !label) return null;
                        const p = payload[0]?.payload as TrendPoint;
                        if (!p) return null;
                        return (
                          <div className="rounded-lg border border-border bg-card p-3 shadow-md text-card-foreground min-w-[160px]">
                            <div className="font-semibold mb-2">{label}</div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between gap-4">
                                <span>Revenue</span>
                                <span className="font-medium">
                                  {formatCurrencyWithConfig(String(p.revenue), config)}
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span>Orders (total)</span>
                                <span className="font-medium">{p.orders}</span>
                              </div>
                              <div className="flex justify-between gap-4 text-muted-foreground">
                                <span>Regular</span>
                                <span>{p.regularOrders ?? 0}</span>
                              </div>
                              <div className="flex justify-between gap-4 text-muted-foreground">
                                <span>Reel</span>
                                <span>{p.reelOrders ?? 0}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend formatter={(v) => <span style={{ color: TICK_FILL }}>{v}</span>} />
                    <Area
                      yAxisId="revenue"
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke={CHART_COLORS.green}
                      fill="url(#shopRevenueGrad)"
                      strokeWidth={2}
                    />
                    <Bar
                      yAxisId="orders"
                      dataKey="regularOrders"
                      name="Regular orders"
                      stackId="orders"
                      fill={CHART_COLORS.blue}
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      yAxisId="orders"
                      dataKey="reelOrders"
                      name="Reel orders"
                      stackId="orders"
                      fill={CHART_PALETTE[1]}
                      radius={[4, 4, 0, 0]}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Orders trend (bar) - same data, emphasis on order count */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Orders per day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                {trendData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No order data
                  </div>
                ) : (
                  <BarChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                    <XAxis dataKey="date" tick={{ fill: TICK_FILL }} fontSize={11} />
                    <YAxis tick={{ fill: TICK_FILL }} fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length || !label) return null;
                        const p = payload[0]?.payload as TrendPoint;
                        if (!p) return null;
                        return (
                          <div className="rounded-lg border border-border bg-card p-3 shadow-md text-card-foreground min-w-[140px]">
                            <div className="font-semibold mb-2">{label}</div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between gap-4">
                                <span>Total</span>
                                <span className="font-medium">{p.orders}</span>
                              </div>
                              <div className="flex justify-between gap-4 text-muted-foreground">
                                <span>Regular</span>
                                <span>{p.regularOrders ?? 0}</span>
                              </div>
                              <div className="flex justify-between gap-4 text-muted-foreground">
                                <span>Reel</span>
                                <span>{p.reelOrders ?? 0}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend formatter={(v) => <span style={{ color: TICK_FILL }}>{v}</span>} />
                    <Bar
                      dataKey="regularOrders"
                      name="Regular orders"
                      stackId="day"
                      fill={CHART_COLORS.blue}
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="reelOrders"
                      name="Reel orders"
                      stackId="day"
                      fill={CHART_PALETTE[1]}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top products by quantity sold */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Top products (units sold)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                {topProductsData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No product sales data
                  </div>
                ) : (
                  <BarChart
                    data={topProductsData}
                    layout="vertical"
                    margin={{ top: 4, right: 8, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                    <XAxis type="number" tick={{ fill: TICK_FILL }} fontSize={11} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={90}
                      tick={{ fill: TICK_FILL }}
                      fontSize={10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                      }}
                      formatter={(value: number, _: unknown, item: unknown) => {
                        const payload = (item as { payload?: { fullName?: string } })?.payload;
                        return [value, payload?.fullName ?? 'Units sold'];
                      }}
                    />
                    <Bar dataKey="quantity" name="Units sold" fill={CHART_PALETTE[2]} radius={[0, 4, 4, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
