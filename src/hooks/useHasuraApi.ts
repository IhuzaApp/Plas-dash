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
  GET_ALL_REFUNDS,
  GET_CATEGORIES,
  GET_SHOP_BY_ID,
  GET_SHOPPERS,
  GET_SYSTEM_CONFIG,
  GET_ORG_EMPLOYEES_BY_SHOP,
} from '../lib/graphql/queries';
import {
  ADD_CART,
  ADD_ITEMS_TO_CART,
  ADD_INVOICE_DETAILS,
  CREATE_WALLET,
  UPDATE_WALLET_BALANCES,
  CREATE_WALLET_TRANSACTION,
  CREATE_MULTIPLE_WALLET_TRANSACTIONS,
  REGISTER_SHOPPER,
  ADD_PRODUCT,
  UPDATE_PRODUCT,
  ADD_ORG_EMPLOYEE,
  ADD_ORG_EMPLOYEE_ID,
  UPDATE_ORG_EMPLOYEE_ROLE,
  UPDATE_ORG_EMPLOYEE,
  DELETE_ORG_EMPLOYEE,
} from '../lib/graphql/mutations';

// Import types
import type {
  User,
  Product,
  Order,
  Cart,
  Address,
  Invoice,
  Wallet,
  WalletTransaction,
  Refund,
} from './useGraphql';

interface Category {
  id: string;
  name: string;
  is_active: boolean;
}

interface Shop {
  id: string;
  name: string;
  category_id: string;
  category: {
    id: string;
    name: string;
  } | null;
  Products_aggregate: {
    aggregate: {
      count: number;
    };
  };
  Orders_aggregate: {
    aggregate: {
      count: number;
    };
  };
  is_active: boolean;
  Orders: Array<{
    id: string;
    OrderID: string;
    status: string;
    total: string;
    created_at: string;
    delivery_fee: string;
    service_fee: string;
    User: {
      id: string;
      name: string;
      email: string;
    };
    Order_Items: Array<{
      id: string;
      quantity: number;
      price: string;
      Product: {
        name: string;
      };
    }>;
  }>;
}

interface ShopProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  quantity: number;
  measurement_unit: string;
  image: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  has_commission: boolean;
  commission_percentage: number | null;
  final_price: string;
  total: string;
}

interface ShopDetails extends Shop {
  description: string;
  address: string;
  operating_hours: string;
  latitude: number;
  longitude: number;
  image: string;
  created_at: string;
  updated_at: string;
  Products: ShopProduct[];
  Orders: Array<{
    id: string;
    OrderID: string;
    status: string;
    total: string;
    created_at: string;
    updated_at: string;
    delivery_fee: string;
    service_fee: string;
    User: {
      id: string;
      name: string;
      email: string;
      phone: string;
    };
    Order_Items: Array<{
      id: string;
      quantity: number;
      price: string;
      Product: {
        name: string;
        image: string;
      };
    }>;
    Address: {
      street: string;
      city: string;
      postal_code: string;
    };
  }>;
}

interface Shopper {
  Employment_id: string;
  address: string;
  background_check_completed: boolean;
  created_at: string;
  driving_license: string | null;
  full_name: string;
  id: string;
  national_id: string;
  onboarding_step: string;
  phone_number: string;
  profile_photo: string | null;
  status: string;
  transport_mode: string;
  updated_at: string;
  user_id: string;
  active: boolean;
  User: {
    id: string;
    email: string;
    is_active: boolean;
  };
}

interface OrderType {
  id: string;
  user_id: string;
  shopper_id: string;
  total: string;
  status: string;
  delivery_address_id: string;
  delivery_photo_url: string;
  delivery_notes: string;
  created_at: string;
  updated_at: string;
  delivery_time: string | null;
  combined_order_id: string | null;
  OrderID: string;
  shop_id: string;
  delivery_fee: string;
  service_fee: string;
  discount: string;
  voucher_code: string | null;
  User: {
    id: string;
    name: string;
    email: string;
  };
  Order_Items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    price: string;
  }>;
  Address: {
    street: string;
    city: string;
    postal_code: string;
  };
}

export interface SystemConfig {
  baseDeliveryFee: number;
  currency: string;
  discounts: any;
  id: string;
  serviceFee: number;
  shoppingTime: number;
  unitsSurcharge: number;
  extraUnits: number;
  cappedDistanceFee: number;
  distanceSurcharge: number;
  suggestedMinimumTip: number;
  rushHourSurcharge: number;
  rushHours: string;
  productCommissionPercentage: number;
  deliveryCommissionPercentage: number;
  enableRush: boolean;
  allowScheduledDeliveries: boolean;
}

