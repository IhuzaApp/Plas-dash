import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { request, gql } from 'graphql-request';

const HASURA_ENDPOINT = process.env.HASURA_GRAPHQL_URL || '';
const HASURA_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET || '';

// Generic query hook with better typing
export const useGraphqlQuery = <TData = any, TVariables extends Record<string, any> = Record<string, any>>(
  query: string,
  options?: Omit<UseQueryOptions<TData, Error, TData>, 'queryKey' | 'queryFn'> & {
    variables?: TVariables;
  }
) => {
  return useQuery<TData, Error>({
    queryKey: [query, options?.variables],
    queryFn: async () => {
      const response = await request<TData>(
        HASURA_ENDPOINT,
        gql`${query}`,
        options?.variables || {},
        {
          'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
        }
      );
      return response;
    },
    ...options,
  });
};

// Generic mutation hook with better typing
export const useGraphqlMutation = <TData = any, TVariables extends Record<string, any> = Record<string, any>>(
  mutation: string,
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>
) => {
  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables) => {
      const response = await request<TData>(
        HASURA_ENDPOINT,
        gql`${mutation}`,
        variables,
        {
          'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
        }
      );
      return response;
    },
    ...options,
  });
};

// Types for our GraphQL schema
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  password_hash?: string;
  created_at: string;
  updated_at: string;
  profile_picture?: string;
  is_active: boolean;
  gender?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  shop_id: string;
  price: string;
  quantity: number;
  measurement_unit: string;
  image: string;
  category: {
    id: string;
    name: string;
    description: string;
    image: string;
    is_active: boolean;
  };
  created_at: string;
  updated_at: string;
  is_active: boolean;
  Shop?: Shop;
  Order_Items?: OrderItem[];
  Cart_Items?: CartItem[];
}

export interface Shop {
  id: string;
  name: string;
  description: string;
  category: {
    id: string;
    name: string;
    description: string;
    image: string;
    is_active: boolean;
    created_at: string;
  };
  image: string;
  address: string;
  latitude: string;
  longitude: string;
  operating_hours: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  Products?: Product[];
  Orders?: {
    OrderID: string;
    id: string;
    found: boolean;
    discount: string;
    delivery_time: string;
    delivery_notes?: string;
    delivery_fee: string;
    delivery_address_id: string;
    created_at: string;
    combined_order_id?: string;
    delivery_photo_url?: string;
    updated_at: string;
    total: string;
    status: string;
    shopper_id: string;
    shop_id: string;
    service_fee: string;
    voucher_code?: string;
    user_id: string;
  }[];
}

export interface Order {
  id: string;
  user_id: string;
  shopper_id: string;
  total: string;
  status: string;
  delivery_address_id: string;
  delivery_photo_url?: string;
  delivery_notes?: string;
  created_at: string;
  updated_at: string;
  delivery_time: string;
  combined_order_id?: string;
  Address?: Address;
  Delivery_Issues?: DeliveryIssue[];
  Order_Items?: OrderItem[];
  delivery_fee: string;
  service_fee: string;
  discount: string;
  voucher_code?: string;
  OrderID: string;
  shop_id: string;
}

export interface Cart {
  id: string;
  user_id: string;
  total: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  shop_id: string;
  User?: User;
}

export interface Address {
  id: string;
  user_id: string;
  street: string;
  city: string;
  postal_code: string;
  latitude: string;
  longitude: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  customer_id: string;
  order_id: string;
  invoice_number: string;
  invoice_items: any; // JSON object
  subtotal: string;
  tax: string;
  discount: string;
  delivery_fee: string;
  service_fee: string;
  total_amount: string;
  status: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  shopper_id: string;
  available_balance: string;
  reserved_balance: string;
  last_updated: string;
  User?: User;
  Wallet_Transactions?: WalletTransaction[];
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  amount: string;
  type: string;
  status: string;
  related_order_id?: string;
  created_at: string;
  Wallet?: Wallet;
  Order?: Order;
}

export interface Refund {
  id: string;
  order_id: string;
  user_id: string;
  amount: string;
  reason: string;
  status: string;
  paid: boolean;
  generated_by: string;
  created_at: string;
  update_on: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  price: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryIssue {
  id: string;
  order_id: string;
  shopper_id: string;
  issue_type: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
} 