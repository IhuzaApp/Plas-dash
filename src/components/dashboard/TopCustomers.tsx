'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { Loader2, Users, Trophy, Star, Crown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { subDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useSystemConfig } from '@/hooks/useHasuraApi';

interface TopCustomerItem {
  user_id: string;
  name: string;
  email: string | null;
  profile_picture: string | null;
  phone_number: string | null;
  totalOrders: number;
  totalSpend: number;
}

const timeRanges = [
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' },
  { value: '365', label: 'Last Year' },
  { value: 'all', label: 'All Time' },
];

const CUSTOMER_TIERS = {
  PLATINUM: {
    threshold: 50,
    label: 'Platinum',
    icon: Crown,
    class: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  GOLD: {
    threshold: 25,
    label: 'Gold',
    icon: Trophy,
    class: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  SILVER: {
    threshold: 10,
    label: 'Silver',
    icon: Star,
    class: 'bg-gray-100 text-gray-800 border-gray-300',
  },
  BRONZE: {
    threshold: 0,
    label: 'Bronze',
    icon: Users,
    class: 'bg-orange-100 text-orange-800 border-orange-300',
  },
};

const getCustomerTier = (orderCount: number) => {
  if (orderCount >= CUSTOMER_TIERS.PLATINUM.threshold) return CUSTOMER_TIERS.PLATINUM;
  if (orderCount >= CUSTOMER_TIERS.GOLD.threshold) return CUSTOMER_TIERS.GOLD;
  if (orderCount >= CUSTOMER_TIERS.SILVER.threshold) return CUSTOMER_TIERS.SILVER;
  return CUSTOMER_TIERS.BRONZE;
};

const TopCustomers = () => {
  const [selectedRange, setSelectedRange] = React.useState('30');
  const { data: systemConfig } = useSystemConfig();

  const dateRange = React.useMemo(() => {
    const endDate = new Date();
    if (selectedRange === 'all') {
      return { start: new Date(0).toISOString(), end: endDate.toISOString() };
    }
    const startDate = subDays(endDate, parseInt(selectedRange, 10));
    return {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    };
  }, [selectedRange]);

  const { data, isLoading } = useQuery<{ customers: TopCustomerItem[] }>({
    queryKey: ['top-customers-stats', dateRange.start, dateRange.end],
    queryFn: () =>
      apiGet<{ customers: TopCustomerItem[] }>(
        `/api/queries/top-customers-stats?start=${encodeURIComponent(dateRange.start)}&end=${encodeURIComponent(dateRange.end)}`
      ),
  });

  const formatCurrency = (amount: number) => {
    const currency = systemConfig?.System_configuratioins?.[0]?.currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const customers = data?.customers ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Top Customers
          </CardTitle>
          <CardDescription>Loading loyal customers...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Loyal Customers
          </CardTitle>
          <Select value={selectedRange} onValueChange={setSelectedRange}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map(range => (
                <SelectItem key={range.value} value={range.value} className="text-xs">
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <CardDescription className="text-xs">
          Customers with the highest order volume across all services.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="space-y-1">
          {customers.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No orders found for this period
            </div>
          ) : (
            customers.slice(0, 5).map((customer, index) => {
              const tier = getCustomerTier(customer.totalOrders);
              const Icon = tier.icon;
              return (
                <div
                  key={customer.user_id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors border-b last:border-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                        {customer.profile_picture ? (
                          <AvatarImage src={customer.profile_picture} alt={customer.name} />
                        ) : (
                          <AvatarFallback className="bg-primary/5 text-primary text-xs">
                            {customer.name
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase() || 'C'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="absolute -top-1 -left-1 bg-background rounded-full p-0.5 shadow-sm">
                         <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                           {index + 1}
                         </span>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-1.5">
                        {customer.name}
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 h-4 ${tier.class}`}
                        >
                          <Icon className="w-2.5 h-2.5 mr-1" />
                          {tier.label}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{customer.totalOrders} total orders</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span>{customer.phone_number || customer.email || 'No contact'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-primary">
                      {formatCurrency(customer.totalSpend)}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      Total Value
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopCustomers;
