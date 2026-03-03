'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  BarChart2,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Dummy data for charts
const monthlySpendData = [
  { name: 'Jan', spend: 4000, budget: 5000 },
  { name: 'Feb', spend: 3000, budget: 5000 },
  { name: 'Mar', spend: 5500, budget: 5000 },
  { name: 'Apr', spend: 4200, budget: 5000 },
  { name: 'May', spend: 4800, budget: 5000 },
  { name: 'Jun', spend: 6100, budget: 5000 },
];

const categorySpendData = [
  { name: 'Produce', value: 35 },
  { name: 'Meat', value: 25 },
  { name: 'Dairy', value: 15 },
  { name: 'Beverages', value: 15 },
  { name: 'Staples', value: 10 },
];

const supplierPerformanceData = [
  { name: 'FreshFarm Produce', deliveryTime: 98, quality: 95, cost: 85 },
  { name: 'Meat Master Wholesale', deliveryTime: 100, quality: 98, cost: 75 },
  { name: 'Global Beverages Inc', deliveryTime: 95, quality: 90, cost: 90 },
  { name: 'Dairy Delights Ltd', deliveryTime: 85, quality: 90, cost: 88 },
];

const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6'];
import { useSystemConfig } from '@/hooks/useSystemConfig';

export default function ProcurementReportsPage() {
  const { data: systemConfig } = useSystemConfig();
  const currency = systemConfig?.currency || '$';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Procurement Reports</h2>
          <p className="text-muted-foreground mt-2">
            Analyze purchasing trends, supplier performance, and category spending.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Total Spend (YTD)</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-2xl font-bold truncate">{currency}27,600</h3>
                  <span className="text-sm font-medium text-destructive flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" /> 12%
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 ml-2 shrink-0">
                <BarChart2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Cost Savings</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-2xl font-bold truncate">{currency}3,240</h3>
                  <span className="text-sm font-medium text-emerald-600 flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" /> 8%
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 ml-2 shrink-0">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">On-Time Delivery Rate</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-2xl font-bold truncate">94.2%</h3>
                  <span className="text-sm font-medium text-destructive flex items-center">
                    <ArrowDownRight className="w-3 h-3 mr-0.5" /> 1.5%
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 ml-2 shrink-0">
                <PieChartIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Spend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Procurement Spend</CardTitle>
            <CardDescription>Compare actual spend vs budget for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlySpendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dx={-10}
                  tickFormatter={val => `${currency}${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number) => [`${currency}${value}`, undefined]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="spend"
                  name="Actual Spend"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="budget"
                  name="Budget"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Spend Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Spend by Category</CardTitle>
            <CardDescription>
              Percentage distribution of purchases across main categories
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySpendData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categorySpendData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'Share']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Supplier Performance */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Top Supplier Performance Index</CardTitle>
            <CardDescription>
              Evaluation based on delivery predictability, product quality, and cost competitiveness
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={supplierPerformanceData}
                margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dx={-10}
                  domain={[0, 100]}
                />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Bar
                  dataKey="deliveryTime"
                  name="On-Time Delivery (%)"
                  fill="#0ea5e9"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="quality"
                  name="Quality Acceptance (%)"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="cost"
                  name="Cost Competitiveness"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
