import React from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import StatCard from '@/components/dashboard/StatCard';
import RecentOrders from '@/components/dashboard/RecentOrders';
import TopShoppers from '@/components/dashboard/TopShoppers';
import OrdersChart from '@/components/dashboard/OrdersChart';
import OrdersOverdueCard from '@/components/dashboard/OrdersOverdueCard';
import { ShoppingCart, User, DollarSign, Package, Store, MessageSquare, Package2 } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';

const Index = () => {
  const {
    totalShops,
    totalUsers,
    totalProducts,
    totalOrders,
    monthlyOrders,
    pendingOrders,
    totalTickets,
    openTickets,
    totalRevenue,
    monthlyRevenue,
    activeShoppers,
    isLoading
  } = useDashboardData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your delivery service platform.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            value={isLoading ? "Loading..." : formatCurrency(totalRevenue)}
            description="Total revenue all time"
            icon={<DollarSign />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Monthly Revenue"
            value={isLoading ? "Loading..." : formatCurrency(monthlyRevenue)}
            description="Revenue this month"
            icon={<DollarSign />}
            trend={{ value: 9, isPositive: true }}
          />
          <StatCard
            title="Total Orders"
            value={isLoading ? "Loading..." : totalOrders.toLocaleString()}
            description="All time orders"
            icon={<ShoppingCart />}
            trend={{ value: 9, isPositive: true }}
          />
          <StatCard
            title="Monthly Orders"
            value={isLoading ? "Loading..." : monthlyOrders.toLocaleString()}
            description="Orders this month"
            icon={<ShoppingCart />}
            trend={{ value: 5, isPositive: true }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Supermarkets"
            value={isLoading ? "Loading..." : totalShops.toLocaleString()}
            description="Total shops in system"
            icon={<Store />}
            trend={{ value: 2, isPositive: true }}
          />
          <StatCard
            title="Users"
            value={isLoading ? "Loading..." : totalUsers.toLocaleString()}
            description="Total registered users"
            icon={<User />}
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Products"
            value={isLoading ? "Loading..." : totalProducts.toLocaleString()}
            description="Total products in system"
            icon={<Package2 />}
            trend={{ value: 15, isPositive: true }}
          />
          <StatCard
            title="Active Shoppers"
            value={isLoading ? "Loading..." : activeShoppers.toLocaleString()}
            description="Currently active"
            icon={<User />}
            trend={{ value: 3, isPositive: true }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Pending Orders"
            value={isLoading ? "Loading..." : pendingOrders.toLocaleString()}
            description="Unassigned orders"
            icon={<Package />}
            trend={{ value: 2, isPositive: false }}
          />
          <StatCard
            title="Total Tickets"
            value={isLoading ? "Loading..." : totalTickets.toLocaleString()}
            description="All support tickets"
            icon={<MessageSquare />}
            trend={{ value: 4, isPositive: false }}
          />
          <StatCard
            title="Open Tickets"
            value={isLoading ? "Loading..." : openTickets.toLocaleString()}
            description="Tickets needing attention"
            icon={<MessageSquare />}
            trend={{ value: 1, isPositive: false }}
          />
          <StatCard
            title="System Health"
            value={isLoading ? "Loading..." : "Good"}
            description="Platform status"
            icon={<Package />}
            trend={{ value: 0, isPositive: true }}
          />
        </div>

        <OrdersChart />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RecentOrders />
          <OrdersOverdueCard />
          <TopShoppers />
        </div>
      
      </div>
    </AdminLayout>
  );
};

export default Index;
