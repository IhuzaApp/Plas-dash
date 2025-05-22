import { useGraphqlQuery, useGraphqlMutation, User, Product, Shop, Order, Cart, Address, Invoice, Wallet, WalletTransaction, Refund } from './useGraphql';
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

// Type-safe hook for Users
export function useUsers() {
  return useGraphqlQuery<{ Users: User[] }>(GET_USERS);
}

// Type-safe hook for Products
export function useProducts() {
  return useGraphqlQuery<{ Products: Product[] }>(GET_PRODUCTS);
}

// Type-safe hook for Shops
export function useShops() {
  return useGraphqlQuery<{ Shops: Shop[] }>(GET_SHOPS);
}

// Type-safe hook for Orders
export function useOrders() {
  return useGraphqlQuery<{ Orders: Order[] }>(GET_ORDERS);
}

// Type-safe hook for Carts
export function useCarts() {
  return useGraphqlQuery<{ Carts: Cart[] }>(GET_CARTS);
}

// Type-safe hook for Addresses
export function useAddresses() {
  return useGraphqlQuery<{ Addresses: Address[] }>(GET_ADDRESSES);
}

// Type-safe hook for Invoices
export function useInvoices() {
  return useGraphqlQuery<{ Invoices: Invoice[] }>(GET_INVOICE_DETAILS);
}

// Type-safe hook for Wallets
export function useWallets() {
  return useGraphqlQuery<{ Wallets: Wallet[] }>(GET_ALL_WALLETS);
}

// Type-safe hook for Shopper's wallet
export function useShopperWallet(shopperId: string) {
  return useGraphqlQuery<{ Wallets: Wallet[] }>(GET_SHOPPER_WALLET, {
    variables: { shopper_id: shopperId }
  });
}

// Type-safe hook for Wallet Transactions
export function useWalletTransactions() {
  return useGraphqlQuery<{ Wallet_Transactions: WalletTransaction[] }>(GET_ALL_WALLET_TRANSACTIONS);
}

// Type-safe hook for Refunds
export function useRefunds() {
  return useGraphqlQuery<{ Refunds: Refund[] }>(GET_ALL_REFUNDS);
}

// Type-safe mutation hooks
export function useAddCart() {
  return useGraphqlMutation<
    { insert_Carts: { affected_rows: number } },
    { total: string; shop_id: string; user_id: string }
  >(ADD_CART);
}

export function useAddItemsToCart() {
  return useGraphqlMutation<
    { insert_Carts: { affected_rows: number } },
    { total: string; is_active: boolean; shop_id: string; user_id: string }
  >(ADD_ITEMS_TO_CART);
}

export function useAddInvoiceDetails() {
  return useGraphqlMutation<
    { insert_Invoices: { affected_rows: number } },
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
  >(ADD_INVOICE_DETAILS);
}

export function useCreateWallet() {
  return useGraphqlMutation<
    { insert_Wallets_one: Wallet },
    { shopper_id: string }
  >(CREATE_WALLET);
}

export function useUpdateWalletBalances() {
  return useGraphqlMutation<
    { update_Wallets_by_pk: Wallet },
    { wallet_id: string; available_balance: string; reserved_balance: string }
  >(UPDATE_WALLET_BALANCES);
}

export function useCreateWalletTransaction() {
  return useGraphqlMutation<
    { insert_Wallet_Transactions_one: WalletTransaction },
    {
      amount: string;
      type: string;
      status: string;
      wallet_id: string;
      related_order_id?: string;
    }
  >(CREATE_WALLET_TRANSACTION);
}

export function useRegisterShopper() {
  return useGraphqlMutation<
    { insert_shoppers_one: { id: string; status: string; active: boolean; onboarding_step: string } },
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
  >(REGISTER_SHOPPER);
} 