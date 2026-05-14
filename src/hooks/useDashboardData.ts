import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { cacheGet, cacheSet } from '@/lib/cache';

export const useDashboardData = () => {
  const { data: shopsRes, isLoading: isLoadingShops } = useQuery({
    queryKey: ['dashboard', 'shops'],
    queryFn: async () => {
      const res = await apiGet<{ shops: any[] }>('/api/queries/shops');
      cacheSet('dashboard_shops', res);
      return res;
    },
    initialData: () => cacheGet<{ shops: any[] }>('dashboard_shops') || undefined,
  });

  const { data: usersRes, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['dashboard', 'users'],
    queryFn: async () => {
      const res = await apiGet<{ users: any[] }>('/api/queries/users');
      cacheSet('dashboard_users', res);
      return res;
    },
    initialData: () => cacheGet<{ users: any[] }>('dashboard_users') || undefined,
  });

  const { data: productsRes, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['dashboard', 'products'],
    queryFn: async () => {
      const res = await apiGet<{ products: any[] }>('/api/queries/products');
      cacheSet('dashboard_products', res);
      return res;
    },
    initialData: () => cacheGet<{ products: any[] }>('dashboard_products') || undefined,
  });

  const { data: ordersRes, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['dashboard', 'orders'],
    queryFn: async () => {
      const res = await apiGet<{ orders: any[] }>('/api/queries/orders');
      cacheSet('dashboard_orders', res);
      return res;
    },
    initialData: () => cacheGet<{ orders: any[] }>('dashboard_orders') || undefined,
  });

  const { data: orderStatsRes, isLoading: isLoadingOrderStats } = useQuery({
    queryKey: ['dashboard', 'order-stats'],
    queryFn: async () => {
      const res = await apiGet<{
        totalOrders: number;
        monthlyOrders: number;
        pendingOrders: number;
        breakdown?: { regular: number; reel: number; restaurant: number; business: number };
        monthlyBreakdown?: { regular: number; reel: number; restaurant: number; business: number };
      }>('/api/queries/order-stats');
      cacheSet('dashboard_order_stats', res);
      return res;
    },
    initialData: () => cacheGet<any>('dashboard_order_stats') || undefined,
  });

  const { data: shoppersRes, isLoading: isLoadingShoppers } = useQuery({
    queryKey: ['dashboard', 'shoppers'],
    queryFn: async () => {
      const res = await apiGet<{ shoppers: any[] }>('/api/queries/shoppers');
      cacheSet('dashboard_shoppers', res);
      return res;
    },
    initialData: () => cacheGet<{ shoppers: any[] }>('dashboard_shoppers') || undefined,
  });

  const { data: revenueArray, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['dashboard', 'revenue'],
    queryFn: async () => {
      const res = await apiGet<any[]>('/api/revenue');
      cacheSet('dashboard_revenue', res);
      return res;
    },
    initialData: () => cacheGet<any[]>('dashboard_revenue') || undefined,
  });

  const { data: refundsRes, isLoading: isLoadingRefunds } = useQuery({
    queryKey: ['dashboard', 'all-refunds'],
    queryFn: async () => {
      const res = await apiGet<{ refunds: any[] }>('/api/queries/all-refunds');
      cacheSet('dashboard_refunds', res);
      return res;
    },
    initialData: () => cacheGet<{ refunds: any[] }>('dashboard_refunds') || undefined,
  });

  const { data: ticketsRes, isLoading: isLoadingTickets } = useQuery({
    queryKey: ['dashboard', 'tickets'],
    queryFn: async () => {
      const res = await apiGet<{ tickets: any[] }>('/api/queries/tickets');
      cacheSet('dashboard_tickets', res);
      return res;
    },
    initialData: () => cacheGet<{ tickets: any[] }>('dashboard_tickets') || undefined,
  });

  // Wallet balances across all wallet tables
  const { data: walletTotalsRes, isLoading: isLoadingWalletTotals } = useQuery({
    queryKey: ['dashboard', 'wallet-totals'],
    queryFn: async () => {
      const res = await apiGet<{ walletBalance: number; businessBalance: number; total: number }>(
        '/api/queries/wallet-totals'
      );
      cacheSet('dashboard_wallet_totals', res);
      return res;
    },
    staleTime: 2 * 60 * 1000,
    initialData: () => cacheGet<any>('dashboard_wallet_totals') || undefined,
  });

  // Pending orders total value across all order types
  const { data: pendingOrderTotalsRes, isLoading: isLoadingPendingOrderTotals } = useQuery({
    queryKey: ['dashboard', 'pending-order-totals'],
    queryFn: async () => {
      const res = await apiGet<{ total: number; breakdown: Record<string, number> }>(
        '/api/queries/pending-order-totals'
      );
      cacheSet('dashboard_pending_order_totals', res);
      return res;
    },
    staleTime: 2 * 60 * 1000,
    initialData: () => cacheGet<any>('dashboard_pending_order_totals') || undefined,
  });

  const shopsData = shopsRes ? { Shops: shopsRes.shops } : undefined;
  const usersData = usersRes ? { Users: usersRes.users } : undefined;
  const productsData = productsRes ? { Products: productsRes.products } : undefined;
  const ordersData = ordersRes ? { Orders: ordersRes.orders } : undefined;
  const orderStats = orderStatsRes;
  const shoppersData = shoppersRes ? { shoppers: shoppersRes.shoppers } : undefined;
  const revenueData = Array.isArray(revenueArray) ? { Revenue: revenueArray } : { Revenue: [] };
  const refundsData = refundsRes ? { Refunds: refundsRes.refunds } : undefined;
  const ticketsData = ticketsRes ? { tickets: ticketsRes.tickets } : undefined;

  // Calculate counts from arrays
  const totalShops = shopsData?.Shops?.length || 0;
  const totalUsers = usersData?.Users?.length || 0;
  const totalProducts = productsData?.Products?.length || 0;

  // Order counts from platform-wide stats (Orders + reel_orders + restaurant_orders + businessProductOrders)
  const totalOrders = orderStats?.totalOrders ?? 0;
  const monthlyOrders = orderStats?.monthlyOrders ?? 0;
  const pendingOrders = orderStats?.pendingOrders ?? 0;

  // Calculate active shoppers
  const activeShoppers = shoppersData?.shoppers?.filter((s: any) => s.active)?.length || 0;

  // Calculate total revenue
  const totalRevenue =
    revenueData?.Revenue?.reduce((sum: number, r: any) => sum + parseFloat(r.amount || '0'), 0) ||
    0;

  // Calculate monthly revenue
  const monthlyRevenue =
    revenueData?.Revenue?.filter((r: any) => {
      const createdAt = new Date(r.created_at);
      const now = new Date();
      return (
        createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()
      );
    }).reduce((sum: number, r: any) => sum + parseFloat(r.amount || '0'), 0) || 0;

  // Calculate pending payouts from refunds
  const pendingPayouts =
    refundsData?.Refunds?.reduce((sum: number, r: any) => sum + parseFloat(r.amount || '0'), 0) ||
    0;

  // Calculate ticket statistics
  const totalTickets = ticketsData?.tickets?.length || 0;
  const openTickets = ticketsData?.tickets?.filter((t: any) => t.status !== 'closed')?.length || 0;

  return {
    // Shop statistics
    totalShops,

    // User statistics
    totalUsers,
    activeShoppers,

    // Product statistics
    totalProducts,

    // Order statistics
    totalOrders,
    monthlyOrders,
    pendingOrders,

    // Ticket statistics
    totalTickets,
    openTickets,

    // Revenue statistics
    totalRevenue,
    monthlyRevenue,
    pendingPayouts,

    // Wallet totals
    totalWalletBalance: walletTotalsRes?.total ?? 0,
    personalWalletBalance: walletTotalsRes?.walletBalance ?? 0,
    businessWalletBalance: walletTotalsRes?.businessBalance ?? 0,

    // Pending order value
    pendingOrdersValue: pendingOrderTotalsRes?.total ?? 0,

    // Loading states
    isLoading:
      isLoadingShops ||
      isLoadingUsers ||
      isLoadingProducts ||
      isLoadingOrders ||
      isLoadingOrderStats ||
      isLoadingShoppers ||
      isLoadingRevenue ||
      isLoadingRefunds ||
      isLoadingTickets ||
      isLoadingWalletTotals ||
      isLoadingPendingOrderTotals,
    // Expose order breakdown for FinancialOverview / other consumers
    orderBreakdown: orderStats?.breakdown,
    monthlyOrderBreakdown: orderStats?.monthlyBreakdown,
  };
};
