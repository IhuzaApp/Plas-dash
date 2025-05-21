
import React from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import StatCard from "@/components/dashboard/StatCard";
import RecentOrders from "@/components/dashboard/RecentOrders";
import TopShoppers from "@/components/dashboard/TopShoppers";
import RevenueChart from "@/components/dashboard/RevenueChart";
import { ShoppingCart, User, DollarSign, Package } from "lucide-react";

const Index = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your delivery service platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            value="$45,231.89"
            description="Total revenue this month"
            icon={<DollarSign />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Orders"
            value="2,345"
            description="Total orders this month"
            icon={<ShoppingCart />}
            trend={{ value: 9, isPositive: true }}
          />
          <StatCard
            title="Active Shoppers"
            value="48"
            description="Currently online"
            icon={<User />}
            trend={{ value: 5, isPositive: true }}
          />
          <StatCard
            title="Pending Orders"
            value="32"
            description="Needs attention"
            icon={<Package />}
            trend={{ value: 2, isPositive: false }}
          />
        </div>

        <RevenueChart />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RecentOrders />
          <TopShoppers />
        </div>
      </div>
    </AdminLayout>
  );
};

export default Index;
