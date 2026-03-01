import React, { useEffect, useState, useMemo } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Store, ShoppingBag, Users, AlertTriangle, Zap, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useShopSession } from '@/contexts/ShopSessionContext';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

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

  const metrics = useMemo(() => {
    if (!shopData) return null;

    const today = new Date().toISOString().split('T')[0];
    const todayOrders = (shopData.Orders || []).filter((order: any) =>
      order.created_at.startsWith(today)
    );

    const dailySales = todayOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
    const itemsSoldToday = todayOrders.length; // Counting orders as items for now, or sum items if needed

    // For more accurate items sold today, sum up quantities in Order_Items
    const totalItemsSoldToday = todayOrders.reduce((sum: number, order: any) => {
      return (
        sum +
        (order.Order_Items?.reduce((iSum: number, item: any) => iSum + (item.quantity || 0), 0) ||
          0)
      );
    }, 0);

    const lowStockItems = (shopData.Products || []).filter(
      (product: any) => product.quantity <= (product.reorder_point || 0)
    );

    return {
      dailySales,
      itemsSoldToday: totalItemsSoldToday,
      activeStaff: staffData.filter(s => s.active).length,
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems.slice(0, 5), // Only show first 5 for attention
    };
  }, [shopData, staffData]);

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
            <CardTitle className="text-sm font-medium text-muted-foreground">Daily Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics?.dailySales || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Today's total revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Items Sold Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.itemsSoldToday || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Quantity of products sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeStaff || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently assigned to shop</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{metrics?.lowStockCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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

        <Card>
          <CardHeader>
            <CardTitle>Staff Members</CardTitle>
            <CardDescription>Team members assigned to this location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {staffData.length > 0 ? (
                staffData.map(staff => (
                  <div
                    key={staff.id}
                    className="flex items-center justify-between p-2 border rounded-md"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{staff.fullnames}</div>
                        <div className="text-sm text-muted-foreground">
                          {staff.Position || staff.roleType}
                        </div>
                      </div>
                    </div>
                    <Badge variant={staff.active ? 'default' : 'secondary'}>
                      {staff.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No staff members found for this shop
                </div>
              )}
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
            <CardTitle>Shop Operations</CardTitle>
            <CardDescription>General information and quick tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start p-2 border rounded-md">
                <Store className="text-primary h-5 w-5 mr-3 mt-0.5" />
                <div>
                  <div className="font-medium">Operating Hours</div>
                  <div className="text-sm text-muted-foreground">
                    {shopData?.operating_hours || 'Not set'}
                  </div>
                </div>
              </div>

              <div className="flex items-start p-2 border rounded-md">
                <Users className="text-primary h-5 w-5 mr-3 mt-0.5" />
                <div>
                  <div className="font-medium">Contact Information</div>
                  <div className="text-sm text-muted-foreground">
                    {shopData?.phone || 'No phone'} | {shopData?.email || 'No email'}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Internal Notes
                </div>
                <p className="text-sm italic text-muted-foreground">
                  {shopData?.description || 'No description provided for this shop.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ShopDashboard;
