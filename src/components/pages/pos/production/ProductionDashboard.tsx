'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  ChefHat,
  ClipboardList,
  TrendingUp,
  Package,
  Download,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  DUMMY_PRODUCTION_ORDERS,
  DUMMY_RECIPES,
  PRODUCTION_MONTHLY_TREND,
  RECIPE_PRODUCTION_VOLUME,
  computeFullCost,
} from '@/lib/data/dummy-production';

const PIE_COLORS = ['#22c55e', '#f59e0b', '#6366f1', '#ef4444'];

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  Completed: {
    color: 'bg-green-500/10 text-green-700 border-green-200',
    icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  },
  'In Progress': {
    color: 'bg-amber-500/10 text-amber-700 border-amber-200',
    icon: <Clock className="h-4 w-4 text-amber-600" />,
  },
  Draft: {
    color: 'bg-slate-500/10 text-slate-700 border-slate-200',
    icon: <Activity className="h-4 w-4 text-slate-500" />,
  },
  Cancelled: {
    color: 'bg-red-500/10 text-red-700 border-red-200',
    icon: <AlertCircle className="h-4 w-4 text-red-500" />,
  },
};

export default function ProductionDashboard() {
  const [period, setPeriod] = useState('this-month');

  const totalRecipes = DUMMY_RECIPES.length;
  const activeRecipes = DUMMY_RECIPES.filter(r => r.isActive).length;
  const completedOrders = DUMMY_PRODUCTION_ORDERS.filter(o => o.status === 'Completed').length;
  const inProgressOrders = DUMMY_PRODUCTION_ORDERS.filter(o => o.status === 'In Progress').length;
  const totalUnitsProduced = DUMMY_PRODUCTION_ORDERS.filter(o => o.status === 'Completed').reduce(
    (sum, o) => {
      const recipe = DUMMY_RECIPES.find(r => r.id === o.recipeId);
      return sum + (recipe ? recipe.yieldQty * o.batchQty : 0);
    },
    0
  );

  const avgCostPerUnit = (() => {
    const costs = DUMMY_RECIPES.filter(r => r.isActive).map(r => computeFullCost(r).costPerUnit);
    return costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;
  })();

  const statusBreakdown = ['Completed', 'In Progress', 'Draft', 'Cancelled'].map(status => ({
    name: status,
    value: DUMMY_PRODUCTION_ORDERS.filter(o => o.status === status).length,
  }));

  const recentOrders = [...DUMMY_PRODUCTION_ORDERS]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Production Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Real-time overview of production activity, recipe usage, and batch performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="this-quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Active Recipes',
            value: `${activeRecipes} / ${totalRecipes}`,
            sub: 'Total recipes in system',
            icon: ChefHat,
            iconClass: 'text-violet-600',
            bgClass: 'bg-violet-100 dark:bg-violet-900/30',
          },
          {
            label: 'Batches In Progress',
            value: inProgressOrders,
            sub: 'Currently being produced',
            icon: Activity,
            iconClass: 'text-amber-600',
            bgClass: 'bg-amber-100 dark:bg-amber-900/30',
          },
          {
            label: 'Units Produced (All-time)',
            value: totalUnitsProduced.toLocaleString(),
            sub: `${completedOrders} completed orders`,
            icon: Package,
            iconClass: 'text-green-600',
            bgClass: 'bg-green-100 dark:bg-green-900/30',
          },
          {
            label: 'Avg Cost / Unit',
            value: formatCurrency(avgCostPerUnit),
            sub: 'Across all active recipes',
            icon: TrendingUp,
            iconClass: 'text-blue-600',
            bgClass: 'bg-blue-100 dark:bg-blue-900/30',
          },
        ].map(card => (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                  <h3 className="text-2xl font-bold mt-1 truncate">{card.value}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                </div>
                <div className={`p-3 rounded-full ${card.bgClass} ml-3 shrink-0`}>
                  <card.icon className={`h-5 w-5 ${card.iconClass}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Production Volume */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Monthly Production Volume</CardTitle>
            <CardDescription>Batches and units produced over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={PRODUCTION_MONTHLY_TREND}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="batches"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    name="Batches"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="units"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    name="Units"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Status Breakdown</CardTitle>
            <CardDescription>All production orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend iconType="circle" verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Recipes Bar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top Produced Recipes</CardTitle>
            <CardDescription>By number of completed batches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={RECIPE_PRODUCTION_VOLUME}
                  layout="vertical"
                  margin={{ top: 5, right: 24, left: 4, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    width={140}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    formatter={(v: number) => [v, 'Completed Batches']}
                  />
                  <Bar dataKey="batches" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Orders</CardTitle>
            <CardDescription>Latest production activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map(order => {
                const cfg = STATUS_CONFIG[order.status];
                return (
                  <div key={order.id} className="flex items-start gap-3">
                    <div className="mt-0.5">{cfg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{order.recipeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.batchQty} batch{order.batchQty !== 1 ? 'es' : ''} ·{' '}
                        {order.assignedStaff}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-xs shrink-0 ${cfg.color}`}>
                      {order.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
