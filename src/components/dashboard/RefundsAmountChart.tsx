'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import {
    format,
    startOfDay,
    startOfWeek,
    startOfMonth,
    startOfYear,
    subDays,
    subWeeks,
    subMonths,
    subYears,
} from 'date-fns';
import { BarChart2 } from 'lucide-react';
import { CHART_COLORS } from '@/lib/chartColors';
import { Button } from '@/components/ui/button';
import type { Refund } from '@/hooks/useGraphql';

const TICK_FILL = 'hsl(var(--foreground) / 0.9)';
const GRID_STROKE = 'hsl(var(--foreground) / 0.15)';

type Period = 'day' | 'week' | 'month' | 'year';

interface Props {
    refunds: Refund[];
    isLoading: boolean;
    formatCurrency: (amount: string) => string;
}

export default function RefundsAmountChart({ refunds, isLoading, formatCurrency }: Props) {
    const [period, setPeriod] = useState<Period>('month');

    const chartData = useMemo(() => {
        if (!refunds.length) return [];
        const now = new Date();
        const getKey = (d: Date) => {
            switch (period) {
                case 'day': return format(startOfDay(d), 'yyyy-MM-dd');
                case 'week': return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                case 'month': return format(startOfMonth(d), 'yyyy-MM');
                case 'year': return format(startOfYear(d), 'yyyy');
            }
        };
        const range = period === 'day' ? 14 : period === 'week' ? 12 : period === 'month' ? 12 : 5;

        const buckets: Record<string, { approved: number; pending: number; rejected: number }> = {};
        for (let i = 0; i < range; i++) {
            let d: Date;
            if (period === 'day') d = subDays(now, range - 1 - i);
            else if (period === 'week') d = subWeeks(now, range - 1 - i);
            else if (period === 'month') d = subMonths(now, range - 1 - i);
            else d = subYears(now, range - 1 - i);
            const key = getKey(d);
            buckets[key] = { approved: 0, pending: 0, rejected: 0 };
        }

        refunds.forEach(r => {
            const key = getKey(new Date(r.created_at));
            const amt = parseFloat(r.amount) || 0;
            if (key && key in buckets) {
                const s = r.status.toLowerCase();
                if (s === 'approved') buckets[key].approved += amt;
                else if (s === 'rejected') buckets[key].rejected += amt;
                else buckets[key].pending += amt;
            }
        });

        const labelFormat =
            period === 'day' ? 'MMM d' :
                period === 'week' ? 'MMM d' :
                    period === 'month' ? 'MMM yy' : 'yyyy';

        return Object.entries(buckets)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, v]) => ({
                name:
                    period === 'month'
                        ? format(new Date(key + '-01'), labelFormat)
                        : period === 'year'
                            ? key
                            : format(new Date(key), labelFormat),
                Approved: Math.round(v.approved),
                'Pending / In Review': Math.round(v.pending),
                Rejected: Math.round(v.rejected),
            }));
    }, [refunds, period]);

    return (
        <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base flex items-center gap-2">
                    <BarChart2 className="h-4 w-4" />
                    Refund Amount by Status
                </CardTitle>
                <div className="flex flex-wrap gap-1">
                    {(['day', 'week', 'month', 'year'] as const).map(p => (
                        <Button
                            key={p}
                            variant={period === p ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setPeriod(p)}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </Button>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : chartData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                No refund data
                            </div>
                        ) : (
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: TICK_FILL }} axisLine={{ stroke: GRID_STROKE }} tickLine={{ stroke: GRID_STROKE }} />
                                <YAxis
                                    tick={{ fontSize: 11, fill: TICK_FILL }}
                                    axisLine={{ stroke: GRID_STROKE }}
                                    tickLine={{ stroke: GRID_STROKE }}
                                    tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: 'var(--radius)',
                                    }}
                                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                                    formatter={(value: number) => [formatCurrency(String(value)), undefined]}
                                />
                                <Legend formatter={value => <span style={{ color: TICK_FILL, fontSize: 12 }}>{value}</span>} />
                                <Bar dataKey="Approved" fill={CHART_COLORS.green} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Pending / In Review" fill={CHART_COLORS.yellow} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Rejected" fill={CHART_COLORS.red} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
