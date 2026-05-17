'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Brain, Film, TrendingUp } from 'lucide-react';

interface UsageAnalyticsProps {
  subscriptions: any[];
  isLoading: boolean;
}

export function UsageAnalytics({ subscriptions, isLoading }: UsageAnalyticsProps) {
  const usageData = useMemo(() => {
    if (!subscriptions) return { ai: [], reels: [] };

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const aiUsageByMonth: Record<string, number> = {};
    const reelUsageByMonth: Record<string, number> = {};

    const getMonthName = (m: any) => {
      if (!m) return 'Unknown';
      if (typeof m === 'number') return months[m - 1] || 'Unknown';
      if (typeof m === 'string') {
        const monthMap: Record<string, string> = {
          january: 'Jan',
          february: 'Feb',
          march: 'Mar',
          april: 'Apr',
          may: 'May',
          june: 'Jun',
          july: 'Jul',
          august: 'Aug',
          september: 'Sep',
          october: 'Oct',
          november: 'Nov',
          december: 'Dec',
          '1': 'Jan',
          '2': 'Feb',
          '3': 'Mar',
          '4': 'Apr',
          '5': 'May',
          '6': 'Jun',
          '7': 'Jul',
          '8': 'Aug',
          '9': 'Sep',
          '10': 'Oct',
          '11': 'Nov',
          '12': 'Dec',
        };
        const lower = m.toLowerCase();
        return monthMap[lower] || m.substring(0, 3);
      }
      return 'Unknown';
    };

    subscriptions.forEach(sub => {
      (sub.subscription_invoices || []).forEach((inv: any) => {
        // AI Usage
        (inv.ai_usage || []).forEach((ai: any) => {
          const monthName = getMonthName(ai.month);
          aiUsageByMonth[monthName] = (aiUsageByMonth[monthName] || 0) + (ai.requests_sent || 0);
        });

        // Reel Usage
        (inv.reel_usage || []).forEach((reel: any) => {
          const monthName = getMonthName(reel.month);
          reelUsageByMonth[monthName] = (reelUsageByMonth[monthName] || 0) + 1;
        });
      });
    });

    const ai = months.map(m => ({ name: m, requests: aiUsageByMonth[m] || 0 }));
    const reels = months.map(m => ({ name: m, usage: reelUsageByMonth[m] || 0 }));

    return { ai, reels };
  }, [subscriptions]);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="animate-pulse">
          <CardHeader className="h-20 bg-muted" />
          <CardContent className="h-[250px] bg-muted/50 mt-4" />
        </Card>
        <Card className="animate-pulse">
          <CardHeader className="h-20 bg-muted" />
          <CardContent className="h-[250px] bg-muted/50 mt-4" />
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* AI Usage Chart */}
      <Card className="border-primary/10 hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">AI Service Usage</CardTitle>
              <CardDescription className="text-xs">Total requests sent per month</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageData.ai}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border rounded-xl shadow-xl text-xs">
                          <p className="font-bold text-slate-900 mb-1">{payload[0].payload.name}</p>
                          <p className="text-purple-600 font-mono flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {payload[0].value} Requests
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="requests" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Reel Usage Chart */}
      <Card className="border-primary/10 hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Film className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">Reel Advertising Usage</CardTitle>
              <CardDescription className="text-xs">Monthly advertising engagement</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usageData.reels}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border rounded-xl shadow-xl text-xs">
                          <p className="font-bold text-slate-900 mb-1">{payload[0].payload.name}</p>
                          <p className="text-blue-600 font-mono">{payload[0].value} Sessions</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="usage"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
