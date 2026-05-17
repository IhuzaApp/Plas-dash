import React, { useEffect, useState, useMemo } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Store, ShoppingBag, Users, AlertTriangle, Zap, Loader2, DollarSign, Star, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useShopSession } from '@/contexts/ShopSessionContext';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const ShopDashboard = () => {
  const { shopSession } = useShopSession();
  const [loading, setLoading] = useState(true);
  const [shopData, setShopData] = useState<any>(null);
  const [staffData, setStaffData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!shopSession?.shopId) return;

      setLoading(true);
      setError(null);
      try {
        const response = await apiGet<any>(`/api/queries/shops/${shopSession.shopId}`);
        const shop = response.shop;

        setShopData(shop);
        setStaffData(shop?.orgEmployees || []);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shopSession?.shopId]);

  const { metrics, chartsData } = useMemo(() => {
    if (!shopData) return { metrics: null, chartsData: null };

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7);
    const currentYearStr = todayStr.substring(0, 4);

    let ordersToday = 0;
    let ordersMonth = 0;
    let ordersYear = 0;

    let salesToday = 0;
    let salesMonth = 0;
    let salesYear = 0;

    let totalRating = 0;
    let ratingCount = 0;

    const productSalesThisMonth: Record<string, { name: string; quantity: number }> = {};

    const salesByMonth: Record<string, number> = {};
    const ordersByDay: Record<string, number> = {};
    const ordersAndCustomersByMonth: Record<string, { orders: number; customers: Set<string> }> = {};

    (shopData.Orders || []).forEach((order: any) => {
      const orderDate = order.created_at.split('T')[0];
      const orderMonth = orderDate.substring(0, 7);
      const orderYear = orderDate.substring(0, 4);
      const total = order.total || 0;

      // basic stats
      if (orderDate === todayStr) {
        ordersToday++;
        salesToday += total;
      }
      if (orderMonth === currentMonthStr) {
        ordersMonth++;
        salesMonth += total;

        order.Order_Items?.forEach((item: any) => {
          const prodId = item.product_id || item.Product?.id || 'unknown';
          const prodName = item.Product?.ProductName?.name || 'Unknown Product';
          if (!productSalesThisMonth[prodId]) {
            productSalesThisMonth[prodId] = { name: prodName, quantity: 0 };
          }
          productSalesThisMonth[prodId].quantity += item.quantity || 1;
        });
      }
      if (orderYear === currentYearStr) {
        ordersYear++;
        salesYear += total;
      }

      // Ratings
      if (order.Ratings && order.Ratings.length > 0) {
        order.Ratings.forEach((r: any) => {
          if (r.rating) {
            totalRating += r.rating;
            ratingCount++;
          }
        });
      }

      // Charts data
      salesByMonth[orderMonth] = (salesByMonth[orderMonth] || 0) + total;
      
      ordersByDay[orderDate] = (ordersByDay[orderDate] || 0) + 1;

      const customerId = order.user_id || order.orderedBy?.id || 'guest';
      
      if (!ordersAndCustomersByMonth[orderMonth]) {
        ordersAndCustomersByMonth[orderMonth] = { orders: 0, customers: new Set() };
      }
      ordersAndCustomersByMonth[orderMonth].orders++;
      ordersAndCustomersByMonth[orderMonth].customers.add(customerId);
    });

    const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 'N/A';

    let topProduct = { name: 'None', quantity: 0 };
    Object.values(productSalesThisMonth).forEach(p => {
      if (p.quantity > topProduct.quantity) {
        topProduct = p;
      }
    });

    // Format chart data
    const sortedMonths = Object.keys(salesByMonth).sort();
    const salesTrend = sortedMonths.map(month => ({
      name: month,
      sales: salesByMonth[month]
    }));

    const sortedDays = Object.keys(ordersByDay).sort().slice(-30);
    const orderTrendDaily = sortedDays.map(day => ({
      name: day.substring(5), // MM-DD
      orders: ordersByDay[day]
    }));

    const ordersVsCustomers = Object.keys(ordersAndCustomersByMonth).sort().slice(-12).map(month => ({
      name: month,
      orders: ordersAndCustomersByMonth[month].orders,
      customers: ordersAndCustomersByMonth[month].customers.size
    }));

    const lowStockItems = (shopData.Products || []).filter(
      (product: any) => product.quantity <= (product.reorder_point || 0)
    );

    return {
      metrics: {
        ordersToday, ordersMonth, ordersYear,
        salesToday, salesMonth, salesYear,
        avgRating, ratingCount,
        topProduct,
        lowStockItems: lowStockItems.slice(0, 5)
      },
      chartsData: {
        salesTrend,
        orderTrendDaily,
        ordersVsCustomers
      }
    };
  }, [shopData]);

  const inventorySummary = useMemo(() => {
    if (!shopData?.Products) return [];

    // Group products by category and calculate average stock %
    const categories: Record<string, { total: number; count: number }> = {};

    shopData.Products.forEach((p: any) => {
      const catName = p.category || 'Uncategorized';
      if (!categories[catName]) {
        categories[catName] = { total: 0, count: 0 };
      }

      // Calculate capacity percentage (assuming 100 is target if no max capacity specified)
      // Since we don't have 'max_capacity', lets use reorder_point * 5 as a pseudo-target
      // or just quantity compared to some arbitrary high value or simple ratio.
      // For now, let's use quantity relative to 100 or reorder point.
      const target = (p.reorder_point || 10) * 4;
      const percentage = Math.min(Math.round((p.quantity / target) * 100), 100);

      categories[catName].total += percentage;
      categories[catName].count += 1;
    });

    return Object.entries(categories)
      .map(([name, data]) => ({
        name,
        percentage: Math.round(data.total / data.count),
      }))
      .sort((a, b) => a.percentage - b.percentage); // Sort by lowest stock first
  }, [shopData]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-8 text-center border-2 border-dashed rounded-lg border-destructive/20 bg-destructive/5">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title={`${shopData?.name || 'Shop'} Dashboard`}
        description="Monitor your store's performance and operations"
        icon={<Store className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Sales Revenue
              <DollarSign className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics?.salesToday || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Today</p>
            <div className="flex justify-between text-xs mt-3 pt-3 border-t text-muted-foreground">
              <span>Mo: {formatCurrency(metrics?.salesMonth || 0)}</span>
              <span>Yr: {formatCurrency(metrics?.salesYear || 0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Orders
              <ShoppingBag className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.ordersToday || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Today</p>
            <div className="flex justify-between text-xs mt-3 pt-3 border-t text-muted-foreground">
              <span>Mo: {metrics?.ordersMonth || 0}</span>
              <span>Yr: {metrics?.ordersYear || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Average Rating
              <Star className="h-4 w-4 text-yellow-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgRating || 'N/A'}</div>
            <p className="text-xs text-muted-foreground mt-1">From {metrics?.ratingCount || 0} reviews</p>
            <div className="h-2 mt-3 pt-3 border-t w-full"></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Top Product (Month)
              <Package className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate" title={metrics?.topProduct?.name || 'N/A'}>
              {metrics?.topProduct?.name || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{metrics?.topProduct?.quantity || 0} units sold</p>
            <div className="h-2 mt-3 pt-3 border-t w-full"></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales Trend (POS & Orders)</CardTitle>
            <CardDescription>Monthly sales revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartsData?.salesTrend || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(val) => `$${val}`} />
                  <RechartsTooltip formatter={(val) => formatCurrency(val as number)} />
                  <Area type="monotone" dataKey="sales" name="Sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders vs Customers</CardTitle>
            <CardDescription>Monthly comparison of total orders vs unique customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartsData?.ordersVsCustomers || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="orders" name="Total Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="customers" name="Unique Customers" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Order Trend</CardTitle>
            <CardDescription>Number of orders over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartsData?.orderTrendDaily || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="orders" name="Orders" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Items Requiring Attention</CardTitle>
            <CardDescription>Products with low stock levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics?.lowStockItems && metrics.lowStockItems.length > 0 ? (
                metrics.lowStockItems.map((product: any) => (
                  <div
                    key={product.id}
                    className={`flex items-center justify-between p-2 rounded-md ${product.quantity === 0 ? 'bg-red-50' : 'bg-yellow-50'}`}
                  >
                    <div className="flex items-center space-x-2">
                      <AlertTriangle
                        className={`h-5 w-5 ${product.quantity === 0 ? 'text-red-500' : 'text-yellow-500'}`}
                      />
                      <span>
                        {product.ProductName?.name} -{' '}
                        {product.quantity === 0
                          ? 'Out of Stock'
                          : `Low Stock (${product.quantity} ${product.measurement_unit || 'left'})`}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground bg-green-50 rounded-lg">
                  <Zap className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  All stock levels are healthy
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
            <CardDescription>Current stock levels by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inventorySummary.length > 0 ? (
                inventorySummary.map(item => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span>{item.name}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          item.percentage < 30
                            ? 'bg-red-50'
                            : item.percentage < 60
                              ? 'bg-yellow-50'
                              : ''
                        }
                      >
                        {item.percentage}%
                      </Badge>
                    </div>
                    <Progress
                      value={item.percentage}
                      className={`h-2 ${item.percentage < 30 ? 'bg-red-100' : item.percentage < 60 ? 'bg-yellow-100' : 'bg-secondary'}`}
                    />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No inventory data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ShopDashboard;
