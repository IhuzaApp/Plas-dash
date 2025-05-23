import { useQuery, useMutation } from '@tanstack/react-query';
import { hasuraRequest } from '../lib/hasura';
import {
  GET_USERS,
  GET_PRODUCTS,
  GET_SHOPS,
  GET_ORDERS,
  GET_CARTS,
  GET_ADDRESSES,
  GET_INVOICE_DETAILS,
  GET_ALL_WALLETS,
  GET_SHOPPER_WALLET,
  GET_ALL_WALLET_TRANSACTIONS,
  GET_ALL_REFUNDS
} from '../lib/graphql/queries';
import {
  ADD_CART,
  ADD_ITEMS_TO_CART,
  ADD_INVOICE_DETAILS,
  CREATE_WALLET,
  UPDATE_WALLET_BALANCES,
  CREATE_WALLET_TRANSACTION,
  CREATE_MULTIPLE_WALLET_TRANSACTIONS,
  REGISTER_SHOPPER
} from '../lib/graphql/mutations';

// Import types
import type { User, Product, Shop, Order, Cart, Address, Invoice, Wallet, WalletTransaction, Refund } from './useGraphql';

// Type-safe hook for Users
export function useUsers() {
  return useQuery<{ Users: User[] }, Error>({
    queryKey: ['users'],
    queryFn: () => hasuraRequest(GET_USERS, {})
  });
}

// Type-safe hook for Products
export function useProducts() {
  return useQuery<{ Products: Product[] }, Error>({
    queryKey: ['products'],
    queryFn: () => hasuraRequest(GET_PRODUCTS, {})
  });
}

// Type-safe hook for Shops
export function useShops() {
  return useQuery<{ Shops: Shop[] }, Error>({
    queryKey: ['shops'],
    queryFn: () => hasuraRequest(GET_SHOPS, {})
  });
}

// Type-safe hook for Orders
export function useOrders() {
  return useQuery<{ Orders: Order[] }, Error>({
    queryKey: ['orders'],
    queryFn: () => hasuraRequest(GET_ORDERS, {})
  });
}

// Type-safe hook for Carts
export function useCarts() {
  return useQuery<{ Carts: Cart[] }, Error>({
    queryKey: ['carts'],
    queryFn: () => hasuraRequest(GET_CARTS, {})
  });
}

// Type-safe hook for Addresses
export function useAddresses() {
  return useQuery<{ Addresses: Address[] }, Error>({
    queryKey: ['addresses'],
    queryFn: () => hasuraRequest(GET_ADDRESSES, {})
  });
}

// Type-safe hook for Invoices
export function useInvoices() {
  return useQuery<{ Invoices: Invoice[] }, Error>({
    queryKey: ['invoices'],
    queryFn: () => hasuraRequest(GET_INVOICE_DETAILS, {})
  });
}

// Type-safe hook for Wallets
export function useWallets() {
  return useQuery<{ Wallets: Wallet[] }, Error>({
    queryKey: ['wallets'],
    queryFn: () => hasuraRequest(GET_ALL_WALLETS, {})
  });
}

// Type-safe hook for Shopper's wallet
export function useShopperWallet(shopperId: string) {
  return useQuery<{ Wallets: Wallet[] }, Error>({
    queryKey: ['wallet', shopperId],
    queryFn: () => hasuraRequest(GET_SHOPPER_WALLET, { shopper_id: shopperId })
  });
}

// Type-safe hook for Wallet Transactions
export function useWalletTransactions() {
  return useQuery<{ Wallet_Transactions: WalletTransaction[] }, Error>({
    queryKey: ['wallet-transactions'],
    queryFn: () => hasuraRequest(GET_ALL_WALLET_TRANSACTIONS, {})
  });
}

// Type-safe hook for Refunds
export function useRefunds() {
  return useQuery<{ Refunds: Refund[] }, Error>({
    queryKey: ['refunds'],
    queryFn: () => hasuraRequest(GET_ALL_REFUNDS, {})
  });
}

// Type-safe mutation hooks
export function useAddCart() {
  return useMutation<
    { insert_Carts: { affected_rows: number } },
    Error,
    { total: string; shop_id: string; user_id: string }
  >({
    mutationFn: (variables) => hasuraRequest(ADD_CART, variables)
  });
}

export function useAddItemsToCart() {
  return useMutation<
    { insert_Carts: { affected_rows: number } },
    Error,
    { total: string; is_active: boolean; shop_id: string; user_id: string }
  >({
    mutationFn: (variables) => hasuraRequest(ADD_ITEMS_TO_CART, variables)
  });
}

export function useAddInvoiceDetails() {
  return useMutation<
    { insert_Invoices: { affected_rows: number } },
    Error,
    {
      customer_id: string;
      delivery_fee: string;
      discount: string;
      invoice_items: any;
      invoice_number: string;
      order_id: string;
      service_fee: string;
      status: string;
      subtotal: string;
      tax: string;
      total_amount: string;
    }
  >({
    mutationFn: (variables) => hasuraRequest(ADD_INVOICE_DETAILS, variables)
  });
}

export function useCreateWallet() {
  return useMutation<
    { insert_Wallets_one: Wallet },
    Error,
    { shopper_id: string }
  >({
    mutationFn: (variables) => hasuraRequest(CREATE_WALLET, variables)
  });
}

export function useUpdateWalletBalances() {
  return useMutation<
    { update_Wallets_by_pk: Wallet },
    Error,
    { wallet_id: string; available_balance: string; reserved_balance: string }
  >({
    mutationFn: (variables) => hasuraRequest(UPDATE_WALLET_BALANCES, variables)
  });
}

export function useCreateWalletTransaction() {
  return useMutation<
    { insert_Wallet_Transactions_one: WalletTransaction },
    Error,
    {
      amount: string;
      type: string;
      status: string;
      wallet_id: string;
      related_order_id?: string;
    }
  >({
    mutationFn: (variables) => hasuraRequest(CREATE_WALLET_TRANSACTION, variables)
  });
}

export function useCreateMultipleWalletTransactions() {
  return useMutation<
    { insert_Wallet_Transactions: { returning: WalletTransaction[]; affected_rows: number } },
    Error,
    { transactions: any[] }
  >({
    mutationFn: (variables) => hasuraRequest(CREATE_MULTIPLE_WALLET_TRANSACTIONS, variables)
  });
}

export function useRegisterShopper() {
  return useMutation<
    { insert_shoppers_one: { id: string; status: string; active: boolean; onboarding_step: string } },
    Error,
    {
      full_name: string;
      address: string;
      phone_number: string;
      national_id: string;
      driving_license?: string;
      transport_mode: string;
      profile_photo?: string;
      user_id: string;
    }
  >({
    mutationFn: (variables) => hasuraRequest(REGISTER_SHOPPER, variables)
  });
} 