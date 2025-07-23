import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Star, DollarSign, MessageSquare } from 'lucide-react';

interface ShopperStatsOverviewProps {
  orders: any[];
  detailedShopper: any;
  totalRevenue: number;
  openTickets: number;
  formatCurrency: (amount: string) => string;
  calculateAverageRating: (ratings: any[]) => string;
}

const ShopperStatsOverview: React.FC<ShopperStatsOverviewProps> = ({
  orders,
  detailedShopper,
  totalRevenue,
  openTickets,
  formatCurrency,
  calculateAverageRating,
}) => {
  return (
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
          <div className="text-2xl font-bold">
            {calculateAverageRating(detailedShopper?.User?.Ratings || [])}
          </div>
          <p className="text-xs text-muted-foreground">
            {detailedShopper?.User?.Ratings?.length || 0} reviews
          </p>
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
  );
};

export default ShopperStatsOverview; 