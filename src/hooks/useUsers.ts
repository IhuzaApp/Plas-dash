import { useQuery } from '@tanstack/react-query';
import { hasuraRequest } from '@/lib/hasura';
import { GET_USER_DETAILS, GET_TICKET_SHOPPER_DETAILS } from '@/lib/graphql/queries';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
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

export function useUserDetails(userId: string | undefined) {
  return useQuery<{ Users_by_pk: User | null }>({
    queryKey: ['user', userId],
    queryFn: () => hasuraRequest(GET_USER_DETAILS, { userId }),
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