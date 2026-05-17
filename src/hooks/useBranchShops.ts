import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hasuraRequest } from '@/lib/hasura';
import { useAuth } from '@/contexts/AuthContext';

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
  has_branch?: boolean;
  // Performance metrics
  totalRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  monthlyOrders: number;
  todaySales: number;
  averageRating: number;
  performance: number;
  trend: 'up' | 'down' | 'neutral';
  Orders: any[];
  orgEmployees: any[];
  Products: any[];
}

interface UseBranchShopsReturn {
  branchShops: BranchShop[];
  isLoading: boolean;
  error: string | null;
  totalRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  monthlyOrders: number;
  todaySalesTotal: number;
  averagePerformance: number;
}

export function useBranchShops(): UseBranchShopsReturn {
  const { session } = useAuth();
  const [branchShops, setBranchShops] = useState<BranchShop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRestaurant = !!session?.restaurant_id;
  const currentBusinessId = isRestaurant ? session?.restaurant_id : session?.shop_id;

  const GET_MAIN_SHOP = `
    query GetMainShop($businessId: uuid!) {
      Shops(where: { id: { _eq: $businessId } }) {
        id
        name
        description
        address
        phone
        is_active
        created_at
        updated_at
        relatedTo
        has_branch
        Orders {
          id
          total
          status
          created_at
          OrderID
          delivery_fee
          discount
          delivery_notes
          Ratings {
            id
            rating
            review
            reviewed_at
            delivery_experience
            packaging_quality
            professionalism
            User {
              name
              profile_picture
            }
          }
        }
        orgEmployees(where: { active: { _eq: true } }) {
          id
          fullnames
          email
          phone
          active
          Position
          roleType
          last_login
          Shops {
            id
            name
          }
        }
        Products {
          id
          quantity
          ProductName {
            name
          }
        }
      }
    }
  `;

  const GET_MAIN_RESTAURANT = `
    query GetMainRestaurant($businessId: uuid!) {
      Restaurants(where: { id: { _eq: $businessId } }) {
        id
        name
        description: location
        address: location
        phone
        is_active
        created_at
        updated_at
        relatedTo
        has_branch
        Orders: restaurant_orders {
          id
          total
          status
          created_at
          OrderID
          delivery_fee
          delivery_notes
          Ratings {
            id
            rating
            review
            reviewed_at
            User {
              name
              profile_picture
            }
          }
        }
        orgEmployees(where: { active: { _eq: true } }) {
          id
          fullnames
          email
          phone
          active
          Position
          roleType
          last_login
          Shops: Restaurants {
            id
            name
          }
        }
        Products: restaurant_dishes {
          id
          quantity
          ProductName: dishes {
            name
          }
        }
      }
    }
  `;

  const GET_BRANCH_SHOPS = `
    query getBranchwhereName($businessName: String = "") {
      Shops(where: { relatedTo: { _eq: $businessName } }) {
        id
        name
        description
        address
        phone
        is_active
        created_at
        updated_at
        relatedTo
        has_branch
        Orders {
          id
          total
          status
          created_at
          OrderID
          delivery_fee
          discount
          delivery_notes
          Ratings {
            id
            rating
            review
            reviewed_at
            delivery_experience
            packaging_quality
            professionalism
            User {
              name
              profile_picture
            }
          }
        }
        orgEmployees(where: { active: { _eq: true } }) {
          id
          fullnames
          email
          phone
          active
          Position
          roleType
          last_login
          Shops {
            id
            name
          }
        }
        Products {
          id
          quantity
          ProductName {
            name
          }
        }
      }
    }
  `;

  const GET_BRANCH_RESTAURANTS = `
    query getBranchwhereName($businessName: String = "") {
      Restaurants(where: { relatedTo: { _eq: $businessName } }) {
        id
        name
        description: location
        address: location
        phone
        is_active
        created_at
        updated_at
        relatedTo
        has_branch
        Orders: restaurant_orders {
          id
          total
          status
          created_at
          OrderID
          delivery_fee
          delivery_notes
          Ratings {
            id
            rating
            review
            reviewed_at
            User {
              name
              profile_picture
            }
          }
        }
        orgEmployees(where: { active: { _eq: true } }) {
          id
          fullnames
          email
          phone
          active
          Position
          roleType
          last_login
          Shops: Restaurants {
            id
            name
          }
        }
        Products: restaurant_dishes {
          id
          quantity
          ProductName: dishes {
            name
          }
        }
      }
    }
  `;

  const mainQuery = isRestaurant ? GET_MAIN_RESTAURANT : GET_MAIN_SHOP;
  const branchQuery = isRestaurant ? GET_BRANCH_RESTAURANTS : GET_BRANCH_SHOPS;

  const {
    data: mainShopData,
    isLoading: mainShopLoading,
    error: mainShopError,
  } = useQuery({
    queryKey: ['mainShop', currentBusinessId, isRestaurant],
    queryFn: () => hasuraRequest(mainQuery, { businessId: currentBusinessId }),
    enabled: !!currentBusinessId,
  });

  const mainShopList = mainShopData && typeof mainShopData === 'object' ? (isRestaurant ? (mainShopData as any).Restaurants : (mainShopData as any).Shops) : null;
  const mainShop = Array.isArray(mainShopList) ? mainShopList[0] : null;
  const mainBusinessName = mainShop?.name;
  const hasBranch = !!mainShop?.has_branch;

  const {
    data,
    isLoading: queryLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['branchShops', mainBusinessName, isRestaurant],
    queryFn: () => hasuraRequest(branchQuery, { businessName: mainBusinessName }),
    enabled: !!mainBusinessName,
  });

  useEffect(() => {
    if (mainShopLoading || queryLoading) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsLoading(false);
    }

    if (mainShopError) {
      setError(mainShopError.message);
    } else if (queryError) {
      setError(queryError.message);
    }

    const allShops = [];

    if (mainShop) {
      allShops.push(mainShop);
    }

    const branchList = data && typeof data === 'object' ? (isRestaurant ? (data as any).Restaurants : (data as any).Shops) : null;
    if (Array.isArray(branchList)) {
      allShops.push(...branchList);
    }

    if (allShops.length > 0) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const currentMonthStr = todayStr.substring(0, 7);

      const shops = allShops.map((shop: any) => {
        const orders = shop.Orders || [];
        let shopTotalRevenue = 0;
        let shopMonthlyRevenue = 0;
        let shopTotalOrders = 0;
        let shopMonthlyOrders = 0;
        let shopTodaySales = 0;

        orders.forEach((order: any) => {
          if (isRestaurant) {
            if (order.status === 'pending' || order.status === 'PENDING') return;
          } else {
            if (order.status === 'accepted' || order.status === 'shopping' || order.status === 'pending' || order.status === 'PENDING') return;
          }

          const dateStr = order.created_at || order.created_on;
          if (!dateStr) return;
          const orderDate = dateStr.split('T')[0];
          const orderMonth = orderDate.substring(0, 7);
          const amt = parseFloat(order.total) || 0;

          shopTotalRevenue += amt;
          shopTotalOrders++;

          if (orderMonth === currentMonthStr) {
            shopMonthlyRevenue += amt;
            shopMonthlyOrders++;
          }

          if (orderDate === todayStr) {
            shopTodaySales += amt;
          }
        });

        const ratings = orders.flatMap((order: any) => order.Ratings || []);
        const averageRating =
          ratings.length > 0
            ? ratings.reduce(
                (sum: number, rating: any) => sum + parseFloat(rating.rating || '0'),
                0
              ) / ratings.length
            : 0;

        const target = 50000;
        const performance = target > 0 ? (shopMonthlyRevenue / target) * 100 : 0;

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
          has_branch: shop.has_branch,
          totalRevenue: shopTotalRevenue,
          monthlyRevenue: shopMonthlyRevenue,
          totalOrders: shopTotalOrders,
          monthlyOrders: shopMonthlyOrders,
          todaySales: shopTodaySales,
          averageRating,
          performance,
          trend,
          Orders: shop.Orders || [],
          orgEmployees: shop.orgEmployees || [],
          Products: shop.Products || [],
        };
      });

      setBranchShops(shops);
    }
  }, [data, queryLoading, queryError, mainShopData, mainShopLoading, mainShopError, mainShop, isRestaurant]);

  const totalRevenue = branchShops.reduce((sum, shop) => sum + shop.totalRevenue, 0);
  const monthlyRevenue = branchShops.reduce((sum, shop) => sum + shop.monthlyRevenue, 0);
  const totalOrders = branchShops.reduce((sum, shop) => sum + shop.totalOrders, 0);
  const monthlyOrders = branchShops.reduce((sum, shop) => sum + shop.monthlyOrders, 0);
  const todaySalesTotal = branchShops.reduce((sum, shop) => sum + shop.todaySales, 0);
  const averagePerformance =
    branchShops.length > 0
      ? branchShops.reduce((sum, shop) => sum + shop.performance, 0) / branchShops.length
      : 0;

  return {
    branchShops,
    isLoading,
    error,
    totalRevenue,
    monthlyRevenue,
    totalOrders,
    monthlyOrders,
    todaySalesTotal,
    averagePerformance,
  };
}
