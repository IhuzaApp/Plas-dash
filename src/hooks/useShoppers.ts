import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hasuraRequest } from '@/lib/hasura';
import { 
  GET_SHOPPER_ONBOARDING_DETAILS, 
  GET_SHOPPER_WALLET, 
  GET_SHOPPER_ORDERS,
  GET_ORDER_PAYMENTS,
  GET_SHOPPER_FULL_DETAILS
} from '@/lib/graphql/queries';
import { UPDATE_SHOPPER_STATUS } from '@/lib/graphql/mutations';

type uuid = string;

// Types for Shopper Details
interface User {
  id: uuid;
  name: string;
  email: string;
  phone: string;
  profile_picture: string;
  created_at: string;
  is_active: boolean;
}

interface Shopper {
  id: uuid;
  user_id: uuid;
  full_name: string;
  phone_number: string;
  Employment_id: string;
  profile_photo: string | null;
  transport_mode: string;
  active: boolean;
  status: string;
  background_check_completed: boolean;
  onboarding_step: string;
  created_at: string;
}

interface ShopperResponse {
  Users: User[];
  shoppers: Shopper[];
}

// Types for Shopper Wallet
interface Wallet {
  id: uuid;
  shopper_id: uuid;
  available_balance: string;
  reserved_balance: string;
  last_updated: string;
  Wallet_Transactions?: WalletTransaction[];
}

interface WalletResponse {
  Wallets: Wallet[];
}

// Types for Shopper Orders
export interface Order {
  id: uuid;
  OrderID: string;
  status: string;
  total: string;
  created_at: string;
  updated_at: string;
  delivery_time: string | null;
  delivery_fee: string;
  service_fee: string;
  discount: string;
  delivery_notes: string | null;
  delivery_photo_url: string | null;
  User: {
    name: string;
  };
  Shop: {
    id: uuid;
    name: string;
  };
  Address: {
    street: string;
    city: string;
    postal_code: string;
  };
}

interface OrdersResponse {
  Orders: Order[];
}

// Types for Order Payments
export interface WalletTransaction {
  id: string;
  amount: string;
  type: string;
  status: string;
  created_at: string;
  related_order_id?: string;
  Order?: {
    OrderID: string;
    status: string;
  };
}

export interface Refund {
  id: string;
  amount: string;
  reason: string;
  status: string;
  paid: boolean;
  created_at: string;
  update_on: string;
}

interface OrderPaymentsResponse {
  Wallet_Transactions: WalletTransaction[];
  Refunds: Refund[];
}

interface UpdateShopperStatusVariables {
  shopper_id: uuid;
  status: string;
  active: boolean;
  background_check_completed: boolean;
}

interface UpdateShopperStatusResponse {
  update_shoppers_by_pk: {
    id: uuid;
    status: string;
    active: boolean;
    background_check_completed: boolean;
  };
}

interface Rating {
  created_at: string;
  customer_id: string;
  delivery_experience: number;
  id: string;
  order_id: string;
  packaging_quality: number;
  professionalism: number;
  rating: number;
  review: string;
  reviewed_at: string;
  shopper_id: string;
  updated_at: string;
}

interface DetailedUser extends User {
  gender: string;
  role: string;
  Ratings: Rating[];
}

interface DetailedShopper extends Shopper {
  address: string;
  driving_license: string | null;
  national_id: string;
  User: DetailedUser;
}

interface ShopperFullDetailsResponse {
  shoppers: DetailedShopper[];
}

// Hook for fetching shopper details
export function useShopperDetails(userId: uuid) {
  return useQuery<ShopperResponse>({
    queryKey: ['shopper', userId],
    queryFn: () => hasuraRequest(GET_SHOPPER_ONBOARDING_DETAILS, { user_id: userId }),
    enabled: !!userId,
  });
}

// Hook for fetching shopper wallet
export function useShopperWallet(shopperId: uuid) {
  return useQuery<WalletResponse>({
    queryKey: ['shopper-wallet', shopperId],
    queryFn: () => hasuraRequest(GET_SHOPPER_WALLET, { shopper_id: shopperId }),
    enabled: !!shopperId,
  });
}

// Hook for fetching shopper orders
export function useShopperOrders(userId: uuid) {
  return useQuery<OrdersResponse>({
    queryKey: ['shopper-orders', userId],
    queryFn: () => hasuraRequest(GET_SHOPPER_ORDERS, { user_id: userId }),
    enabled: !!userId,
  });
}

// Hook for fetching order payments
export function useOrderPayments(orderId: uuid) {
  return useQuery<OrderPaymentsResponse>({
    queryKey: ['order-payments', orderId],
    queryFn: () => hasuraRequest(GET_ORDER_PAYMENTS, { order_id: orderId }),
    enabled: !!orderId,
  });
}

// Hook for updating shopper status
export function useUpdateShopperStatus() {
  const queryClient = useQueryClient();
  
  return useMutation<UpdateShopperStatusResponse, Error, UpdateShopperStatusVariables>({
    mutationFn: (variables) => hasuraRequest(UPDATE_SHOPPER_STATUS, variables),
    onSuccess: () => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['shopper'] });
    },
  });
}

// Hook for fetching detailed shopper information
export function useShopperFullDetails(userId: uuid) {
  return useQuery<ShopperFullDetailsResponse>({
    queryKey: ['shopper-full-details', userId],
    queryFn: () => hasuraRequest(GET_SHOPPER_FULL_DETAILS, { user_id: userId }),
    enabled: !!userId,
  });
} 