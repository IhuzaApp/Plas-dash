import React from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { useSystemConfig } from '@/hooks/useHasuraApi';
import { useDashboardData } from '@/hooks/useDashboardData';

const FinancialOverview = () => {
  const { data: systemConfig } = useSystemConfig();
  const {
    totalRevenue,
    monthlyRevenue,
    totalOrders,
    monthlyOrders,
    orderBreakdown,
    monthlyOrderBreakdown,
    isLoading,
  } = useDashboardData();

  const totalSales = totalOrders;
  const averageSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  const formatCurrency = (amount: number) => {
    const currency = systemConfig?.System_configuratioins?.[0]?.currency || 'RWF';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AdminLayout>
      <PageHeader
        title="POS Financial Overview"
        description="Track sales performance and financial metrics"
        icon={<Coins className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue (YTD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '—' : formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time platform revenue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders (all types)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '—' : totalSales.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Regular + Reel + Restaurant + Business
            </p>
            {orderBreakdown && (
              <p className="text-xs text-muted-foreground mt-1">
                Regular: {orderBreakdown.regular} · Reel: {orderBreakdown.reel} · Restaurant:{' '}
                {orderBreakdown.restaurant} · Business: {orderBreakdown.business}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '—' : formatCurrency(averageSaleValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              This month: {monthlyOrders.toLocaleString()} orders,{' '}
              {formatCurrency(monthlyRevenue)} revenue
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monthly">
        <TabsList>
          <TabsTrigger value="monthly">Monthly Overview</TabsTrigger>
          <TabsTrigger value="category">Category Analysis</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
        </TabsList>
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Current Month Overview ({format(new Date(), 'MMMM yyyy')})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Average Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>{format(new Date(), 'MMMM yyyy')}</TableCell>
                      <TableCell className="text-right">
                        {isLoading ? '—' : formatCurrency(monthlyRevenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {isLoading ? '—' : monthlyOrders.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {isLoading || monthlyOrders === 0
                          ? '—'
                          : formatCurrency(monthlyRevenue / monthlyOrders)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              {monthlyOrderBreakdown && (
                <p className="text-xs text-muted-foreground mt-2">
                  This month: Regular {monthlyOrderBreakdown.regular} · Reel{' '}
                  {monthlyOrderBreakdown.reel} · Restaurant {monthlyOrderBreakdown.restaurant} ·
                  Business {monthlyOrderBreakdown.business}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="category">
          <Card>
            <CardHeader>
              <CardTitle>Sales by Product Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-12 text-muted-foreground">
                Category analysis chart will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-12 text-muted-foreground">
                Payment method distribution chart will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default FinancialOverview;
