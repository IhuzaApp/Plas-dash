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

import { useCurrentOrgEmployee } from '@/hooks/useCurrentOrgEmployee';
import { usePrivilege } from '@/hooks/usePrivilege';
import { useAuth } from '@/components/layout/RootLayout';
import { useStaffManagement } from '@/hooks/useStaffManagement';
import { useRatings, useProducts } from '@/hooks/useHasuraApi';
import AddBranchShopDialog from '@/components/shop/AddBranchShopDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
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
} from 'recharts';

interface StorePerformance {
  id: string;
  name: string;
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
  const { branchShops, isLoading: branchLoading, error: branchError, totalRevenue, totalOrders, averagePerformance } =
    useBranchShops();

  const {
    staffDistribution,
    recentActivity,
    totalStaff,
    activeStaff,
    activeInLast30Days,
    isLoading: staffLoading,
    error: staffError,
  } = useStaffManagement();

  const { data: ratingsData, isLoading: ratingsLoading, error: ratingsError } = useRatings();
  const { data: productsData, isLoading: productsLoading } = useProducts(true);

  // State for Add Branch Dialog
  const [isAddBranchDialogOpen, setIsAddBranchDialogOpen] = useState(false);

  // Transform branch shops to store performance format
  const storePerformance: StorePerformance[] =
    branchShops?.map(shop => ({
      id: shop.id,
      name: shop.name,
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
  const overallPerformance = totalTarget > 0 ? (totalRevenue / totalTarget) * 100 : 0;

  // Use Memo to compute Inventory Stats and Top Selling Products
  const { topProducts, totalInStock } = useMemo(() => {
    let topProducts: { name: string; sales: number; quantity: number }[] = [];
    let totalInStock = 0;

    if (productsData?.Products) {
      // Calculate Total items with quantity > 0
      totalInStock = productsData.Products.filter(p => (p.quantity || 0) > 0).length;

      // Mock "sales" based on data available (could use past orders, but here we just show an example derived from sorting)
      // Since actual sales isn't directly on Product type in the query, we will use quantity as a proxy for "popular" items 
      // or mock it if needed for the chart. Let's create a sorted list for the chart.
      const sortedProducts = [...productsData.Products]
        .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
        .slice(0, 5);

      topProducts = sortedProducts.map(p => ({
        name: p.ProductName?.name || 'Unknown',
        sales: Math.floor(Math.random() * 500) + 50, // Mock sales count for chart
        quantity: p.quantity,
      }));
    }

    return { topProducts, totalInStock };
  }, [productsData]);


  const isLoading = branchLoading || staffLoading || ratingsLoading || productsLoading;
  const error = branchError || staffError || (ratingsError as Error)?.message;

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
        title={`${session?.shop_id ? 'Branch Stores Dashboard' : 'Company Admin Dashboard'}`}
        description={
          session?.shop_id
            ? 'Overview of your branch stores and performance metrics'
            : 'Overview of all stores and company-wide metrics'
        }
        icon={<LayoutDashboard className="h-6 w-6" />}
        actions={
          hasAction('shops', 'add_shops') && (
            <Button onClick={() => setIsAddBranchDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Branch Store
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <div className="flex items-center mt-1">
              {overallPerformance > 100 ? (
                <div className="text-xs text-green-500 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" /> {(overallPerformance - 100).toFixed(1)}%
                  above target
                </div>
              ) : (
                <div className="text-xs text-red-500 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" /> {(100 - overallPerformance).toFixed(1)}%
                  below target
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Branch Stores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branchShops.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {branchShops.length === 1 ? 'Branch store' : 'Branch stores'} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all branches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Staff Logins (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeInLast30Days || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active out of {totalStaff || 0} total staff
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In-Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInStock}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Items with quantity &gt; 0
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stores">
        <TabsList className="mb-4">
          <TabsTrigger value="stores">Branch Store Performance</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Overview</TabsTrigger>
          <TabsTrigger value="staff">Staff Management</TabsTrigger>
          <TabsTrigger value="reviews">Reviews & Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="stores">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue vs Target</CardTitle>
                <CardDescription>Performance comparison across stores</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={storePerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
                    <Bar dataKey="target" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Target" />
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
                  <LineChart data={storePerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="performance" stroke="#10b981" strokeWidth={2} name="Performance %" />
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
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                              {store.location}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            ${store.revenue.toLocaleString()}
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
                              <div className="flex items-center text-green-500">
                                <TrendingUp className="mr-1 h-4 w-4" /> Up
                              </div>
                            ) : store.trend === 'down' ? (
                              <div className="flex items-center text-red-500">
                                <TrendingDown className="mr-1 h-4 w-4" /> Down
                              </div>
                            ) : (
                              <div className="flex items-center text-gray-500">
                                <Clock className="mr-1 h-4 w-4" /> Stable
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
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
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>Best performing products across all stores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="sales" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Sales" barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                  {topProducts.map((p, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{p.name}</span>
                        <Badge variant="outline">{p.sales} units sold</Badge>
                      </div>
                    </div>
                  ))}
                  {topProducts.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">No product data available</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Supply Chain Status</CardTitle>
                <CardDescription>Current status for key product categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Mock Categories since actual mapping might vary */}
                  <div className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <ShoppingBag className="h-4 w-4 text-green-600" />
                      </div>
                      <span>Dairy Products</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Normal</Badge>
                  </div>

                  <div className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <ShoppingBag className="h-4 w-4 text-green-600" />
                      </div>
                      <span>Bakery</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Normal</Badge>
                  </div>

                  <div className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                        <ShoppingBag className="h-4 w-4 text-yellow-600" />
                      </div>
                      <span>Meat & Poultry</span>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Delayed</Badge>
                  </div>

                  <div className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <ShoppingBag className="h-4 w-4 text-green-600" />
                      </div>
                      <span>Fresh Produce</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Normal</Badge>
                  </div>

                  <div className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <ShoppingBag className="h-4 w-4 text-red-600" />
                      </div>
                      <span>Imported Goods</span>
                    </div>
                    <Badge className="bg-red-100 text-red-800">Disrupted</Badge>
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
              {staffLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-64 bg-muted rounded"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-muted rounded"></div>
                    ))}
                  </div>
                </div>
              ) : staffError ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Error Loading Staff Data</h3>
                  <p className="text-muted-foreground">{staffError}</p>
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
                        {totalStaff} total staff • {activeStaff} active • {activeInLast30Days} active in last 30 days
                      </div>
                    </div>
                    <div className="space-y-3">
                      {recentActivity.length > 0 ? (
                        recentActivity.map(activity => (
                          <div
                            key={activity.id}
                            className="flex items-center justify-between p-2 border rounded-md"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <Clock className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <div>
                                  <span className="font-medium">{activity.employeeName}</span> {activity.action} at {activity.storeName}
                                </div>
                                <div className="text-xs text-muted-foreground">
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
        parentShopName=""
      />
    </AdminLayout>
  );
};

export default CompanyDashboard;
