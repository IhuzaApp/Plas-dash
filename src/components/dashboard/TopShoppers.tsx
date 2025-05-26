import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { hasuraRequest } from '@/lib/hasura';
import { GET_TOP_SHOPPERS } from '@/lib/graphql/queries';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subDays, parseISO, differenceInMinutes } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { useSystemConfig } from '@/hooks/useHasuraApi';

interface Rating {
  rating: number;
}

interface Order {
  id: string;
  created_at: string;
  updated_at: string;
  delivery_fee: string;
  service_fee: string;
  Ratings: Rating[];
}

interface Shopper {
  id: string;
  active: boolean;
  status: string;
}

interface TopShopperData {
  Users: Array<{
    id: string;
    name: string;
    profile_picture: string | null;
    shopper: Shopper;
    Orders: Order[];
  }>;
}

interface ShopperPerformance {
  id: string;
  name: string;
  profilePicture: string | null;
  shopperStatus: string;
  totalOrders: number;
  totalEarnings: number;
  onTimeDeliveryPercentage: number;
  averageDeliveryTime: number;
  averageRating: number | null;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500',
  offline: 'bg-gray-500',
  busy: 'bg-orange-500',
};

const timeRanges = [
  { value: '7', label: 'Last 7 Days' },
  { value: '14', label: 'Last 14 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' },
];

const MAX_DELIVERY_TIME = 90; // 1 hour and 30 minutes maximum delivery time

const formatDeliveryTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)}min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return remainingMinutes > 0 
      ? `${hours}h ${remainingMinutes}min`
      : `${hours}h`;
  }
};

const formatPercentage = (percentage: number): string => {
  return `${Math.round(percentage)}%`;
};

const PERFORMANCE_TIERS = {
  EXCELLENT: {
    threshold: 95,
    label: '🏆 Elite',
    class: 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
  },
  GREAT: {
    threshold: 90,
    label: '⭐ Great',
    class: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
  },
  GOOD: {
    threshold: 80,
    label: '👍 Good',
    class: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
  },
  NEEDS_IMPROVEMENT: {
    threshold: 70,
    label: '⚠️ Needs Work',
    class: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'
  },
  POOR: {
    threshold: 0,
    label: '❌ Poor',
    class: 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
  }
};

const getPerformanceTier = (onTimePercentage: number) => {
  if (onTimePercentage >= PERFORMANCE_TIERS.EXCELLENT.threshold) return PERFORMANCE_TIERS.EXCELLENT;
  if (onTimePercentage >= PERFORMANCE_TIERS.GREAT.threshold) return PERFORMANCE_TIERS.GREAT;
  if (onTimePercentage >= PERFORMANCE_TIERS.GOOD.threshold) return PERFORMANCE_TIERS.GOOD;
  if (onTimePercentage >= PERFORMANCE_TIERS.NEEDS_IMPROVEMENT.threshold) return PERFORMANCE_TIERS.NEEDS_IMPROVEMENT;
  return PERFORMANCE_TIERS.POOR;
};

const TopShoppers = () => {
  const [selectedRange, setSelectedRange] = React.useState('30');
  const { data: systemConfig } = useSystemConfig();

  // Calculate date range
  const dateRange = React.useMemo(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, parseInt(selectedRange));
    return {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    };
  }, [selectedRange]);

  const { data, isLoading } = useQuery<TopShopperData>({
    queryKey: ['top-shoppers', selectedRange],
    queryFn: async () => {
      console.log('Fetching with date range:', dateRange);
      const response = await hasuraRequest<TopShopperData>(GET_TOP_SHOPPERS, dateRange);
      console.log('Response:', response);
      return response;
    },
  });

  const formatCurrency = (amount: number) => {
    const currency = systemConfig?.System_configuratioins[0]?.currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const calculateShopperPerformance = (shoppers: TopShopperData['Users']): ShopperPerformance[] => {
    return shoppers
      .filter(user => user.shopper?.active) // Only include active shoppers
      .map(user => {
        const orders = user.Orders;
        
        // Calculate delivery performance
        const deliveryTimes = orders.map(order => {
          const minutes = differenceInMinutes(
            parseISO(order.updated_at),
            parseISO(order.created_at)
          );
          return minutes;
        });

        // Calculate on-time delivery percentage
        const onTimeDeliveries = deliveryTimes.filter(time => time <= MAX_DELIVERY_TIME).length;
        const onTimeDeliveryPercentage = (onTimeDeliveries / orders.length) * 100;

        // Calculate average delivery time
        const averageDeliveryTime = deliveryTimes.length > 0
          ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length
          : 0;

        // Calculate average rating (null if no ratings)
        const ratings = orders.flatMap(order => order.Ratings.map(r => r.rating));
        const averageRating = ratings.length > 0
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
          : null;

        // Calculate total earnings
        const totalEarnings = orders.reduce((sum, order) => {
          const deliveryFee = parseFloat(order.delivery_fee || '0');
          const serviceFee = parseFloat(order.service_fee || '0');
          return sum + deliveryFee + serviceFee;
        }, 0);

        return {
          id: user.id,
          name: user.name,
          profilePicture: user.profile_picture,
          shopperStatus: user.shopper.status || 'active',
          totalOrders: orders.length,
          totalEarnings,
          onTimeDeliveryPercentage,
          averageDeliveryTime,
          averageRating
        };
      })
      .filter(shopper => shopper.totalOrders > 0) // Only include shoppers with orders
      .sort((a, b) => {
        // Primary sort by on-time delivery percentage
        if (b.onTimeDeliveryPercentage !== a.onTimeDeliveryPercentage) {
          return b.onTimeDeliveryPercentage - a.onTimeDeliveryPercentage;
        }
        // Secondary sort by number of orders (for those with same on-time percentage)
        if (b.totalOrders !== a.totalOrders) {
          return b.totalOrders - a.totalOrders;
        }
        // Tertiary sort by rating if available
        if (a.averageRating !== null && b.averageRating !== null) {
          return b.averageRating - a.averageRating;
        }
        return 0;
      })
      .slice(0, 4);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Shoppers</CardTitle>
          <CardDescription>Performance in the last {selectedRange} days</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const shoppers = data?.Users || [];
  console.log('Processing shoppers:', shoppers.length);
  
  // Calculate performance metrics and sort shoppers
  const sortedShoppers = calculateShopperPerformance(shoppers);

  console.log('Sorted shoppers:', sortedShoppers);

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
              {timeRanges.map(range => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <CardDescription>
          Top performing shoppers in the last {selectedRange} days
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="space-y-0">
          {sortedShoppers.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No active shoppers found in this period
            </div>
          ) : (
            sortedShoppers.map(shopper => (
              <div
                key={shopper.id}
                className="flex items-center justify-between px-6 py-3 hover:bg-muted/50"
              >
                <div className="flex items-center space-x-3">
                  <Avatar>
                    {shopper.profilePicture ? (
                      <AvatarImage src={shopper.profilePicture} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {shopper.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {shopper.name}
                      <span className={`w-2 h-2 rounded-full ${statusColors[shopper.shopperStatus]}`} />
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
                  <div className="text-xs text-muted-foreground flex items-center justify-end">
                    <span className="mr-1">⭐</span>
                    {shopper.averageRating === null ? 'New' : shopper.averageRating.toFixed(1)}
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
