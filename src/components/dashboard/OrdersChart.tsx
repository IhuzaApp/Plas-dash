import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  useOrders,
  useReelOrders,
  useBusinessOrders,
  useRestaurantOrders,
} from '@/hooks/useHasuraApi';
import { format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { CHART_COLORS } from '@/lib/chartColors';

const TICK_FILL = 'hsl(var(--foreground) / 0.9)';
const GRID_STROKE = 'hsl(var(--foreground) / 0.15)';

type OrderWithDate = { created_at: string };

// Custom tooltip showing breakdown by order type
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length || !label) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-md text-card-foreground min-w-[160px]">
      <div className="font-semibold mb-2">{label}</div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span>Regular</span>
          <span className="font-medium">{p.regular ?? 0}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Reel</span>
          <span className="font-medium">{p.reel ?? 0}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Restaurant</span>
          <span className="font-medium">{p.restaurant ?? 0}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Business</span>
          <span className="font-medium">{p.business ?? 0}</span>
        </div>
        <div className="border-t border-border pt-1 mt-1 flex justify-between gap-4 font-semibold">
          <span>Total</span>
          <span>{(p.regular ?? 0) + (p.reel ?? 0) + (p.restaurant ?? 0) + (p.business ?? 0)}</span>
        </div>
      </div>
    </div>
  );
};

const RevenueChart = () => {
  const { data: ordersData, isLoading: loadingOrders } = useOrders();
  const { data: reelData, isLoading: loadingReel } = useReelOrders();
  const { data: businessData, isLoading: loadingBusiness } = useBusinessOrders();
  const { data: restaurantData, isLoading: loadingRestaurant } = useRestaurantOrders();

  const isLoading = loadingOrders || loadingReel || loadingBusiness || loadingRestaurant;

  const chartData = React.useMemo(() => {
    const regular = (ordersData?.Orders || []) as OrderWithDate[];
    const reel = (reelData?.reel_orders || []) as OrderWithDate[];
    const business = (businessData?.orders || []) as OrderWithDate[];
    const restaurant = (restaurantData?.orders || []) as OrderWithDate[];

    const dayCounts: Record<
      string,
      { regular: number; reel: number; restaurant: number; business: number }
    > = {};

    const add = (dateKey: string, type: 'regular' | 'reel' | 'restaurant' | 'business') => {
      if (!dayCounts[dateKey]) {
        dayCounts[dateKey] = { regular: 0, reel: 0, restaurant: 0, business: 0 };
      }
      dayCounts[dateKey][type] += 1;
    };

    regular.forEach(o => {
      const key = format(parseISO(o.created_at), 'yyyy-MM-dd');
      add(key, 'regular');
    });
    reel.forEach(o => {
      const key = format(parseISO(o.created_at), 'yyyy-MM-dd');
      add(key, 'reel');
    });
    restaurant.forEach(o => {
      const key = format(parseISO(o.created_at), 'yyyy-MM-dd');
      add(key, 'restaurant');
    });
    business.forEach(o => {
      const key = format(parseISO(o.created_at), 'yyyy-MM-dd');
      add(key, 'business');
    });

    const sortedDays = Object.keys(dayCounts).sort();
    const last30 = sortedDays.length > 30 ? sortedDays.slice(-30) : sortedDays;

    return last30.map(day => {
      const c = dayCounts[day];
      return {
        name: format(parseISO(day), 'MMM d'),
        day,
        regular: c.regular,
        reel: c.reel,
        restaurant: c.restaurant,
        business: c.business,
      };
    });
  }, [ordersData, reelData, businessData, restaurantData]);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Orders Overview</CardTitle>
        <p className="text-sm text-muted-foreground">
          Regular, reel, restaurant, and business orders by day.
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <AreaChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={GRID_STROKE} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: TICK_FILL }}
                  axisLine={{ stroke: GRID_STROKE }}
                  tickLine={{ stroke: GRID_STROKE }}
                />
                <YAxis
                  tick={{ fill: TICK_FILL }}
                  axisLine={{ stroke: GRID_STROKE }}
                  tickLine={{ stroke: GRID_STROKE }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={value => <span style={{ color: TICK_FILL }}>{value}</span>} />
                <Area
                  type="monotone"
                  dataKey="regular"
                  stackId="1"
                  stroke={CHART_COLORS.green}
                  strokeWidth={1.5}
                  fill={CHART_COLORS.green}
                  fillOpacity={0.7}
                  name="Regular"
                />
                <Area
                  type="monotone"
                  dataKey="reel"
                  stackId="1"
                  stroke={CHART_COLORS.blue}
                  strokeWidth={1.5}
                  fill={CHART_COLORS.blue}
                  fillOpacity={0.7}
                  name="Reel"
                />
                <Area
                  type="monotone"
                  dataKey="restaurant"
                  stackId="1"
                  stroke={CHART_COLORS.red}
                  strokeWidth={1.5}
                  fill={CHART_COLORS.red}
                  fillOpacity={0.7}
                  name="Restaurant"
                />
                <Area
                  type="monotone"
                  dataKey="business"
                  stackId="1"
                  stroke={CHART_COLORS.orange}
                  strokeWidth={1.5}
                  fill={CHART_COLORS.orange}
                  fillOpacity={0.7}
                  name="Business"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
