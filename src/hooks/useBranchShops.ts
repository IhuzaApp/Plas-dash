import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hasuraRequest } from '@/lib/hasura';
import { useAuth } from '@/components/layout/RootLayout';
import { useShopSession } from '@/contexts/ShopSessionContext';

interface BranchShop {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  relatedTo: string;
  // Performance metrics
  totalRevenue: number;
  totalOrders: number;
  averageRating: number;
  performance: number;
  trend: 'up' | 'down' | 'neutral';
}

interface UseBranchShopsReturn {
  branchShops: BranchShop[];
  isLoading: boolean;
  error: string | null;
  totalRevenue: number;
  totalOrders: number;
  averagePerformance: number;
}

export function useBranchShops(): UseBranchShopsReturn {
  const { session } = useAuth();
  const { shopSession } = useShopSession();
  const [branchShops, setBranchShops] = useState<BranchShop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the current shop name from shop session
  const currentShopName = shopSession?.shopName;

  // GraphQL query to get branch shops
  const GET_BRANCH_SHOPS = `
    query GetBranchShops($relatedTo: String!) {
      Shops(where: { relatedTo: { _eq: $relatedTo }, is_active: { _eq: true } }) {
        id
        name
        description
        address
        phone
        is_active
        created_at
        updated_at
        relatedTo
        Orders {
          id
          total
          status
          created_at
          Ratings {
            rating
          }
        }
      }
    }
  `;

  const {
    data,
    isLoading: queryLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['branchShops', currentShopName],
    queryFn: () => hasuraRequest(GET_BRANCH_SHOPS, { relatedTo: currentShopName }),
    enabled: !!currentShopName,
  });

  useEffect(() => {
    if (queryLoading) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsLoading(false);
    }

    if (queryError) {
      setError(queryError.message);
    }

    if (data && typeof data === 'object' && 'Shops' in data && Array.isArray((data as any).Shops)) {
      const shops = (data as any).Shops.map((shop: any) => {
        // Calculate performance metrics
        const orders = shop.Orders || [];
        const totalRevenue = orders.reduce((sum: number, order: any) => {
          return sum + parseFloat(order.total || '0');
        }, 0);

        const totalOrders = orders.length;

        const ratings = orders.flatMap((order: any) => order.Ratings || []);
        const averageRating =
          ratings.length > 0
            ? ratings.reduce(
                (sum: number, rating: any) => sum + parseFloat(rating.rating || '0'),
                0
              ) / ratings.length
            : 0;

        // Calculate performance (mock target for now)
        const target = 50000; // Mock target
        const performance = target > 0 ? (totalRevenue / target) * 100 : 0;

        // Determine trend (mock for now)
        const trend: 'up' | 'down' | 'neutral' =
          performance > 100 ? 'up' : performance < 90 ? 'down' : 'neutral';

        return {
          id: shop.id,
          name: shop.name,
          description: shop.description,
          address: shop.address,
          phone: shop.phone,
          is_active: shop.is_active,
          created_at: shop.created_at,
          updated_at: shop.updated_at,
          relatedTo: shop.relatedTo,
          totalRevenue,
          totalOrders,
          averageRating,
          performance,
          trend,
        };
      });

      setBranchShops(shops);
    }
  }, [data, queryLoading, queryError]);

  // Calculate totals
  const totalRevenue = branchShops.reduce((sum, shop) => sum + shop.totalRevenue, 0);
  const totalOrders = branchShops.reduce((sum, shop) => sum + shop.totalOrders, 0);
  const averagePerformance =
    branchShops.length > 0
      ? branchShops.reduce((sum, shop) => sum + shop.performance, 0) / branchShops.length
      : 0;

  return {
    branchShops,
    isLoading,
    error,
    totalRevenue,
    totalOrders,
    averagePerformance,
  };
}
