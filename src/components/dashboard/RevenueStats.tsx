import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface RevenueStatsProps {
  isLoadingRevenue: boolean;
  isLoadingRefunds: boolean;
  totalRevenue: number;
  filteredRevenueTotal: number;
  pendingPayouts: number;
  revenueByType: Record<string, number>;
  revenueFilter: 'month' | 'week' | 'year';
  setRevenueFilter: (v: 'month' | 'week' | 'year') => void;
  formatCurrency: (amount: string) => string;
}

const RevenueStats: React.FC<RevenueStatsProps> = ({
  isLoadingRevenue,
  isLoadingRefunds,
  totalRevenue,
  filteredRevenueTotal,
  pendingPayouts,
  revenueByType,
  revenueFilter,
  setRevenueFilter,
  formatCurrency,
}) => (
  <>
    <div className="mb-4 flex gap-4 items-center">
      <span className="font-medium">Filter Revenue By:</span>
      <Select value={revenueFilter} onValueChange={v => setRevenueFilter(v as 'month' | 'week' | 'year')}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="month">This Month</SelectItem>
          <SelectItem value="week">This Week</SelectItem>
          <SelectItem value="year">This Year</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm font-medium text-muted-foreground">Total Balance</div>
          <div className="text-3xl font-bold">
            {isLoadingRevenue ? 'Loading...' : formatCurrency(totalRevenue.toString())}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm font-medium text-muted-foreground">Filtered Revenue</div>
          <div className="text-3xl font-bold">
            {isLoadingRevenue ? 'Loading...' : formatCurrency(filteredRevenueTotal.toString())}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm font-medium text-muted-foreground">Pending Payouts</div>
          <div className="text-3xl font-bold">
            {isLoadingRefunds ? 'Loading...' : formatCurrency(pendingPayouts.toString())}
          </div>
        </CardContent>
      </Card>
      {Object.keys(revenueByType).map(type => (
        <Card key={type}>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">{type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Revenue</div>
            <div className="text-3xl font-bold">
              {isLoadingRevenue ? 'Loading...' : formatCurrency(revenueByType[type].toString())}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </>
);

export default RevenueStats; 