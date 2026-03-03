'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChartIcon } from 'lucide-react';
import { CHART_COLORS } from '@/lib/chartColors';
import type { Refund } from '@/hooks/useGraphql';

const TICK_FILL = 'hsl(var(--foreground) / 0.9)';

const STATUS_COLORS: Record<string, string> = {
  pending: CHART_COLORS.yellow,
  in_review: CHART_COLORS.blue,
  approved: CHART_COLORS.green,
  rejected: CHART_COLORS.red,
};

interface Props {
  refunds: Refund[];
  isLoading: boolean;
}

export default function RefundsStatusChart({ refunds, isLoading }: Props) {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    refunds.forEach(r => {
      const key = r.status.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([status, value]) => ({
      name: status
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      value,
      key: status,
    }));
  }, [refunds]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <PieChartIcon className="h-4 w-4" />
          Refunds by Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No refund data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map(entry => (
                    <Cell key={entry.key} fill={STATUS_COLORS[entry.key] ?? CHART_COLORS.blue} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [value, 'Refunds']}
                />
                <Legend
                  formatter={value => (
                    <span style={{ color: TICK_FILL, fontSize: 12 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
