'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, Clock, AlertCircle, CheckCircle2, Wallet } from 'lucide-react';
import type { ShopSubscription } from '../page';
import type { SubscriptionInvoice } from './SubscriptionInvoices';
import { addDays, isBefore, isAfter, startOfDay, isSameMonth } from 'date-fns';

interface SubscriptionStatsProps {
  subscriptions: ShopSubscription[];
  invoices: SubscriptionInvoice[];
  isLoading: boolean;
}

export function SubscriptionStats({ subscriptions, invoices, isLoading }: SubscriptionStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[...Array(6)].map((_, i) => (
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    dueSoon: subscriptions.filter(s => {
      if (s.status !== 'active' || !s.end_date) return false;
      const endDate = new Date(s.end_date);
      return isAfter(endDate, today) && isBefore(endDate, in14Days);
    }).length,
    overdueCount: invoices.filter(inv => inv.status?.toLowerCase() === 'overdue').length,

    // Financials based on Invoices
    totalRevenue: invoices.reduce((sum, inv) => {
      if (inv.status?.toLowerCase() !== 'paid') return sum;
      return (
        sum +
        parseFloat(inv.subtotal_amount || '0') +
        parseFloat(inv.tax_amount || '0') -
        parseFloat(inv.discount_amount || '0')
      );
    }, 0),

    dueThisMonthAmount: invoices.reduce((sum, inv) => {
      if (inv.status?.toLowerCase() === 'paid') return sum;
      const issuedDate = new Date(inv.issued_at);
      if (isSameMonth(issuedDate, today)) {
        return (
          sum +
          parseFloat(inv.subtotal_amount || '0') +
          parseFloat(inv.tax_amount || '0') -
          parseFloat(inv.discount_amount || '0')
        );
      }
      return sum;
    }, 0),

    overdueAmount: invoices.reduce((sum, inv) => {
      const status = inv.status?.toLowerCase();
      if (
        status === 'overdue' ||
        (status === 'pending' && isBefore(new Date(inv.due_date), today))
      ) {
        return (
          sum +
          parseFloat(inv.subtotal_amount || '0') +
          parseFloat(inv.tax_amount || '0') -
          parseFloat(inv.discount_amount || '0')
        );
      }
      return sum;
    }, 0),
  };

  const metrics = [
    {
      title: 'Revenue (Paid)',
      value: formatCurrency(stats.totalRevenue),
      icon: Wallet,
      description: 'Total from all paid invoices',
      color: 'text-primary',
    },
    {
      title: 'Due (Month)',
      value: formatCurrency(stats.dueThisMonthAmount),
      icon: Clock,
      description: 'Unpaid invoices this month',
      color: 'text-orange-500',
    },
    {
      title: 'Pending / Overdue',
      value: formatCurrency(stats.overdueAmount),
      icon: AlertCircle,
      description: `${stats.overdueCount} overdue invoices`,
      color: 'text-red-500',
    },
    {
      title: 'Total Subs',
      value: stats.total,
      icon: Users,
      description: 'Total registered plans',
      color: 'text-blue-500',
    },
    {
      title: 'Active Plans',
      value: stats.active,
      icon: CheckCircle2,
      description: 'Currently paid',
      color: 'text-green-500',
    },
    {
      title: 'Due (14d)',
      value: stats.dueSoon,
      icon: CreditCard,
      description: 'Renewals in 2 weeks',
      color: 'text-muted-foreground',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {metrics.map(metric => (
        <Card key={metric.title} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            <metric.icon className={`h-4 w-4 ${metric.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">{metric.value}</div>
            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