// Type-safe hook for Users
export function useUsers() {
  return useQuery<{ Users: User[] }, Error>({
    queryKey: ['users'],
    queryFn: () => hasuraRequest(GET_USERS, {}),
    select: data => ({
      Users: data.Users.map(user => ({
        ...user,
        Addresses: user.Addresses || [],
        Invoices: user.Invoices || [],
        Wallets: user.Wallets || [],
        shopper: user.shopper || null,
      })),
    }),
  });
}

// Type-safe hook for Products
export function useProducts() {
  return useQuery<{ Products: Product[] }, Error>({
    queryKey: ['products'],
    queryFn: () => hasuraRequest(GET_PRODUCTS, {}),
  });
}

// Type-safe hook for Shops
export function useShops() {
  return useQuery<{ Shops: Shop[] }, Error>({
    queryKey: ['shops'],
    queryFn: () => hasuraRequest(GET_SHOPS, {}),
    retry: 2,
    retryDelay: 1000,
  });
}

// Type-safe hook for Orders
export function useOrders() {
  return useQuery<{ Orders: OrderType[] }, Error>({
    queryKey: ['orders'],
    queryFn: () => hasuraRequest(GET_ORDERS, {}),
  });
}

// Type-safe hook for Carts
export function useCarts() {
  return useQuery<{ Carts: Cart[] }, Error>({
    queryKey: ['carts'],
    queryFn: () => hasuraRequest(GET_CARTS, {}),
  });
}

// Type-safe hook for Addresses
export function useAddresses() {
  return useQuery<{ Addresses: Address[] }, Error>({
    queryKey: ['addresses'],
    queryFn: () => hasuraRequest(GET_ADDRESSES, {}),
  });
}

// Type-safe hook for Invoices
export function useInvoices() {
  return useQuery<{ Invoices: Invoice[] }, Error>({
    queryKey: ['invoices'],
    queryFn: () => hasuraRequest(GET_INVOICE_DETAILS, {}),
  });
}

// Type-safe hook for Wallets
export function useWallets() {
  return useQuery<{ Wallets: Wallet[] }, Error>({
    queryKey: ['wallets'],
    queryFn: () => hasuraRequest(GET_ALL_WALLETS, {}),
  });
}

// Type-safe hook for Shopper's wallet
export function useShopperWallet(shopperId: string) {
  return useQuery<{ Wallets: Wallet[] }, Error>({
    queryKey: ['wallet', shopperId],
    queryFn: () => hasuraRequest(GET_SHOPPER_WALLET, { shopper_id: shopperId }),
  });
}

// Type-safe hook for Wallet Transactions
export function useWalletTransactions() {
  return useQuery<{ Wallet_Transactions: WalletTransaction[] }, Error>({
    queryKey: ['wallet-transactions'],
    queryFn: () => hasuraRequest(GET_ALL_WALLET_TRANSACTIONS, {}),
  });
}

// Type-safe hook for Refunds
export function useRefunds() {
  return useQuery<{ Refunds: Refund[] }, Error>({
    queryKey: ['refunds'],
    queryFn: () => hasuraRequest(GET_ALL_REFUNDS, {}),
  });
}

// Type-safe mutation hooks
export function useAddCart() {
  return useMutation<
    { insert_Carts: { affected_rows: number } },
    Error,
    { total: string; shop_id: string; user_id: string }
  >({
    mutationFn: variables => hasuraRequest(ADD_CART, variables),
  });
}

export function useAddItemsToCart() {
  return useMutation<
    { insert_Carts: { affected_rows: number } },
    Error,
    { total: string; is_active: boolean; shop_id: string; user_id: string }
  >({
    mutationFn: variables => hasuraRequest(ADD_ITEMS_TO_CART, variables),
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
    mutationFn: variables => hasuraRequest(ADD_INVOICE_DETAILS, variables),
  });
}

export function useCreateWallet() {
  return useMutation<{ insert_Wallets_one: Wallet }, Error, { shopper_id: string }>({
    mutationFn: variables => hasuraRequest(CREATE_WALLET, variables),
  });
}

