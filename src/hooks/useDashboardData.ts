import { useQuery } from '@tanstack/react-query';
import { hasuraRequest } from '@/lib/hasura';
import { useGraphqlQuery } from './useGraphql';
import { GET_ALL_REVENUE, GET_ALL_REFUNDS, GET_SHOPS, GET_USERS, GET_PRODUCTS, GET_ORDERS, GET_SHOPPERS, GET_TICKETS } from '@/lib/graphql/queries';

// Dashboard statistics query
const GET_DASHBOARD_STATS = `
  query GetDashboardStats {
    # Total shops
    Shops_aggregate {
      aggregate {
        count
      }
    }
    
    # Total users
    Users_aggregate {
      aggregate {
        count
      }
    }
    
    # Total products
    Products_aggregate {
      aggregate {
        count
      }
    }
    
    # Total orders
    Orders_aggregate {
      aggregate {
        count
      }
    }
    
    # Pending orders (not assigned to shopper)
    pending_orders: Orders_aggregate(where: { shopper_id: { _is_null: true } }) {
      aggregate {
        count
      }
    }
    
    # Active shoppers
    active_shoppers: shoppers_aggregate(where: { active: { _eq: true } }) {
      aggregate {
        count
      }
    }
    
    # Total tickets
    tickets_aggregate {
      aggregate {
        count
      }
    }
    
    # Open tickets
    open_tickets: tickets_aggregate(where: { status: { _eq: "open" } }) {
      aggregate {
        count
      }
    }
    
    # This month's orders
    monthly_orders: Orders_aggregate(where: { created_at: { _gte: "now() - interval '1 month'" } }) {
      aggregate {
        count
      }
    }
    
    # This month's revenue
    monthly_revenue: Revenue_aggregate(where: { created_at: { _gte: "now() - interval '1 month'" } }) {
      aggregate {
        sum {
          amount
        }
      }
    }
  }
`;

export const useDashboardData = () => {
  // Use existing queries from queries.ts
  const { data: shopsData, isLoading: isLoadingShops } = useGraphqlQuery<any>(GET_SHOPS);
  const { data: usersData, isLoading: isLoadingUsers } = useGraphqlQuery<any>(GET_USERS);
  const { data: productsData, isLoading: isLoadingProducts } = useGraphqlQuery<any>(GET_PRODUCTS);
  const { data: ordersData, isLoading: isLoadingOrders } = useGraphqlQuery<any>(GET_ORDERS);
  const { data: shoppersData, isLoading: isLoadingShoppers } = useGraphqlQuery<any>(GET_SHOPPERS);
  const { data: revenueData, isLoading: isLoadingRevenue } = useGraphqlQuery<any>(GET_ALL_REVENUE);
  const { data: refundsData, isLoading: isLoadingRefunds } = useGraphqlQuery<any>(GET_ALL_REFUNDS);
  
  // Get tickets data
  const { data: ticketsData, isLoading: isLoadingTickets } = useGraphqlQuery<any>(GET_TICKETS);

  // Calculate counts from arrays
  const totalShops = shopsData?.Shops?.length || 0;
  const totalUsers = usersData?.Users?.length || 0;
  const totalProducts = productsData?.Products?.length || 0;
  const totalOrders = ordersData?.Orders?.length || 0;
  
  // Calculate active shoppers
  const activeShoppers = shoppersData?.shoppers?.filter((s: any) => s.active)?.length || 0;
  
  // Calculate pending orders (not delivered)
  const pendingOrders = ordersData?.Orders?.filter((o: any) => o.status !== 'delivered')?.length || 0;
  
  // Calculate monthly orders
  const monthlyOrders = ordersData?.Orders?.filter((o: any) => {
    const createdAt = new Date(o.created_at);
    const now = new Date();
    return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
  })?.length || 0;

  // Calculate total revenue
  const totalRevenue = revenueData?.Revenue?.reduce((sum: number, r: any) => sum + parseFloat(r.amount || '0'), 0) || 0;
  
  // Calculate monthly revenue
  const monthlyRevenue = revenueData?.Revenue?.filter((r: any) => {
    const createdAt = new Date(r.created_at);
    const now = new Date();
    return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
  }).reduce((sum: number, r: any) => sum + parseFloat(r.amount || '0'), 0) || 0;

  // Calculate pending payouts from refunds
  const pendingPayouts = refundsData?.Refunds?.reduce((sum: number, r: any) => sum + parseFloat(r.amount || '0'), 0) || 0;

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
    
    // Loading states
    isLoading: isLoadingShops || isLoadingUsers || isLoadingProducts || isLoadingOrders || isLoadingShoppers || isLoadingRevenue || isLoadingRefunds || isLoadingTickets,
  };
}; 