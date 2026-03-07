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
    Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, addMonths, startOfMonth, isSameMonth, parseISO } from 'date-fns';
import type { ShopSubscription } from '../page';

interface BillingTrendChartProps {
    subscriptions: ShopSubscription[];
}

export function BillingTrendChart({ subscriptions }: BillingTrendChartProps) {
    const chartData = useMemo(() => {
        const today = new Date();
        const months = Array.from({ length: 6 }, (_, i) => startOfMonth(addMonths(today, i)));

        return months.map(month => {
            const label = format(month, 'MMM yyyy');
            const amount = subscriptions.reduce((sum, sub) => {
                if (sub.status !== 'active' || !sub.end_date) return sum;

                const endDate = new Date(sub.end_date);
                // Simple projection: if it expires in this future month, it's due
                if (isSameMonth(endDate, month)) {
                    const price = sub.billing_cycle === 'yearly' ? sub.plan?.price_yearly : sub.plan?.price_monthly;
                    return sum + (price || 0);
                }

                // For monthly subscriptions, if the renewal is in a past month but it's active, 
                // it will also be due in this future month (recurring)
                if (sub.billing_cycle === 'monthly' && isBefore(endDate, month)) {
                    return sum + (sub.plan?.price_monthly || 0);
                }

                return sum;
            }, 0);

            return {
                name: label,
                amount,
                fullDate: month
            };
        });
    }, [subscriptions]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <Card className="border-primary/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Projected Billing Trend</CardTitle>
                <CardDescription className="text-xs">
                    Estimated revenue from renewals over the next 6 months
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#64748B' }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#64748B' }}
                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white p-2 border rounded shadow-sm text-xs">
                                                <p className="font-bold text-slate-900">{payload[0].payload.name}</p>
                                                <p className="text-primary font-mono">{formatCurrency(payload[0].value as number)}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar
                                dataKey="amount"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={index === 0 ? '#3B82F6' : '#94A3B8'}
                                        fillOpacity={index === 0 ? 1 : 0.6}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

function isBefore(date1: Date, date2: Date) {
    return date1.getTime() < date2.getTime();
}
