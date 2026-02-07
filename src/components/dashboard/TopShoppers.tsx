import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { Loader2 } from 'lucide-react';
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

interface TopShopperItem {
  shopper_id: string;
  user_id: string | null;
  name: string;
  profile_picture: string | null;
  totalOrders: number;
  totalEarnings: number;
  onTimeDeliveryPercentage: number;
  onTimeCount: number;
}

const timeRanges = [
  { value: '7', label: 'Last 7 Days' },
  { value: '14', label: 'Last 14 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' },
];

const formatPercentage = (percentage: number): string => {
  return `${Math.round(percentage)}%`;
};

const PERFORMANCE_TIERS = {
  EXCELLENT: {
    threshold: 95,
    label: '🏆 Elite',
    class: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
  },
  GREAT: {
    threshold: 90,
    label: '⭐ Great',
    class: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
  },
  GOOD: {
    threshold: 80,
    label: '👍 Good',
    class: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
  },
  NEEDS_IMPROVEMENT: {
    threshold: 70,
    label: '⚠️ Needs Work',
    class: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
  },
  POOR: {
    threshold: 0,
    label: '❌ Poor',
    class: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
  },
};

const getPerformanceTier = (onTimePercentage: number) => {
  if (onTimePercentage >= PERFORMANCE_TIERS.EXCELLENT.threshold) return PERFORMANCE_TIERS.EXCELLENT;
  if (onTimePercentage >= PERFORMANCE_TIERS.GREAT.threshold) return PERFORMANCE_TIERS.GREAT;
  if (onTimePercentage >= PERFORMANCE_TIERS.GOOD.threshold) return PERFORMANCE_TIERS.GOOD;
  if (onTimePercentage >= PERFORMANCE_TIERS.NEEDS_IMPROVEMENT.threshold)
    return PERFORMANCE_TIERS.NEEDS_IMPROVEMENT;
  return PERFORMANCE_TIERS.POOR;
};

const TopShoppers = () => {
  const [selectedRange, setSelectedRange] = React.useState('30');
  const { data: systemConfig } = useSystemConfig();

  const dateRange = React.useMemo(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, parseInt(selectedRange, 10));
    return {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    };
  }, [selectedRange]);

  const { data, isLoading } = useQuery<{ shoppers: TopShopperItem[] }>({
    queryKey: ['top-shoppers-stats', dateRange.start, dateRange.end],
    queryFn: () =>
      apiGet<{ shoppers: TopShopperItem[] }>(
        `/api/queries/top-shoppers-stats?start=${encodeURIComponent(dateRange.start)}&end=${encodeURIComponent(dateRange.end)}`
      ),
  });

  const formatCurrency = (amount: number) => {
    const currency = systemConfig?.System_configuratioins?.[0]?.currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const shoppers = data?.shoppers ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Shoppers</CardTitle>
          <CardDescription>Performance in the last {selectedRange} days (all order types)</CardDescription>
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
          <CardTitle>Top Shoppers</CardTitle>
          <Select value={selectedRange} onValueChange={setSelectedRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <CardDescription>
          Top performing shoppers (regular, reel, restaurant, business orders) in the last {selectedRange} days
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="space-y-0">
          {shoppers.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No delivered orders in this period
            </div>
          ) : (
            shoppers.slice(0, 4).map((shopper) => (
              <div
                key={shopper.shopper_id}
                className="flex items-center justify-between px-6 py-3 hover:bg-muted/50"
              >
                <div className="flex items-center space-x-3">
                  <Avatar>
                    {shopper.profile_picture ? (
                      <AvatarImage src={shopper.profile_picture} alt={shopper.name} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {shopper.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase() || 'S'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {shopper.name}
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <Badge
                        variant="secondary"
                        className={getPerformanceTier(shopper.onTimeDeliveryPercentage).class}
                      >
                        {getPerformanceTier(shopper.onTimeDeliveryPercentage).label}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {shopper.totalOrders} orders • {formatPercentage(shopper.onTimeDeliveryPercentage)} on time
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(shopper.totalEarnings)}</div>
                  <div className="text-xs text-muted-foreground">
                    {shopper.onTimeCount}/{shopper.totalOrders} on time
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopShoppers;