export function useUpdateWalletBalances() {
  return useMutation<
    { update_Wallets_by_pk: Wallet },
    Error,
    { wallet_id: string; available_balance: string; reserved_balance: string }
  >({
    mutationFn: variables => hasuraRequest(UPDATE_WALLET_BALANCES, variables),
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
    mutationFn: variables => hasuraRequest(CREATE_WALLET_TRANSACTION, variables),
  });
}

export function useCreateMultipleWalletTransactions() {
  return useMutation<
    { insert_Wallet_Transactions: { returning: WalletTransaction[]; affected_rows: number } },
    Error,
    { transactions: any[] }
  >({
    mutationFn: variables => hasuraRequest(CREATE_MULTIPLE_WALLET_TRANSACTIONS, variables),
  });
}

export function useRegisterShopper() {
  return useMutation<
    {
      insert_shoppers_one: { id: string; status: string; active: boolean; onboarding_step: string };
    },
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
    mutationFn: variables => hasuraRequest(REGISTER_SHOPPER, variables),
  });
}

// Type-safe hook for Categories
export function useCategories() {
  return useQuery<{ Categories: Category[] }, Error>({
    queryKey: ['categories'],
    queryFn: () => hasuraRequest(GET_CATEGORIES, {}),
  });
}

// Type-safe hook for Shop details
export function useShopById(id: string) {
  return useQuery<{ Shops_by_pk: ShopDetails }, Error>({
    queryKey: ['shop', id],
    queryFn: () => hasuraRequest(GET_SHOP_BY_ID, { id }),
    enabled: !!id,
  });
}

// Type-safe hook for Shoppers
export function useShoppers() {
  return useQuery<{ shoppers: Shopper[] }, Error>({
    queryKey: ['shoppers'],
    queryFn: () => hasuraRequest(GET_SHOPPERS, {}),
  });
}

// Type-safe hook for adding a product
export function useAddProduct() {
  return useMutation<
    { insert_Products_one: ShopProduct },
    Error,
    {
      name: string;
      description?: string;
      price: string;
      quantity: number;
      measurement_unit: string;
      shop_id: string;
      category: string;
      barcode?: string;
      sku?: string;
      reorder_point?: number;
      supplier?: string;
      is_active?: boolean;
      has_commission?: boolean;
      commission_percentage?: number;
      final_price: string;
      total: string;
    }
  >({
    mutationFn: variables => hasuraRequest(ADD_PRODUCT, variables),
  });
}

// Type-safe hook for updating a product
export function useUpdateProduct() {
  return useMutation<
    { update_Products_by_pk: ShopProduct },
    Error,
    {
      id: string;
      name?: string;
      description?: string;
      price?: string;
      quantity?: number;
      measurement_unit?: string;
      final_price?: string;
    }
  >({
    mutationFn: variables => hasuraRequest(UPDATE_PRODUCT, variables),
  });
}

// Type-safe hook for system configuration
export function useSystemConfig() {
  return useQuery<{ System_configuratioins: SystemConfig[] }, Error>({
    queryKey: ['system-config'],
    queryFn: () => hasuraRequest(GET_SYSTEM_CONFIG, {}),
    staleTime: Infinity, // Configuration rarely changes, so we can cache it indefinitely
  });
}

// Staff Management Types
export interface OrgEmployee {
  id: string;
  employeeID: string;
  fullnames: string;
  email: string;
  phone: string;
  Address: string;
  position: string;
  active: boolean;
  shop_id: string;
  restaurant_id: string | null;
  created_on: string;
  updated_on: string;
  dob: string;
  gender: string;
  multAuthEnabled: boolean;
  orgEmployeeRoles: OrgEmployeeRole[];
  Shops: {
    id: string;
    name: string;
  };
}

export interface OrgEmployeeRole {
  id: string;
  orgEmployeeID: string;
  privillages: {
    // Dashboard permissions
    dashboard: {
      view: boolean;
      edit: boolean;
    };
    // Point of Sale permissions
    pos: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
      checkout: boolean;
      refund: boolean;
    };
    // Product management permissions
    products: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
    };
    // Order management permissions
    orders: {
      view: boolean;
      edit: boolean;
      delete: boolean;
    };
    // Customer management permissions
    customers: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
    };
    // Inventory management permissions
    inventory: {
      view: boolean;
      edit: boolean;
      stock: boolean;
    };
    // Sales reports permissions
    reports: {
      view: boolean;
      export: boolean;
    };
    // Settings permissions (shop-specific)
    settings: {
      view: boolean;
      edit: boolean;
    };
    // Staff management permissions
    staff: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
    };
    // System admin permissions
    systemAdmin: boolean;
    // Global admin permissions
    globalAdmin: boolean;
  };
  created_on: string;
  update_on: string;
}

