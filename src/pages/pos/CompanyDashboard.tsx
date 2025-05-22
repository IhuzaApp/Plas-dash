
import React from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LayoutDashboard, TrendingUp, TrendingDown, Store, ShoppingBag, Users, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StorePerformance {
  id: string;
  name: string;
  location: string;
  revenue: number;
  target: number;
  performance: number;
  trend: "up" | "down" | "neutral";
}

const storePerformance: StorePerformance[] = [
  { id: "1", name: "Central Store", location: "Downtown", revenue: 54280, target: 50000, performance: 108.6, trend: "up" },
  { id: "2", name: "Westside Market", location: "West Hills", revenue: 42150, target: 45000, performance: 93.7, trend: "down" },
  { id: "3", name: "Northgate Shop", location: "North End", revenue: 48900, target: 47000, performance: 104, trend: "up" },
  { id: "4", name: "Eastside Express", location: "East Valley", revenue: 37820, target: 40000, performance: 94.6, trend: "down" },
  { id: "5", name: "South Point", location: "South District", revenue: 41260, target: 38000, performance: 108.6, trend: "up" },
];

const CompanyDashboard = () => {
  const totalRevenue = storePerformance.reduce((sum, store) => sum + store.revenue, 0);
  const totalTarget = storePerformance.reduce((sum, store) => sum + store.target, 0);
  const overallPerformance = (totalRevenue / totalTarget) * 100;
  
  return (
    <AdminLayout>
      <PageHeader 
        title="Company Admin Dashboard" 
        description="Overview of all stores and company-wide metrics"
        icon={<LayoutDashboard className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                  <TrendingUp className="h-3 w-3 mr-1" /> {(overallPerformance - 100).toFixed(1)}% above target
                </div>
              ) : (
                <div className="text-xs text-red-500 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" /> {(100 - overallPerformance).toFixed(1)}% below target
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Stores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground mt-1">
              All stores operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground mt-1">
              28 active today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inventory Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$287,590</div>
            <p className="text-xs text-muted-foreground mt-1">
              +$12,450 from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stores">
        <TabsList className="mb-4">
          <TabsTrigger value="stores">Store Performance</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Overview</TabsTrigger>
          <TabsTrigger value="staff">Staff Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stores">
          <Card>
            <CardHeader>
              <CardTitle>Store Performance</CardTitle>
              <CardDescription>Monthly revenue vs targets for all locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Target</TableHead>
                      <TableHead className="text-right">Performance</TableHead>
                      <TableHead>Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {storePerformance.map((store) => (
                      <TableRow key={store.id}>
                        <TableCell className="font-medium">{store.name}</TableCell>
                        <TableCell>{store.location}</TableCell>
                        <TableCell className="text-right">${store.revenue.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${store.target.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{store.performance.toFixed(1)}%</TableCell>
                        <TableCell>
                          {store.trend === "up" ? (
                            <div className="flex items-center text-green-500">
                              <TrendingUp className="mr-1 h-4 w-4" /> Up
                            </div>
                          ) : store.trend === "down" ? (
                            <div className="flex items-center text-red-500">
                              <TrendingDown className="mr-1 h-4 w-4" /> Down
                            </div>
                          ) : (
                            <div className="flex items-center text-gray-500">
                              — Stable
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="inventory">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>Best performing products across all stores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Fresh Milk (1L)</span>
                      <Badge variant="outline">1,245 units</Badge>
                    </div>
                    <Progress value={98} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>White Bread</span>
                      <Badge variant="outline">982 units</Badge>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Eggs (12)</span>
                      <Badge variant="outline">875 units</Badge>
                    </div>
                    <Progress value={70} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Chicken Breast (500g)</span>
                      <Badge variant="outline">743 units</Badge>
                    </div>
                    <Progress value={59} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Bananas (kg)</span>
                      <Badge variant="outline">692 units</Badge>
                    </div>
                    <Progress value={55} className="h-2" />
                  </div>
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
              <div className="rounded-md border mb-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store</TableHead>
                      <TableHead className="text-right">Manager</TableHead>
                      <TableHead className="text-right">Cashier</TableHead>
                      <TableHead className="text-right">Stock Clerk</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Central Store</TableCell>
                      <TableCell className="text-right">1</TableCell>
                      <TableCell className="text-right">4</TableCell>
                      <TableCell className="text-right">3</TableCell>
                      <TableCell className="text-right">8</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Westside Market</TableCell>
                      <TableCell className="text-right">1</TableCell>
                      <TableCell className="text-right">4</TableCell>
                      <TableCell className="text-right">2</TableCell>
                      <TableCell className="text-right">7</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Northgate Shop</TableCell>
                      <TableCell className="text-right">1</TableCell>
                      <TableCell className="text-right">5</TableCell>
                      <TableCell className="text-right">3</TableCell>
                      <TableCell className="text-right">9</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Eastside Express</TableCell>
                      <TableCell className="text-right">1</TableCell>
                      <TableCell className="text-right">3</TableCell>
                      <TableCell className="text-right">3</TableCell>
                      <TableCell className="text-right">7</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">South Point</TableCell>
                      <TableCell className="text-right">1</TableCell>
                      <TableCell className="text-right">4</TableCell>
                      <TableCell className="text-right">2</TableCell>
                      <TableCell className="text-right">7</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Recent Staff Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div>John Smith clocked in at Central Store</div>
                        <div className="text-xs text-muted-foreground">Today, 8:03 AM</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div>Emma Johnson clocked in at Central Store</div>
                        <div className="text-xs text-muted-foreground">Today, 7:55 AM</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div>David Wilson clocked in at Central Store</div>
                        <div className="text-xs text-muted-foreground">Today, 8:10 AM</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default CompanyDashboard;
