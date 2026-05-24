import React, { useState, useMemo } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Store,
  ShoppingBag,
  Users,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  PackageSearch,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBranchShops } from '@/hooks/useBranchShops';
import { useSystemConfig } from '@/hooks/useSystemConfig';

import { useCurrentOrgEmployee } from '@/hooks/useCurrentOrgEmployee';
import { usePrivilege } from '@/hooks/usePrivilege';
import { useAuth } from '@/contexts/AuthContext';
import AddBranchShopDialog from '@/components/shop/AddBranchShopDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useShopSubscriptionModules } from '@/hooks/useShopSubscriptionModules';
import { RatingCard } from './RatingCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useThemeColor } from '@/components/providers/ThemeColorProvider';

interface StorePerformance {
  id: string;
  name: string;
  categoryName?: string;
  location: string;
  revenue: number;
  target: number;
  performance: number;
  trend: 'up' | 'down' | 'neutral';
  address: string;
  phone: string;
  totalOrders: number;
  averageRating: number;
}

const CompanyDashboard = () => {
  const { orgEmployee } = useCurrentOrgEmployee();
  const { hasAction } = usePrivilege();
  const { session } = useAuth();
  const { color } = useThemeColor();
  const { data: systemConfig } = useSystemConfig();
  const currency = systemConfig?.currency || 'RWF';
  const {
    branchShops,
    isLoading: branchLoading,
    error: branchError,
    totalRevenue,
    monthlyRevenue,
    totalOrders,
    monthlyOrders,
    todaySalesTotal,
    averagePerformance,
  } = useBranchShops();

  const { plan } = useShopSubscriptionModules(session?.shop_id, session?.restaurant_id);
  const allowedBranches = plan?.num_of_branch || 0;
  const currentBranchCount = branchShops.length > 0 ? branchShops.length - 1 : 0;

  // State for Add Branch Dialog
  const [isAddBranchDialogOpen, setIsAddBranchDialogOpen] = useState(false);
  const [salesTimeframe, setSalesTimeframe] = useState<'year' | 'month' | 'week' | 'day'>('month');

  const getWeekString = (dateStr: string) => {
    const d = new Date(dateStr);
    const startDate = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startDate.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
  };

  const salesTrendData = useMemo(() => {
    const timeframesMap: Record<string, Record<string, number>> = {};

    (branchShops || []).forEach((shop, index) => {
      const displayName = shop.name || `Store ${index + 1}`;
      const orders = shop.Orders || [];

      orders.forEach((order: any) => {
        if (session?.restaurant_id) {
          if (order.status === 'pending' || order.status === 'PENDING') return;
        } else {
          if (
            order.status === 'accepted' ||
            order.status === 'shopping' ||
            order.status === 'pending' ||
            order.status === 'PENDING'
          )
            return;
        }

        const dateStr = order.created_at || order.created_on;
        if (!dateStr) return;
        const itemDate = dateStr.split('T')[0];
        const itemMonth = itemDate.substring(0, 7);
        const itemYear = itemDate.substring(0, 4);
        const total = parseFloat(order.total) || 0;

        let timeKey = itemMonth;
        if (salesTimeframe === 'year') timeKey = itemYear;
        else if (salesTimeframe === 'day') timeKey = itemDate;
        else if (salesTimeframe === 'week') timeKey = getWeekString(itemDate);

        if (!timeframesMap[timeKey]) {
          timeframesMap[timeKey] = {};
        }

        timeframesMap[timeKey][displayName] = (timeframesMap[timeKey][displayName] || 0) + total;
      });
    });

    return Object.keys(timeframesMap)
      .sort()
      .map(tf => {
        const entry: any = { name: tf };
        (branchShops || []).forEach((shop, index) => {
          const displayName = shop.name || `Store ${index + 1}`;
          entry[displayName] = timeframesMap[tf][displayName] || 0;
        });
        return entry;
      });
  }, [branchShops, salesTimeframe, session?.restaurant_id]);

  const chartColors = useMemo(
    () => [
      color.primary,
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
      '#ec4899',
      '#8b5cf6',
      '#3b82f6',
      '#10b981',
    ],
    [color.primary]
  );

  // Transform branch shops to store performance format
  const storePerformance: StorePerformance[] =
    branchShops?.map(shop => ({
      id: shop.id,
      name: shop.name,
      categoryName: shop.categoryName,
      location: shop.address,
      revenue: shop.totalRevenue || 0,
      target: 50000, // Mock target for now
      performance: shop.performance || 0,
      trend: shop.trend || 'neutral',
      address: shop.address,
      phone: shop.phone,
      totalOrders: shop.totalOrders || 0,
      averageRating: shop.averageRating || 0,
    })) || [];

  const totalTarget = storePerformance.reduce((sum, store) => sum + store.target, 0);
  const overallPerformance = totalTarget > 0 ? (monthlyRevenue / totalTarget) * 100 : 0;

  // Use Memo to compute Inventory Stats, Top Selling Products, and Branch Inventory Distribution
  const { topProducts, totalInStock, branchInventoryStats } = useMemo(() => {
    let topProducts: { name: string; sales: number; quantity: number; storeName: string }[] = [];
    let totalInStock = 0;

    const allProducts = branchShops.flatMap(shop =>
      (shop.Products || []).map(p => ({ ...p, shopName: shop.name, shopId: shop.id }))
    );

    // Calculate Total items with quantity > 0 across all branches
    totalInStock = allProducts.filter(p => (p.quantity || 0) > 0).length;

    // 1. Calculate Top Selling Products based on actual order items across branches
    const productSalesMap = new Map<
      string,
      { name: string; sales: number; quantity: number; storeName: string }
    >();

    // First populate map with available products to get their current stock and store attribution
    allProducts.forEach(p => {
      const name = p.ProductName?.name || 'Unknown';
      const key = `${p.shopId}-${name}`;
      if (!productSalesMap.has(key)) {
        productSalesMap.set(key, {
          name,
          sales: 0,
          quantity: p.quantity || 0,
          storeName: p.shopName || 'Main Location',
        });
      }
    });

    // Then aggregate actual sales from orders
    branchShops.forEach(shop => {
      const storeName = shop.name || 'Main Location';
      const shopId = shop.id;
      (shop.Orders || []).forEach((order: any) => {
        if (session?.restaurant_id) {
          if (order.status === 'pending' || order.status === 'PENDING') return;
        } else {
          if (
            order.status === 'accepted' ||
            order.status === 'shopping' ||
            order.status === 'pending' ||
            order.status === 'PENDING'
          )
            return;
        }

        (order.Order_Items || []).forEach((item: any) => {
          const name = item.Product?.ProductName?.name || 'Unknown';
          const qty = parseInt(item.quantity) || 0;
          const key = `${shopId}-${name}`;

          if (productSalesMap.has(key)) {
            productSalesMap.get(key)!.sales += qty;
          } else {
            productSalesMap.set(key, {
              name,
              sales: qty,
              quantity: 0,
              storeName,
            });
          }
        });
      });
    });

    // Filter out products/dishes with 0 sales unless there are no sales at all across the business
    let activeProducts = Array.from(productSalesMap.values());
    const hasAnySales = activeProducts.some(p => p.sales > 0);
    if (hasAnySales) {
      activeProducts = activeProducts.filter(p => p.sales > 0);
    }

    // Sort by actual sales, fallback to quantity if no sales yet
    const sortedProducts = activeProducts
      .sort((a, b) => {
        if (b.sales !== a.sales) return b.sales - a.sales;
        return b.quantity - a.quantity;
      })
      .slice(0, 6);

    topProducts = sortedProducts;

    // 2. Calculate Branch Inventory Health & Distribution Stats
    const branchInventoryStats = branchShops.map(shop => {
      const products = shop.Products || [];
      const totalItems = products.length;
      const isRest =
        session?.restaurant_id || shop.categoryName?.toLowerCase().includes('restaurant');

      let inStock = 0;
      let lowStock = 0;
      let outOfStock = 0;
      let totalVolume = 0;

      if (isRest) {
        // For restaurants, evaluate dish availability using is_active and quantity
        inStock = products.filter(
          p =>
            p.is_active !== false &&
            (p.quantity === undefined || p.quantity === null || p.quantity > 5)
        ).length;
        lowStock = products.filter(
          p =>
            p.is_active !== false &&
            p.quantity !== undefined &&
            p.quantity !== null &&
            p.quantity > 0 &&
            p.quantity <= 5
        ).length;
        outOfStock = products.filter(p => p.is_active === false || p.quantity === 0).length;
        totalVolume = products.reduce((sum, p) => sum + (p.quantity || 1), 0);
      } else {
        // For supermarkets/shops, evaluate using stock quantity
        inStock = products.filter(p => (p.quantity || 0) > 10).length;
        lowStock = products.filter(p => (p.quantity || 0) > 0 && (p.quantity || 0) <= 10).length;
        outOfStock = products.filter(p => (p.quantity || 0) === 0).length;
        totalVolume = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
      }

      return {
        name: shop.name || 'Main Location',
        categoryName: shop.categoryName || (session?.restaurant_id ? 'Restaurant' : 'Supermarket'),
        totalItems,
        inStock,
        lowStock,
        outOfStock,
        totalVolume,
      };
    });

    return { topProducts, totalInStock, branchInventoryStats };
  }, [branchShops, session?.restaurant_id]);

  // Use Memo to compute Staff Stats
  const { staffDistribution, recentActivity, totalStaff, activeStaff, activeInLast30Days } =
    useMemo(() => {
      const allStaff = branchShops.flatMap(shop =>
        (shop.orgEmployees || []).map(emp => ({ ...emp, shopName: shop.name, shopId: shop.id }))
      );
      const totalStaff = allStaff.length;
      const activeStaff = allStaff.filter(s => s.active !== false).length;

      const distributionMap = new Map<string, any>();

      // Pre-populate with all main and branch shops so every location appears in the table
      (branchShops || []).forEach(shop => {
        if (shop.id) {
          distributionMap.set(shop.id, {
            storeName: shop.name || 'Unknown Store',
            storeId: shop.id,
            manager: 0,
            cashier: 0,
            stockClerk: 0,
            other: 0,
            total: 0,
          });
        }
      });

      allStaff.forEach(member => {
        const storeName = member.Shops?.name || member.shopName || 'Unknown Store';
        const storeId = member.Shops?.id || member.shopId || 'unknown';

        if (!distributionMap.has(storeId)) {
          distributionMap.set(storeId, {
            storeName,
            storeId,
            manager: 0,
            cashier: 0,
            stockClerk: 0,
            other: 0,
            total: 0,
          });
        }

        const store = distributionMap.get(storeId)!;
        store.total++;

        const position = (member.Position || member.roleType || '').toLowerCase();
        if (position.includes('manager') || position.includes('supervisor')) {
          store.manager++;
        } else if (position.includes('cashier') || position.includes('cash')) {
          store.cashier++;
        } else if (
          position.includes('stock') ||
          position.includes('inventory') ||
          position.includes('clerk')
        ) {
          store.stockClerk++;
        } else {
          store.other++;
        }
      });
      const staffDistribution = Array.from(distributionMap.values());

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const activeInLast30Days = allStaff.filter(member => {
        if (!member.last_login) return false;
        return new Date(member.last_login) >= thirtyDaysAgo;
      }).length;

      const recentStaff = allStaff.filter(member => {
        if (!member.last_login) return false;
        return new Date(member.last_login) >= twentyFourHoursAgo;
      });

      const activity = recentStaff.map(member => {
        const lastLogin = new Date(member.last_login);
        const timeDiff = now.getTime() - lastLogin.getTime();
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutesAgo = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        let timeAgo = hoursAgo > 0 ? `${hoursAgo}h ${minutesAgo}m ago` : `${minutesAgo}m ago`;

        return {
          id: member.id,
          employeeName: member.fullnames,
          storeName: member.Shops?.name || member.shopName || 'Unknown Store',
          action: 'Logged in',
          timestamp: member.last_login,
          timeAgo,
        };
      });

      activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const recentActivity = activity.slice(0, 10);

      return { staffDistribution, recentActivity, totalStaff, activeStaff, activeInLast30Days };
    }, [branchShops]);

  // Use Memo to compute aggregated Ratings
  const ratingsData = useMemo(() => {
    const allRatings: any[] = [];
    branchShops.forEach(shop => {
      shop.Orders?.forEach((order: any) => {
        if (order.Ratings && order.Ratings.length > 0) {
          order.Ratings.forEach((rating: any) => {
            allRatings.push({
              ...rating,
              Order: {
                OrderID: order.OrderID,
                delivery_fee: order.delivery_fee,
                discount: order.discount,
                delivery_notes: order.delivery_notes,
                Shop: {
                  name: shop.name,
                  address: shop.address,
                  categoryName: shop.categoryName,
                },
              },
            });
          });
        }
      });
    });

    allRatings.sort(
      (a, b) =>
        new Date(b.reviewed_at || b.created_at || 0).getTime() -
        new Date(a.reviewed_at || a.created_at || 0).getTime()
    );
    return { Ratings: allRatings };
  }, [branchShops]);

  const isLoading = branchLoading;
  const error = branchError;

  // Show loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <PageHeader
          title="Company Admin Dashboard"
          description="Overview of all stores and company-wide metrics"
          icon={<LayoutDashboard className="h-6 w-6" />}
        />
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <AdminLayout>
        <PageHeader
          title="Company Admin Dashboard"
          description="Overview of all stores and company-wide metrics"
          icon={<LayoutDashboard className="h-6 w-6" />}
        />
        <div className="p-6">
          <div className="text-center">
            <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Error Loading Dashboard</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title={`${session?.shop_id || session?.restaurant_id ? (session?.restaurant_id ? 'Branch Restaurants Dashboard' : 'Branch Stores Dashboard') : 'Company Admin Dashboard'}`}
        description={
          session?.shop_id || session?.restaurant_id
            ? `Overview of your branch ${session?.restaurant_id ? 'restaurants' : 'stores'} and performance metrics`
            : 'Overview of all stores and company-wide metrics'
        }
        icon={<LayoutDashboard className="h-6 w-6" />}
        actions={
          hasAction('shops', 'add_shops') &&
          allowedBranches > 0 && (
            <Button
              onClick={() => {
                if (currentBranchCount >= allowedBranches) {
                  toast.error('Branch Limit Reached', {
                    description: `Your subscription plan allows a maximum of ${allowedBranches} branch ${session?.restaurant_id ? 'restaurants' : 'stores'}. Please upgrade your plan to add more.`,
                  });
                  return;
                }
                setIsAddBranchDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Branch {session?.restaurant_id ? 'Restaurant' : 'Store'}
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground truncate">
              Total Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currency} {monthlyRevenue.toLocaleString()}
            </div>
            <div className="flex items-center mt-1 truncate">
              {overallPerformance > 100 ? (
                <div className="text-xs text-green-500 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 flex-shrink-0" />{' '}
                  {(overallPerformance - 100).toFixed(1)}% above target
                </div>
              ) : (
                <div className="text-xs text-red-500 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1 flex-shrink-0" />{' '}
                  {(100 - overallPerformance).toFixed(1)}% below target
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground truncate">
              Branch {session?.restaurant_id ? 'Restaurants' : 'Stores'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.max(0, branchShops.length - 1)}</div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {Math.max(0, branchShops.length - 1)} active branches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground truncate">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1 truncate">Across all locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground truncate">
              Staff Logins (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeInLast30Days || 0}</div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Active out of {totalStaff || 0} total staff
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Today's Sales per Shop / Branch */}
      <h3 className="text-lg font-medium mb-3">Today&apos;s Sales per Location</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {branchShops.map((shop, index) => (
          <Card key={shop.id || index}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle
                  className="text-sm font-medium text-muted-foreground truncate"
                  title={shop.name}
                >
                  {shop.name} {index === 0 ? '(Main Location)' : '(Branch)'}
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 font-normal">
                  {shop.categoryName || 'N/A'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currency} {(shop.todaySales || 0).toLocaleString()}
              </div>
              <p
                className="text-xs text-muted-foreground mt-1 truncate"
                title={shop.address || 'Main Location'}
              >
                {shop.address || 'Main Location'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="stores">
        <TabsList className="mb-4">
          <TabsTrigger value="stores">Branch Store Performance</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Overview</TabsTrigger>
          <TabsTrigger value="staff">Staff Management</TabsTrigger>
          <TabsTrigger value="reviews">Reviews & Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="stores">
          {/* Company-Wide Sales Trend Card */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Sales Trend per Location Comparison</CardTitle>
                <CardDescription>
                  Compare sales performance across main location and branches ({salesTimeframe})
                </CardDescription>
              </div>
              <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-lg border">
                {(['year', 'month', 'week', 'day'] as const).map(tf => (
                  <Button
                    key={tf}
                    variant={salesTimeframe === tf ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSalesTimeframe(tf)}
                    className={`text-xs h-7 px-2.5 capitalize ${salesTimeframe === tf ? 'shadow-sm' : ''}`}
                  >
                    {tf}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={salesTrendData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      {branchShops.map((shop, index) => {
                        const c = chartColors[index % chartColors.length];
                        return (
                          <linearGradient
                            key={shop.id || index}
                            id={`gradient-${index}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="5%" stopColor={c} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={c} stopOpacity={0} />
                          </linearGradient>
                        );
                      })}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend verticalAlign="top" height={36} />
                    {branchShops.map((shop, index) => {
                      const displayName = shop.name || `Store ${index + 1}`;
                      const c = chartColors[index % chartColors.length];
                      return (
                        <Area
                          key={shop.id || index}
                          type="monotone"
                          dataKey={displayName}
                          stroke={c}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill={`url(#gradient-${index})`}
                          name={displayName}
                        />
                      );
                    })}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue vs Target</CardTitle>
                <CardDescription>Performance comparison across stores</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={storePerformance}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar
                      dataKey="revenue"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      name="Revenue"
                    />
                    <Bar
                      dataKey="target"
                      fill="hsl(var(--muted-foreground) / 0.3)"
                      radius={[4, 4, 0, 0]}
                      name="Target"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Monthly performance metric %</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={storePerformance}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="performance"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="Performance %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Branch Store List</CardTitle>
              <CardDescription>Detailed metrics for your branch stores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Branch Store</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Rating</TableHead>
                      <TableHead className="text-right">Performance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {storePerformance.length > 0 ? (
                      storePerformance.map(store => (
                        <TableRow key={store.id}>
                          <TableCell>
                            <div className="font-medium">{store.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {store.phone}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {store.categoryName || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                              {store.location}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {currency} {store.revenue.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">{store.totalOrders}</TableCell>
                          <TableCell className="text-right">
                            {store.averageRating > 0 ? (
                              <div className="flex items-center justify-end">
                                <span className="text-sm font-medium">
                                  {store.averageRating.toFixed(1)}
                                </span>
                                <span className="text-xs text-muted-foreground ml-1">/5</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">No ratings</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {store.performance.toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            {store.trend === 'up' ? (
                              <div className="flex items-center text-primary font-medium">
                                <TrendingUp className="mr-1 h-4 w-4" /> Up
                              </div>
                            ) : store.trend === 'down' ? (
                              <div className="flex items-center text-destructive font-medium">
                                <TrendingDown className="mr-1 h-4 w-4" /> Down
                              </div>
                            ) : (
                              <div className="flex items-center text-muted-foreground font-medium">
                                <Clock className="mr-1 h-4 w-4" /> Stable
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          <div className="flex flex-col items-center">
                            <Store className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">No branch stores found</p>
                            <p className="text-sm text-muted-foreground">
                              Branch stores will appear here when they are added to your company.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="flex flex-col shadow-lg border-none bg-background/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Top Selling Products
                </CardTitle>
                <CardDescription>
                  Best performing products across all branch locations
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-start space-y-3">
                <div className="h-48 mb-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topProducts}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="sales"
                        nameKey="name"
                        label={({ name, percent }) =>
                          percent > 0.05
                            ? `${name.length > 14 ? name.substring(0, 14) + '...' : name} (${(percent * 100).toFixed(0)}%)`
                            : ''
                        }
                        labelLine={true}
                      >
                        {topProducts.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={chartColors[index % chartColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border rounded-xl shadow-xl p-3.5 text-sm space-y-1 z-50">
                                <p
                                  className="font-bold text-foreground"
                                  style={{ color: payload[0].payload.fill }}
                                >
                                  {data.name}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-primary" /> {data.storeName}
                                </p>
                                <div className="pt-2 flex items-center gap-2">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: payload[0].payload.fill }}
                                  />
                                  <span className="font-bold text-foreground">
                                    {data.sales} units sold
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Current Stock: {data.quantity} units
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={24}
                        wrapperStyle={{ paddingTop: '0px', fontSize: '11px', fontWeight: 500 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 pt-1.5 border-t">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Product Performance Attribution
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {topProducts.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-xl bg-muted/40 border border-muted-foreground/10 hover:bg-muted/60 transition-colors"
                      >
                        <div className="space-y-0.5 truncate pr-2">
                          <p className="text-xs font-semibold truncate">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Store className="w-3 h-3 text-primary" /> {p.storeName}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary border-none text-xs font-bold px-2 py-0.5"
                        >
                          {p.sales} sold
                        </Badge>
                      </div>
                    ))}
                  </div>
                  {topProducts.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground italic bg-muted/20 rounded-xl border border-dashed">
                      No sales data available yet across branches
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col shadow-lg border-none bg-background/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  Branch Stock Health & Distribution
                </CardTitle>
                <CardDescription>
                  Inventory volume and status breakdown across all branch locations
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-start space-y-3">
                <div className="h-48 mb-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={branchInventoryStats}
                      margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fontWeight: 500 }}
                        angle={0}
                        textAnchor="middle"
                        height={16}
                        tickFormatter={val => {
                          const short = val
                            .replace('Super Fresh Market', 'SFM')
                            .replace('Restaurant', 'Rest.');
                          return short.length > 15 ? short.substring(0, 15) + '...' : short;
                        }}
                      />
                      <YAxis tick={{ fontSize: 11 }} width={40} />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border rounded-xl shadow-xl p-4 text-sm space-y-1.5 z-50">
                                <p className="font-bold text-foreground flex items-center gap-1.5">
                                  <Store className="w-4 h-4 text-primary" /> {data.name}{' '}
                                  <span className="text-xs font-normal text-muted-foreground">
                                    ({data.categoryName})
                                  </span>
                                </p>
                                <div className="space-y-1 pt-1">
                                  <p
                                    className="text-xs font-medium flex items-center justify-between gap-4"
                                    style={{ color: color.primary }}
                                  >
                                    <span>Optimal Stock (&gt;10):</span>{' '}
                                    <span className="font-bold">{data.inStock} items</span>
                                  </p>
                                  <p
                                    className="text-xs font-medium flex items-center justify-between gap-4"
                                    style={{ color: 'hsl(var(--chart-2))' }}
                                  >
                                    <span>Low Stock (≤10):</span>{' '}
                                    <span className="font-bold">{data.lowStock} items</span>
                                  </p>
                                  <p
                                    className="text-xs font-medium flex items-center justify-between gap-4"
                                    style={{ color: 'hsl(var(--chart-4))' }}
                                  >
                                    <span>Out of Stock (0):</span>{' '}
                                    <span className="font-bold">{data.outOfStock} items</span>
                                  </p>
                                </div>
                                <div className="border-t pt-2 mt-2 flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground font-semibold">
                                    Total Stock Volume:
                                  </span>
                                  <span className="text-xs font-bold text-foreground">
                                    {data.totalVolume.toLocaleString()} units
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        height={24}
                        wrapperStyle={{ paddingBottom: '0px', fontSize: '11px', fontWeight: 500 }}
                      />
                      <Bar
                        dataKey="inStock"
                        name="Optimal Stock"
                        fill={color.primary}
                        radius={[8, 8, 0, 0]}
                        barSize={16}
                      />
                      <Bar
                        dataKey="lowStock"
                        name="Low Stock"
                        fill="hsl(var(--chart-2))"
                        radius={[8, 8, 0, 0]}
                        barSize={16}
                      />
                      <Bar
                        dataKey="outOfStock"
                        name="Out of Stock"
                        fill="hsl(var(--chart-4))"
                        radius={[8, 8, 0, 0]}
                        barSize={16}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 pt-1.5 border-t">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Branch Inventory Alerts
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {branchInventoryStats.map((stat, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-xl bg-muted/40 border border-muted-foreground/10 hover:bg-muted/60 transition-colors"
                      >
                        <div className="space-y-0.5 truncate pr-2">
                          <p className="text-xs font-semibold truncate">{stat.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {stat.totalItems} product lines
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {stat.outOfStock > 0 ? (
                            <Badge
                              className="text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm border-none"
                              style={{ backgroundColor: 'hsl(var(--chart-4))', color: '#fff' }}
                            >
                              {stat.outOfStock} Out
                            </Badge>
                          ) : stat.lowStock > 0 ? (
                            <Badge
                              className="text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm border"
                              style={{
                                backgroundColor: 'hsl(var(--chart-2) / 0.15)',
                                color: 'hsl(var(--chart-2))',
                                borderColor: 'hsl(var(--chart-2) / 0.3)',
                              }}
                            >
                              {stat.lowStock} Low
                            </Badge>
                          ) : (
                            <Badge
                              className="text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm border"
                              style={{
                                backgroundColor: 'hsl(var(--primary) / 0.15)',
                                color: color.primary,
                                borderColor: 'hsl(var(--primary) / 0.3)',
                              }}
                            >
                              Optimal
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>Staff Overview</CardTitle>
              <CardDescription>Staff distribution by store and position</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-64 bg-muted rounded"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-muted rounded"></div>
                    ))}
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Error Loading Staff Data</h3>
                  <p className="text-muted-foreground">{error}</p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border mb-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Store</TableHead>
                          <TableHead className="text-right">Manager</TableHead>
                          <TableHead className="text-right">Cashier</TableHead>
                          <TableHead className="text-right">Stock Clerk</TableHead>
                          <TableHead className="text-right">Other</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staffDistribution.length > 0 ? (
                          staffDistribution.map(store => (
                            <TableRow key={store.storeId}>
                              <TableCell className="font-medium">{store.storeName}</TableCell>
                              <TableCell className="text-right">{store.manager}</TableCell>
                              <TableCell className="text-right">{store.cashier}</TableCell>
                              <TableCell className="text-right">{store.stockClerk}</TableCell>
                              <TableCell className="text-right">{store.other}</TableCell>
                              <TableCell className="text-right font-medium">
                                {store.total}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              <div className="flex flex-col items-center">
                                <Users className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">No staff data found</p>
                                <p className="text-sm text-muted-foreground">
                                  Staff data will appear here when employees are added to your
                                  stores.
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Recent Staff Logins (Last 24 Hours)</h3>
                      <div className="text-sm text-muted-foreground">
                        {totalStaff} total staff • {activeStaff} active • {activeInLast30Days}{' '}
                        active in last 30 days
                      </div>
                    </div>
                    <div className="space-y-3">
                      {recentActivity.length > 0 ? (
                        recentActivity.map(activity => (
                          <div
                            key={activity.id}
                            className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 border rounded-xl hover:border-primary/30 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div>
                                  <span className="font-bold">{activity.employeeName}</span>{' '}
                                  <span className="text-muted-foreground">{activity.action}</span>{' '}
                                  at <span className="font-medium">{activity.storeName}</span>
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Clock className="h-3 w-3" />
                                  {activity.timeAgo}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-muted-foreground">No recent logins</p>
                          <p className="text-sm text-muted-foreground">
                            Staff login activity from the last 24 hours will appear here.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Customer Reviews & Feedback</CardTitle>
              <CardDescription>Recent ratings and reviews from customers</CardDescription>
            </CardHeader>
            <CardContent>
              {ratingsData?.Ratings?.length ? (
                <div className="space-y-4">
                  {ratingsData.Ratings.map(rating => (
                    <RatingCard key={rating.id} rating={rating} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Reviews Yet</h3>
                  <p className="text-muted-foreground">
                    Customer ratings and reviews will appear here once they are submitted.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Branch Store Dialog */}
      <AddBranchShopDialog
        isOpen={isAddBranchDialogOpen}
        onClose={() => setIsAddBranchDialogOpen(false)}
        parentShopName={
          session?.restaurant_name || session?.shop_name || branchShops[0]?.name || ''
        }
        isRestaurant={!!session?.restaurant_id}
      />
    </AdminLayout>
  );
};

export default CompanyDashboard;
