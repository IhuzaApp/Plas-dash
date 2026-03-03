'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  AreaChart,
  Area,
} from 'recharts';
import { OrderOffer } from '@/hooks/useHasuraApi';
import { format, startOfDay, startOfWeek, startOfMonth } from 'date-fns';

interface OrderOffersAnalyticsProps {
  offers: OrderOffer[];
}

const COLORS = ['#10b981', '#ef4444', '#6b7280', '#3b82f6', '#f59e0b']; // Accepted, Rejected, Skipped, etc.

const OrderOffersAnalytics = ({ offers }: OrderOffersAnalyticsProps) => {
  // 1. Offer Trends by Day
  const processTrendData = () => {
    const dailyData: Record<string, any> = {};

    offers.forEach(offer => {
      const day = format(new Date(offer.offered_at), 'MMM d');
      if (!dailyData[day]) {
        dailyData[day] = { name: day, accepted: 0, rejected: 0, skipped: 0, total: 0 };
      }

      const status = offer.status.toLowerCase();
      if (status === 'accepted') dailyData[day].accepted++;
      else if (status === 'rejected') dailyData[day].rejected++;
      else dailyData[day].skipped++; // Including expired/skipped as "not accepted"

      dailyData[day].total++;
    });

    return Object.values(dailyData).slice(-14); // Last 14 days
  };

  // 2. Shopper Performance (Top 10)
  const processShopperData = () => {
    const shopperStats: Record<string, any> = {};

    offers.forEach(offer => {
      const shopperName = offer.ShopperUser?.shopper?.full_name || 'Unknown';
      if (!shopperStats[shopperName]) {
        shopperStats[shopperName] = { name: shopperName, accepted: 0, total: 0 };
      }

      if (offer.status.toLowerCase() === 'accepted') {
        shopperStats[shopperName].accepted++;
      }
      shopperStats[shopperName].total++;
    });

    return Object.values(shopperStats)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(s => ({
        ...s,
        rate: Math.round((s.accepted / s.total) * 100),
      }));
  };

  // 3. Offer Distribution by Status
  const processStatusData = () => {
    const statusCounts: Record<string, number> = {};
    offers.forEach(offer => {
      const s = offer.status;
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  };

  const trendData = processTrendData();
  const shopperData = processShopperData();
  const statusData = processStatusData();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend of Offers Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Offer Status Trend</CardTitle>
            <CardDescription>Daily performance of order offers</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend iconType="circle" />
                <Area
                  type="monotone"
                  dataKey="accepted"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="rejected"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="skipped"
                  stackId="1"
                  stroke="#6b7280"
                  fill="#6b7280"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Shopper Acceptance Rate Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shopper Acceptance Performance</CardTitle>
            <CardDescription>Top shoppers by offers handled</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shopperData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="accepted" name="Accepted" fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="total" name="Total Offers" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Offer Outcomes</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Volume Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Daily Offer Volume</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="total" name="Total Offers" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderOffersAnalytics;
