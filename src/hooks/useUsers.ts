import { useQuery } from '@tanstack/react-query';
import { hasuraRequest } from '@/lib/hasura';
import { GET_USER_DETAILS, GET_TICKET_SHOPPER_DETAILS } from '@/lib/graphql/queries';
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

const GET_USER_BY_ID = `
  query GetUserById($id: uuid!) {
    Users_by_pk(id: $id) {
      email
      created_at
      id
      gender
      is_active
      name
      Addresses {
        city
        created_at
        id
        latitude
        is_default
        longitude
        postal_code
        street
        updated_at
        user_id
      }
      Invoices {
        created_at
        customer_id
        delivery_fee
        discount
        id
        invoice_items
        invoice_number
        order_id
        service_fee
        status
        subtotal
        tax
        total_amount
      }
      Wallets {
        available_balance
        id
        last_updated
        reserved_balance
        shopper_id
      }
      password_hash
      phone
      profile_picture
      role
      updated_at
      shopper {
        Employment_id
        active
        address
        background_check_completed
        created_at
        driving_license
        full_name
        id
        national_id
        onboarding_step
        phone_number
        profile_photo
        status
        transport_mode
        updated_at
        user_id
      }
      Orders {
        OrderID
        combined_order_id
        created_at
        delivery_address_id
        delivery_fee
        delivery_notes
        delivery_photo_url
        delivery_time
        discount
        found
        id
        service_fee
        shop_id
        shopper_id
        status
        total
        updated_at
        user_id
        voucher_code
      }
      Shopper_Availabilities {
        created_at
        day_of_week
        end_time
        id
        is_available
        start_time
        updated_at
        user_id
      }
    }
  }
`;

export function useUserDetails(userId?: string) {
  return useQuery<{ Users_by_pk: User | null }, Error>({
    queryKey: ['user', userId],
    queryFn: () => hasuraRequest(GET_USER_BY_ID, { id: userId }),
    enabled: !!userId,
    select: (data) => ({
      Users_by_pk: data.Users_by_pk ? {
        ...data.Users_by_pk,
        Addresses: data.Users_by_pk.Addresses || [],
        Invoices: data.Users_by_pk.Invoices || [],
        Wallets: data.Users_by_pk.Wallets || [],
        Orders: data.Users_by_pk.Orders || [],
        Shopper_Availabilities: data.Users_by_pk.Shopper_Availabilities || []
      } : null
    })
  });
}

export function useShopperDetails(shopperId: string | undefined) {
  return useQuery<ShopperResponse>({
    queryKey: ['shopper', shopperId],
    queryFn: () => hasuraRequest(GET_TICKET_SHOPPER_DETAILS, { shopperId }),
    enabled: !!shopperId,
  });
} 