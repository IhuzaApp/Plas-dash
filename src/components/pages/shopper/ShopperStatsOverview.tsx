import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Truck,
  Star,
  DollarSign,
  MessageSquare,
  Wallet,
  Clock,
  Store,
  UtensilsCrossed,
  Video,
} from 'lucide-react';
import type { ShopperDetailSummary } from '@/hooks/useHasuraApi';

interface ShopperStatsOverviewProps {
  orders: any[];
  detailedShopper: any;
  summary?: ShopperDetailSummary | null;
  totalRevenue: number;
  openTickets: number;
  formatCurrency: (amount: string) => string;
  calculateAverageRating: (ratings: any[]) => string;
}

const ShopperStatsOverview: React.FC<ShopperStatsOverviewProps> = ({
  orders,
  detailedShopper,
  summary,
  totalRevenue,
  openTickets,
  formatCurrency,
  calculateAverageRating,
}) => {
  const ratingsCount = summary?.ratings_count ?? detailedShopper?.User?.Ratings?.length ?? 0;
  const ratingsAverage =
    summary?.ratings_average ??
    (ratingsCount > 0
      ? parseFloat(calculateAverageRating(detailedShopper?.User?.Ratings || []))
      : 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">All time orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ratingsAverage.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">{ratingsCount} reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue.toString())}</div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {summary != null && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(String(summary.available_balance))}
                </div>
                <p className="text-xs text-muted-foreground">Current balance</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reserved Balance</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(String(summary.reserved_balance))}
                </div>
                <p className="text-xs text-muted-foreground">Held for active orders</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Withdraw</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(String(summary.pending_withdraw_amount ?? 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.withdraw_requests_count ?? 0} withdraw request(s)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(String(summary.earnings))}</div>
                <p className="text-xs text-muted-foreground">
                  Delivery + service fees from all orders
                </p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue by order type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Regular:</span>
                  <span className="font-medium">
                    {formatCurrency(String(summary.revenue_regular))}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Business:</span>
                  <span className="font-medium">
                    {formatCurrency(String(summary.revenue_business))}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Restaurant:</span>
                  <span className="font-medium">
                    {formatCurrency(String(summary.revenue_restaurant))}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Reel:</span>
                  <span className="font-medium">
                    {formatCurrency(String(summary.revenue_reel))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ShopperStatsOverview;