// Default role templates
export const DEFAULT_ROLES = {
  globalAdmin: {
    dashboard: { view: true, edit: true },
    pos: { view: true, create: true, edit: true, delete: true, checkout: true, refund: true },
    products: { view: true, create: true, edit: true, delete: true },
    orders: { view: true, edit: true, delete: true },
    customers: { view: true, create: true, edit: true, delete: true },
    inventory: { view: true, edit: true, stock: true },
    reports: { view: true, export: true },
    settings: { view: true, edit: true },
    staff: { view: true, create: true, edit: true, delete: true },
    systemAdmin: true,
    globalAdmin: true,
  },
  systemAdmin: {
    dashboard: { view: true, edit: true },
    pos: { view: true, create: true, edit: true, delete: false, checkout: true, refund: true },
    products: { view: true, create: true, edit: true, delete: true },
    orders: { view: true, edit: true, delete: false },
    customers: { view: true, create: true, edit: true, delete: false },
    inventory: { view: true, edit: true, stock: true },
    reports: { view: true, export: true },
    settings: { view: true, edit: false },
    staff: { view: true, create: true, edit: true, delete: false },
    systemAdmin: true,
    globalAdmin: false,
  },
  basicAdmin: {
    dashboard: { view: true, edit: false },
    pos: { view: true, create: true, edit: false, delete: false, checkout: true, refund: false },
    products: { view: true, create: true, edit: true, delete: false },
    orders: { view: true, edit: true, delete: false },
    customers: { view: true, create: true, edit: true, delete: false },
    inventory: { view: true, edit: false, stock: true },
    reports: { view: true, export: false },
    settings: { view: true, edit: false },
    staff: { view: true, create: false, edit: false, delete: false },
    systemAdmin: false,
    globalAdmin: false,
  },
};

// Type-safe hook for getting employees by shop
export function useEmployeesByShop(shopId: string) {
  return useQuery<{ orgEmployees: OrgEmployee[] }, Error>({
    queryKey: ['employees', shopId],
    queryFn: () => hasuraRequest(GET_ORG_EMPLOYEES_BY_SHOP, { shop_id: shopId }),
    enabled: !!shopId,
  });
}

// Type-safe hook for adding an employee
export function useAddEmployee() {
  return useMutation<
    { insert_orgEmployees: { affected_rows: number; returning: OrgEmployee[] } },
    Error,
    {
      fullnames: string;
      email: string;
      phone: string;
      Address: string;
      position: string;
      password: string;
      shop_id: string;
      dob?: string;
      gender?: string;
    }
  >({
    mutationFn: variables => hasuraRequest(ADD_ORG_EMPLOYEE, variables),
  });
}

// Type-safe hook for adding employee role
export function useAddEmployeeRole() {
  return useMutation<
    { insert_orgEmployeeRoles: { affected_rows: number } },
    Error,
    {
      orgEmployeeID: string;
      privillages: OrgEmployeeRole['privillages'];
    }
  >({
    mutationFn: variables => hasuraRequest(ADD_ORG_EMPLOYEE_ID, variables),
  });
}

// Type-safe hook for updating employee role
export function useUpdateEmployeeRole() {
  return useMutation<
    { update_orgEmployeeRoles: { affected_rows: number } },
    Error,
    {
      id: string;
      privillages: OrgEmployeeRole['privillages'];
    }
  >({
    mutationFn: variables => hasuraRequest(UPDATE_ORG_EMPLOYEE_ROLE, variables),
  });
}

// Type-safe hook for updating employee
export function useUpdateEmployee() {
  return useMutation<
    { update_orgEmployees: { affected_rows: number } },
    Error,
    {
      id: string;
      fullnames: string;
      email: string;
      phone: string;
      Address: string;
      position: string;
      active: boolean;
    }
  >({
    mutationFn: variables => hasuraRequest(UPDATE_ORG_EMPLOYEE, variables),
  });
}

// Type-safe hook for deleting employee
export function useDeleteEmployee() {
  return useMutation<
    { delete_orgEmployees: { affected_rows: number } },
    Error,
    { id: string }
  >({
    mutationFn: variables => hasuraRequest(DELETE_ORG_EMPLOYEE, variables),
  });
}
