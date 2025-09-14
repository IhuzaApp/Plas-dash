import React from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Store, ShoppingBag, Users, AlertTriangle, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const ShopDashboard = () => {
  return (
    <AdminLayout>
      <PageHeader
        title="Shop Admin Dashboard"
        description="Monitor your store's performance and operations"
        icon={<Store className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Daily Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,248.32</div>
            <p className="text-xs text-muted-foreground mt-1">+8.1% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Items Sold Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87</div>
            <p className="text-xs text-muted-foreground mt-1">+12 more than yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground mt-1">of 6 scheduled today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">12</div>
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>Dairy Products</span>
                  </div>
                  <Badge variant="outline">86%</Badge>
                </div>
                <Progress value={86} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>Meat & Poultry</span>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50">
                    48%
                  </Badge>
                </div>
                <Progress value={48} className="h-2 bg-yellow-100" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>Fresh Produce</span>
                  </div>
                  <Badge variant="outline" className="bg-red-50">
                    22%
                  </Badge>
                </div>
                <Progress value={22} className="h-2 bg-red-100" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>Bakery</span>
                  </div>
                  <Badge variant="outline">75%</Badge>
                </div>
                <Progress value={75} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>Beverages</span>
                  </div>
                  <Badge variant="outline">92%</Badge>
                </div>
                <Progress value={92} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff Activity</CardTitle>
            <CardDescription>Current staff and work sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">John Smith</div>
                    <div className="text-sm text-muted-foreground">Cashier</div>
                  </div>
                </div>
                <Badge>Active</Badge>
              </div>

              <div className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Emma Johnson</div>
                    <div className="text-sm text-muted-foreground">Manager</div>
                  </div>
                </div>
                <Badge>Active</Badge>
              </div>

              <div className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">David Wilson</div>
                    <div className="text-sm text-muted-foreground">Stock Clerk</div>
                  </div>
                </div>
                <Badge>Active</Badge>
              </div>

              <div className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Sarah Martinez</div>
                    <div className="text-sm text-muted-foreground">Cashier</div>
                  </div>
                </div>
                <Badge variant="outline">Break</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Items Requiring Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="text-yellow-500 h-5 w-5" />
                  <span>Fresh Milk (1L) - Low Stock (3 remaining)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-red-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="text-red-500 h-5 w-5" />
                  <span>Chicken Breast (500g) - Out of Stock</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="text-yellow-500 h-5 w-5" />
                  <span>Rice (2kg) - Low Stock (2 remaining)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="text-yellow-500 h-5 w-5" />
                  <span>Eggs (12) - Low Stock (4 remaining)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center p-2 border rounded-md">
                <Zap className="text-primary h-5 w-5 mr-2" />
                <span>Order more Fresh Milk based on weekly sales patterns</span>
              </div>

              <div className="flex items-center p-2 border rounded-md">
                <Zap className="text-primary h-5 w-5 mr-2" />
                <span>Schedule additional staff for expected busy period (Friday afternoon)</span>
              </div>

              <div className="flex items-center p-2 border rounded-md">
                <Zap className="text-primary h-5 w-5 mr-2" />
                <span>Consider running a promotion on Bakery items (high stock level)</span>
              </div>

              <div className="flex items-center p-2 border rounded-md">
                <Zap className="text-primary h-5 w-5 mr-2" />
                <span>Check expiry dates on dairy products in back storage</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ShopDashboard;
