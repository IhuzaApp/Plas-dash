'use client';

import React, { useMemo } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, subMonths, startOfMonth, isSameMonth, isWithinInterval, startOfYear, endOfYear } from 'date-fns';

interface SubscriberTrendChartProps {
  subscriptions: any[];
  isLoading: boolean;
}

export function SubscriberTrendChart({ subscriptions, isLoading }: SubscriberTrendChartProps) {
  const trendData = useMemo(() => {
    if (!subscriptions) return [];

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    return months.map((month, index) => {
      const shopCount = subscriptions.filter(sub => {
        const date = new Date(sub.created_at);
        return date.getMonth() === index && date.getFullYear() === currentYear && sub.shop_id;
      }).length;

      const restaurantCount = subscriptions.filter(sub => {
        const date = new Date(sub.created_at);
        return date.getMonth() === index && date.getFullYear() === currentYear && sub.restaurant_id;
      }).length;

      const businessCount = subscriptions.filter(sub => {
        const date = new Date(sub.created_at);
        return date.getMonth() === index && date.getFullYear() === currentYear && sub.business_id;
      }).length;

      return {
        name: month,
        Shops: shopCount,
        Restaurants: restaurantCount,
        Businesses: businessCount,
        Total: shopCount + restaurantCount + businessCount,
      };
    });
  }, [subscriptions]);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="h-20 bg-muted" />
        <CardContent className="h-[300px] bg-muted/50 mt-4" />
      </Card>
    );
  }

  return (
    <Card className="border-primary/10">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Subscription Growth Trends</CardTitle>
        <CardDescription className="text-xs">
          New subscriptions by entity type over the current year
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorShops" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#64748B' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#64748B' }} 
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border rounded-xl shadow-xl text-xs space-y-2">
                        <p className="font-bold text-slate-900 border-b pb-1">
                          {payload[0].payload.name}
                        </p>
                        {payload.map((p: any, i: number) => (
                          <div key={i} className="flex items-center justify-between gap-4">
                            <span style={{ color: p.color }} className="font-medium">{p.name}:</span>
                            <span className="font-mono font-bold">{p.value}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                formatter={(value) => <span className="text-[10px] text-slate-500 uppercase font-medium">{value}</span>}
              />
              <Area 
                type="monotone" 
                dataKey="Shops" 
                stroke="#3B82F6" 
                fillOpacity={1} 
                fill="url(#colorShops)" 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="Restaurants" 
                stroke="#10B981" 
                fillOpacity={1} 
                fill="url(#colorRest)" 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="Businesses" 
                stroke="#F59E0B" 
                fillOpacity={1} 
                fill="#F59E0B" 
                fillOpacity={0.05}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
