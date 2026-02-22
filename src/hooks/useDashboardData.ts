import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { hasuraRequest } from '@/lib/hasura';
import { GET_WALLET_TOTALS, GET_PENDING_ORDER_TOTALS } from '@/lib/graphql/queries';

export const useDashboardData = () => {
  const { data: shopsRes, isLoading: isLoadingShops } = useQuery({
    queryKey: ['dashboard', 'shops'],
    queryFn: () => apiGet<{ shops: any[] }>('/api/queries/shops'),
  });
  const { data: usersRes, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['dashboard', 'users'],
    queryFn: () => apiGet<{ users: any[] }>('/api/queries/users'),
  });
  const { data: productsRes, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['dashboard', 'products'],
    queryFn: () => apiGet<{ products: any[] }>('/api/queries/products'),
  });
  const { data: ordersRes, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['dashboard', 'orders'],
    queryFn: () => apiGet<{ orders: any[] }>('/api/queries/orders'),
  });
  const { data: orderStatsRes, isLoading: isLoadingOrderStats } = useQuery({
    queryKey: ['dashboard', 'order-stats'],
    queryFn: () =>
      apiGet<{
        totalOrders: number;
        monthlyOrders: number;
        pendingOrders: number;
        breakdown?: { regular: number; reel: number; restaurant: number; business: number };
        monthlyBreakdown?: { regular: number; reel: number; restaurant: number; business: number };
      }>('/api/queries/order-stats'),
  });
  const { data: shoppersRes, isLoading: isLoadingShoppers } = useQuery({
    queryKey: ['dashboard', 'shoppers'],
    queryFn: () => apiGet<{ shoppers: any[] }>('/api/queries/shoppers'),
  });
  const { data: revenueArray, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['dashboard', 'revenue'],
    queryFn: () => apiGet<any[]>('/api/revenue'),
  });
  const { data: refundsRes, isLoading: isLoadingRefunds } = useQuery({
    queryKey: ['dashboard', 'all-refunds'],
    queryFn: () => apiGet<{ refunds: any[] }>('/api/queries/all-refunds'),
  });
  const { data: ticketsRes, isLoading: isLoadingTickets } = useQuery({
    queryKey: ['dashboard', 'tickets'],
    queryFn: () => apiGet<{ tickets: any[] }>('/api/queries/tickets'),
  });

  // Wallet balances across all wallet tables
  const { data: walletTotalsRes, isLoading: isLoadingWalletTotals } = useQuery({
    queryKey: ['dashboard', 'wallet-totals'],
    queryFn: async () => {
      const res = (await hasuraRequest(GET_WALLET_TOTALS)) as unknown as {
        Wallets: { available_balance: string }[];
        business_wallet: { amount: string }[];
        personalWallet: { balance: string }[];
      };
      const sumArr = (arr: { [k: string]: string }[], key: string) =>
        (arr ?? []).reduce((acc, r) => acc + parseFloat(r[key] ?? '0'), 0);
      const personal = sumArr(res.Wallets, 'available_balance');
      const business = sumArr(res.business_wallet, 'amount');
      const personalW = sumArr(res.personalWallet as any, 'balance');
      return { personal: personal + personalW, business, total: personal + personalW + business };
    },
    staleTime: 2 * 60 * 1000,
  });

  // Pending orders total value across all order types
  const { data: pendingOrderTotalsRes, isLoading: isLoadingPendingOrderTotals } = useQuery({
    queryKey: ['dashboard', 'pending-order-totals'],
    queryFn: async () => {
      const res = (await hasuraRequest(GET_PENDING_ORDER_TOTALS)) as unknown as {
        Orders: { total: string; delivery_fee: string; service_fee: string }[];
        reel_orders: { total: string; delivery_fee: string; service_fee: string }[];
        restaurant_orders: { total: string; delivery_fee: string }[];
        businessProductOrders: { total: string; service_fee: string; transportation_fee: string }[];
      };
      const sumFields = (arr: Record<string, string>[], ...keys: string[]) =>
        (arr ?? []).reduce(
          (acc, row) => acc + keys.reduce((s, k) => s + parseFloat(row[k] ?? '0'), 0),
          0
        );
      return {
        total:
          sumFields(res.Orders as any, 'total', 'delivery_fee', 'service_fee') +
          sumFields(res.reel_orders as any, 'total', 'delivery_fee', 'service_fee') +
          sumFields(res.restaurant_orders as any, 'total', 'delivery_fee') +
          sumFields(res.businessProductOrders as any, 'total', 'service_fee', 'transportation_fee'),
      };
    },
    staleTime: 2 * 60 * 1000,
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
    personalWalletBalance: walletTotalsRes?.personal ?? 0,
    businessWalletBalance: walletTotalsRes?.business ?? 0,

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
