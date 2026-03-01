'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp, Download, AlertCircle, ShoppingCart } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  DUMMY_SUPPLIERS,
  DUMMY_PURCHASE_ORDERS,
  DUMMY_PRODUCTS,
} from '@/lib/data/dummy-procurement';
import { useSystemConfig } from '@/hooks/useSystemConfig';

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function ProcurementDashboard() {
  const { data: systemConfig } = useSystemConfig();
  const currency = systemConfig?.currency || '$';

  const [dateRange, setDateRange] = useState('this-month');

  // MOCK DATA GENERATORS (In a real app, these would come from an API based on dateRange)

  // 1. KPI Calculations
  const activeSuppliersCount = DUMMY_SUPPLIERS.filter(s => s.status === 'Active').length;

  // Calculate total purchases (mocking that all DUMMY pos fall into the "current" range for visual density)
  const totalPurchases = DUMMY_PURCHASE_ORDERS.reduce((sum, po) => sum + po.totalAmount, 0);

  // Calculate outstanding payables
  const outstandingPayables = DUMMY_PURCHASE_ORDERS.filter(
    po => po.paymentStatus === 'Unpaid' || po.paymentStatus === 'Partial'
  ).reduce((sum, po) => sum + po.totalAmount, 0); // Simplified calculation

  const lowStockItemsCount = 12; // Mocked count of low stock items

  // 2. Chart: Monthly Purchase Trend (Line Chart)
  const monthlyTrendData = [
    { month: 'Sep', purchases: 12000 },
    { month: 'Oct', purchases: 15500 },
    { month: 'Nov', purchases: 11200 },
    { month: 'Dec', purchases: 19800 },
    { month: 'Jan', purchases: 14000 },
    { month: 'Feb', purchases: totalPurchases > 0 ? totalPurchases : 18500 },
  ];

  // 3. Chart: Supplier Spending Distribution (Pie Chart)
  const supplierSpendingDict: Record<string, number> = {};
  DUMMY_PURCHASE_ORDERS.forEach(po => {
    const sup = DUMMY_SUPPLIERS.find(s => s.id === po.supplierId);
    const name = sup ? sup.name : 'Unknown';
    supplierSpendingDict[name] = (supplierSpendingDict[name] || 0) + po.totalAmount;
  });

  const supplierSpendingData = Object.entries(supplierSpendingDict)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Take top 5

  // 4. Chart: Top 10 Purchased Products (Bar Chart)
  const productQtyDict: Record<string, number> = {};
  DUMMY_PURCHASE_ORDERS.forEach(po => {
    po.items.forEach(item => {
      const prod = DUMMY_PRODUCTS.find(p => p.id === item.productId);
      const name = prod ? prod.name : 'Unknown';
      productQtyDict[name] = (productQtyDict[name] || 0) + item.quantity;
    });
  });

  const topProductsData = Object.entries(productQtyDict)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // 5. Chart: Outstanding Payments by Supplier (Horizontal Bar)
  const outstandingDict: Record<string, number> = {};
  DUMMY_PURCHASE_ORDERS.filter(
    po => po.paymentStatus === 'Unpaid' || po.paymentStatus === 'Partial'
  ).forEach(po => {
    const sup = DUMMY_SUPPLIERS.find(s => s.id === po.supplierId);
    const name = sup ? sup.name : 'Unknown';
    outstandingDict[name] = (outstandingDict[name] || 0) + po.totalAmount; // Assuming full amount is unpaid for mockup
  });

  const outstandingData = Object.entries(outstandingDict)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Procurement Analytics</h2>
          <p className="text-muted-foreground mt-2">
            Comprehensive overview of purchasing metrics and supplier performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="this-quarter">This Quarter</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Total Purchases</p>
                <h3 className="text-2xl font-bold mt-1 truncate text-primary">
                  {currency}
                  {totalPurchases.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </h3>
                <div className="flex items-center text-xs mt-1 text-emerald-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>+12.5% from last period</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-primary/10 ml-2 shrink-0">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Outstanding Payables</p>
                <h3 className="text-2xl font-bold mt-1 truncate text-rose-600">
                  {currency}
                  {outstandingPayables.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  Pending payment to suppliers
                </p>
              </div>
              <div className="p-3 rounded-full bg-rose-100 dark:bg-rose-900/30 ml-2 shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Active Suppliers</p>
                <h3 className="text-2xl font-bold mt-1 truncate">{activeSuppliersCount}</h3>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  Approved & onboarded vendors
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 ml-2 shrink-0">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                <h3 className="text-2xl font-bold mt-1 truncate text-amber-600">
                  {lowStockItemsCount}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  Items below reorder point
                </p>
              </div>
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 ml-2 shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Monthly Purchase Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Purchase Trend</CardTitle>
            <CardDescription>Total expenditure over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyTrendData}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickFormatter={val => `${currency}${val / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    formatter={(value: number) => [
                      `${currency}${value.toLocaleString()}`,
                      'Purchases',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="purchases"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#2563eb' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 2. Supplier Spending Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supplier Spending</CardTitle>
            <CardDescription>Top suppliers by expenditure</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={supplierSpendingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {supplierSpendingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${currency}${value.toLocaleString()}`, 'Spent']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 3. Top 10 Purchased Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 10 Products</CardTitle>
            <CardDescription>Most frequently ordered items by quantity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProductsData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#4B5563', fontSize: 12 }}
                    width={120}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    formatter={(value: number) => [value, 'Quantity Ordered']}
                  />
                  <Bar dataKey="quantity" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 4. Outstanding Payments by Supplier */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outstanding Details</CardTitle>
            <CardDescription>Unpaid balances by supplier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={outstandingData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickFormatter={val => `${currency}${val / 1000}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#4B5563', fontSize: 12 }}
                    width={120}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    formatter={(value: number) => [
                      `${currency}${value.toLocaleString()}`,
                      'Outstanding Balance',
                    ]}
                  />
                  <Bar dataKey="amount" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
