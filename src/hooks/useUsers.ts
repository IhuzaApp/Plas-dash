import { useQuery } from '@tanstack/react-query';
import { hasuraRequest } from '@/lib/hasura';
import { apiGet } from '@/lib/api';
import { GET_TICKET_SHOPPER_DETAILS } from '@/lib/graphql/queries';
import { User } from './useGraphql';

interface Shopper {
  id: string;
  rating: number;
  total_orders: number;
  transport_mode: string;
  background_check_completed: boolean;
  Employment_id: string;
}

interface Order {
  id: string;
  OrderID: string;
  status: string;
  total: string;
  created_at: string;
}

interface ActivityLog {
  id: string;
  type: string;
  description: string;
  created_at: string;
}

interface ShopperResponse {
  shoppers: Array<{
    id: string;
    full_name: string;
    phone_number: string;
    profile_photo: string | null;
    transport_mode: string;
    User: {
      id: string;
      name: string;
      email: string;
      phone: string;
      created_at: string;
    };
    Ratings_aggregate: {
      aggregate: {
        avg: {
          rating: number;
        };
      };
    };
    Orders_aggregate: {
      aggregate: {
        count: number;
      };
    };
  }>;
}

export function useUserDetails(userId?: string) {
  return useQuery<{ Users_by_pk: User | null }, Error>({
    queryKey: ['api', 'user', userId],
    queryFn: async () => {
      const res = await apiGet<{ user: User | null }>(`/api/queries/users/${userId}`);
      const user = res.user;
      if (!user) return { Users_by_pk: null };
      return {
        Users_by_pk: {
          ...user,
          Addresses: user.Addresses ?? [],
          Invoices: user.Invoices ?? [],
          Wallets: user.Wallets ?? [],
          Orders: user.Orders ?? [],
          Shopper_Availabilities: user.Shopper_Availabilities ?? [],
        },
      };
    },
    enabled: !!userId,
  });
}

export function useShopperDetails(shopperId: string | undefined) {
  return useQuery<ShopperResponse>({
    queryKey: ['shopper', shopperId],
    queryFn: () => hasuraRequest(GET_TICKET_SHOPPER_DETAILS, { shopperId }),
    enabled: !!shopperId,
  });
}
