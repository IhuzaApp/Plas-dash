'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Users,
    CreditCard,
    Clock,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import type { ShopSubscription } from '../page';
import { addDays, isBefore, isAfter, startOfDay } from 'date-fns';

interface SubscriptionStatsProps {
    subscriptions: ShopSubscription[];
    isLoading: boolean;
}

export function SubscriptionStats({ subscriptions, isLoading }: SubscriptionStatsProps) {
    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {[...Array(5)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-16 bg-muted rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const today = startOfDay(new Date());
    const in14Days = addDays(today, 14);

    const stats = {
        total: subscriptions.length,
        paid: subscriptions.filter(s => s.status === 'active').length,
        dueSoon: subscriptions.filter(s => {
            if (s.status !== 'active' || !s.end_date) return false;
            const endDate = new Date(s.end_date);
            return isAfter(endDate, today) && isBefore(endDate, in14Days);
        }).length,
        overdue: subscriptions.filter(s => {
            if (s.status === 'inactive' || s.status === 'expired' || !s.end_date) return false;
            const endDate = new Date(s.end_date);
            return isBefore(endDate, today);
        }).length,
        inactive: subscriptions.filter(s => s.status === 'inactive' || s.status === 'expired').length,
    };

    const metrics = [
        {
            title: 'Total Subscriptions',
            value: stats.total,
            icon: Users,
            description: 'Total registered plans',
            color: 'text-blue-500',
        },
        {
            title: 'Paid / Active',
            value: stats.paid,
            icon: CheckCircle2,
            description: 'Currently active',
            color: 'text-green-500',
        },
        {
            title: 'Due (14 Days)',
            value: stats.dueSoon,
            icon: Clock,
            description: 'Renewals in 2 weeks',
            color: 'text-orange-500',
        },
        {
            title: 'Overdue',
            value: stats.overdue,
            icon: AlertCircle,
            description: 'Awaiting payment',
            color: 'text-red-500',
        },
        {
            title: 'Inactive',
            value: stats.inactive,
            icon: CreditCard,
            description: 'Expired or canceled',
            color: 'text-muted-foreground',
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {metrics.map((metric) => (
                <Card key={metric.title} className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                        <metric.icon className={`h-4 w-4 ${metric.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metric.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {metric.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
