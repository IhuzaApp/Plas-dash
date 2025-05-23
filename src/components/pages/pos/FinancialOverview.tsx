
import React from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface SalesData {
  id: string;
  date: Date;
  revenue: number;
  sales: number;
  averageValue: number;
  trend: "up" | "down" | "neutral";
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const monthlySales: SalesData[] = [
  { id: "1", date: new Date(2025, 0, 1), revenue: 42500, sales: 850, averageValue: 50, trend: "up" },
  { id: "2", date: new Date(2025, 1, 1), revenue: 39800, sales: 780, averageValue: 51, trend: "down" },
  { id: "3", date: new Date(2025, 2, 1), revenue: 41200, sales: 805, averageValue: 51.2, trend: "up" },
  { id: "4", date: new Date(2025, 3, 1), revenue: 44300, sales: 856, averageValue: 51.8, trend: "up" },
  { id: "5", date: new Date(2025, 4, 1), revenue: 47500, sales: 909, averageValue: 52.3, trend: "up" },
  { id: "6", date: new Date(2025, 5, 1), revenue: 49200, sales: 935, averageValue: 52.6, trend: "up" },
];

const currentYear = new Date().getFullYear();

const FinancialOverview = () => {
  const totalRevenue = monthlySales.reduce((sum, month) => sum + month.revenue, 0);
  const totalSales = monthlySales.reduce((sum, month) => sum + month.sales, 0);
  const averageSaleValue = totalRevenue / totalSales;
  
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
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from previous year
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sales (YTD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales.toLocaleString()} items</div>
            <p className="text-xs text-muted-foreground">
              +8.2% from previous year
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Sale Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageSaleValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +3.8% from previous year
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
              <CardTitle>Monthly Sales ({currentYear})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Sales (items)</TableHead>
                      <TableHead className="text-right">Average Value</TableHead>
                      <TableHead>Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlySales.map((month) => (
                      <TableRow key={month.id}>
                        <TableCell>{format(month.date, "MMMM yyyy")}</TableCell>
                        <TableCell className="text-right">${month.revenue.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{month.sales.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${month.averageValue.toFixed(2)}</TableCell>
                        <TableCell>
                          {month.trend === "up" ? (
                            <div className="flex items-center text-green-500">
                              <TrendingUp className="mr-1 h-4 w-4" /> Up
                            </div>
                          ) : month.trend === "down" ? (
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
