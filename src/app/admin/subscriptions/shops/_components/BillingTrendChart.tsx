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
    Cell,
    LineChart,
    Line,
    Legend,
    PieChart,
    Pie
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, subMonths, startOfMonth, isSameMonth, parseISO } from 'date-fns';
import type { ShopSubscription } from '../page';
import type { SubscriptionInvoice } from './SubscriptionInvoices';

interface BillingTrendChartProps {
    subscriptions: ShopSubscription[];
    invoices: SubscriptionInvoice[];
}

export function BillingTrendChart({ subscriptions, invoices }: BillingTrendChartProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Chart 1: Plan Distribution (Subscriber Count per Plan)
    const planData = useMemo(() => {
        const counts: Record<string, number> = {};
        subscriptions.forEach(sub => {
            const planName = sub.plan?.name || 'Unknown';
            counts[planName] = (counts[planName] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [subscriptions]);

    // Chart 2: Invoice Status Trend (Paid vs Unpaid/Pending over last 6 months)
    const trendData = useMemo(() => {
        const months = Array.from({ length: 6 }, (_, i) => startOfMonth(subMonths(new Date(), 5 - i)));

        return months.map(month => {
            const label = format(month, 'MMM');
            const paid = invoices.reduce((sum, inv) => {
                if (inv.status?.toLowerCase() === 'paid' && isSameMonth(new Date(inv.issued_at), month)) {
                    const total = parseFloat(inv.subtotal_amount || '0') + parseFloat(inv.tax_amount || '0') - parseFloat(inv.discount_amount || '0');
                    return sum + total;
                }
                return sum;
            }, 0);

            const unpaid = invoices.reduce((sum, inv) => {
                const status = inv.status?.toLowerCase();
                if ((status === 'pending' || status === 'overdue') && isSameMonth(new Date(inv.issued_at), month)) {
                    const total = parseFloat(inv.subtotal_amount || '0') + parseFloat(inv.tax_amount || '0') - parseFloat(inv.discount_amount || '0');
                    return sum + total;
                }
                return sum;
            }, 0);

            return {
                name: label,
                paid,
                unpaid,
            };
        });
    }, [invoices]);

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Chart 1: Plan Distribution */}
            <Card className="border-primary/10">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Plan Distribution</CardTitle>
                    <CardDescription className="text-xs">
                        Subscriber counts across different plans
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={planData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                                <XAxis type="number" axisLine={false} tickLine={false} hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#64748B' }}
                                    width={100}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white p-2 border rounded shadow-sm text-xs">
                                                    <p className="font-bold text-slate-900">{payload[0].payload.name}</p>
                                                    <p className="text-primary font-mono">{payload[0].value} Subscribers</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                                    {planData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Chart 2: Invoice Trends */}
            <Card className="border-primary/10">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Invoice Trends (Last 6 Months)</CardTitle>
                    <CardDescription className="text-xs">
                        Comparison of Paid vs Unpaid/Pending revenue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
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
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white p-2 border rounded shadow-sm text-xs space-y-1">
                                                    <p className="font-bold text-slate-900 border-b pb-1 mb-1">{payload[0].payload.name}</p>
                                                    {payload.map((p, i) => (
                                                        <p key={i} style={{ color: p.color }} className="font-mono">
                                                            {p.name}: {formatCurrency(p.value as number)}
                                                        </p>
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
                                <Line
                                    type="monotone"
                                    dataKey="paid"
                                    name="Paid"
                                    stroke="#10B981"
                                    strokeWidth={2}
                                    dot={{ fill: '#10B981', r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="unpaid"
                                    name="Unpaid/Pending"
                                    stroke="#EF4444"
                                    strokeWidth={2}
                                    dot={{ fill: '#EF4444', r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
