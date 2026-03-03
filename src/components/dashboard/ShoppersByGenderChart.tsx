'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { Loader2, Users } from 'lucide-react';
import { PIE_COLORS } from '@/lib/chartColors';

const TICK_FILL = 'hsl(var(--foreground) / 0.9)';

export default function ShoppersByGenderChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['api', 'shoppers'],
    queryFn: () =>
      apiGet<{ shoppers: { User?: { gender?: string | null } }[] }>('/api/queries/shoppers'),
  });

  const chartData = useMemo(() => {
    if (!data?.shoppers?.length) return [];
    const counts: Record<string, number> = {};
    data.shoppers.forEach(s => {
      const g = (s.User?.gender ?? 'Unknown').trim() || 'Unknown';
      const key = g.charAt(0).toUpperCase() + g.slice(1).toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Shoppers by Gender
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No shopper data
              </div>
            ) : (
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent, x, y }) => (
                    <text
                      x={x}
                      y={y}
                      fill="hsl(var(--foreground) / 0.9)"
                      textAnchor="middle"
                      fontSize={12}
                    >
                      {name} {(percent * 100).toFixed(0)}%
                    </text>
                  )}
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                      stroke="hsl(var(--card))"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [value, 'Shoppers']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend formatter={value => <span style={{ color: TICK_FILL }}>{value}</span>} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
