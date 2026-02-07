import { useQuery, useMutation } from '@tanstack/react-query';
import { hasuraRequest } from '../lib/hasura';
import { apiGet } from '../lib/api';
import {
  GET_PRODUCTS_BY_SHOP,
  GET_REEL_ORDERS,
  GET_RESTAURANTS,
  GET_REELS,
  GET_ADDRESSES,
  GET_INVOICE_DETAILS,
  GET_ALL_WALLETS,
  GET_SHOPPER_WALLET,
  GET_ALL_WALLET_TRANSACTIONS,
  GET_CATEGORIES,
  GET_SHOP_BY_ID,
  GET_SYSTEM_CONFIG,
  GET_ORG_EMPLOYEES_BY_SHOP,
  GET_POS_TRANSACTIONS,
  GET_PRODUCT_NAMES,
  SEARCH_PRODUCT_NAMES,
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
  ADD_PRODUCT_NAME,
  UPDATE_PRODUCT_NAME,
  GET_PRODUCT_NAME_BY_BARCODE,
  GET_PRODUCT_NAME_BY_SKU,
  ADD_ORG_EMPLOYEE,
  ADD_ORG_EMPLOYEE_ROLES,
  UPDATE_ORG_EMPLOYEE_ROLE,
  UPDATE_ORG_EMPLOYEE,
  DELETE_ORG_EMPLOYEE,
  ADD_RESTAURANT,
  ADD_REEL,
  UPDATE_REEL,
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

interface ProductName {
  id: string;
  name: string;
  description: string;
  barcode?: string;
  sku?: string;
  image: string;
  create_at: string;
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
  productName_id: string;
  price: string;
  quantity: number;
  measurement_unit: string;
  supplier?: string;
  reorder_point?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  final_price: string;
  ProductName: {
    id: string;
    name: string;
    description: string;
    barcode?: string;
    sku?: string;
    image: string;
    create_at: string;
  };
}

interface ShopDetails extends Shop {
  description: string;
  address: string;
  operating_hours: string;
  latitude: number;
  longitude: number;
  image: string;
  logo: string | null;
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

interface ReelOrder {
  id: string;
  OrderID: string;
  combined_order_id: string | null;
  created_at: string;
  delivery_address_id: string;
  delivery_fee: string;
  delivery_note: string;
  delivery_photo_url: string;
  delivery_time: string | null;
  discount: string;
  found: boolean;
  quantity: number;
  reel_id: string;
  service_fee: string;
  shopper_id: string | null;
  status: string;
  total: string;
  updated_at: string;
  user_id: string;
  voucher_code: string | null;
  Reel: {
    Price: string;
    Product: string;
    category: string;
    created_on: string;
    delivery_time: string;
    description: string;
    id: string;
    isLiked: boolean;
    likes: number;
    restaurant_id: string | null;
    shop_id: string | null;
    title: string;
    type: string;
    user_id: string | null;
    video_url: string;
  };
  Shoppers: {
    created_at: string;
    email: string;
    gender: string;
    id: string;
    is_active: boolean;
    name: string;
    phone: string;
    profile_picture: string;
    role: string;
    updated_at: string;
  } | null;
  Address: {
    city: string;
    created_at: string;
    id: string;
    is_default: boolean;
    latitude: number;
    longitude: number;
    postal_code: string;
    street: string;
    updated_at: string;
    user_id: string;
  };
}

interface Restaurant {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  lat: string;
  long: string;
  profile: string;
  logo: string;
  verified: boolean;
  is_active: boolean;
  relatedTo: string;
  tin: string;
  ussd: string;
  created_at: string;
}

interface Reel {
  id: string;
  title: string;
  description: string;
  video_url: string;
  category: string;
  type: string;
  Price: string;
  Product: any;
  delivery_time: string;
  isLiked: boolean;
  likes: number;
  is_active: boolean;
  restaurant_id: string | null;
  shop_id: string | null;
  user_id: string | null;
  created_on: string;
  Restaurant: Restaurant | null;
  Shops: {
    id: string;
    name: string;
    logo: string;
    address: string;
  } | null;
  User: {
    id: string;
    name: string;
    email: string;
    profile_picture: string;
  } | null;
  Reels_comments: Array<{
    id: string;
    text: string;
    user_id: string;
    created_on: string;
    isLiked: boolean;
    likes: number;
  }>;
  reel_likes: Array<{
    id: string;
    user_id: string;
    created_at: string;
  }>;
  reel_orders: Array<{
    id: string;
    OrderID: string;
    status: string;
    total: string;
    created_at: string;
  }>;
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

// Type-safe hook for Users (data from API)
export function useUsers() {
  return useQuery<{ Users: User[] }, Error>({
    queryKey: ['api', 'users'],
    queryFn: async () => {
      const res = await apiGet<{ users: any[] }>('/api/queries/users');
      return {
        Users: (res.users || []).map(user => ({
          ...user,
          Addresses: user.Addresses ?? [],
          Invoices: user.Invoices ?? [],
          Wallets: user.Wallets ?? [],
          shopper: user.shopper ?? null,
        })),
      };
    },
  });
}

// Type-safe hook for Products (data from API)
export function useProducts() {
  return useQuery<{ Products: Product[] }, Error>({
    queryKey: ['api', 'products'],
    queryFn: async () => {
      const res = await apiGet<{ products: Product[] }>('/api/queries/products');
      return { Products: res.products || [] };
    },
  });
}

// Type-safe hook for Products by Shop (for POS checkout)
export function useProductsByShop(shopId: string) {
  return useQuery<{ Products: Product[] }, Error>({
    queryKey: ['products', 'shop', shopId],
    queryFn: () => hasuraRequest(GET_PRODUCTS_BY_SHOP, { shop_id: shopId }),
    enabled: !!shopId,
  });
}

// Type-safe hook for Shops (data from API)
export function useShops() {
  return useQuery<{ Shops: Shop[] }, Error>({
    queryKey: ['api', 'shops'],
    queryFn: async () => {
      const res = await apiGet<{ shops: Shop[] }>('/api/queries/shops');
      return { Shops: res.shops || [] };
    },
    retry: 2,
    retryDelay: 1000,
  });
}

// Type-safe hook for Orders (data from API)
export function useOrders() {
  return useQuery<{ Orders: OrderType[] }, Error>({
    queryKey: ['api', 'orders'],
    queryFn: async () => {
      const res = await apiGet<{ orders: OrderType[] }>('/api/queries/orders');
      return { Orders: res.orders || [] };
    },
  });
}

// Type-safe hook for Carts (data from API)
export function useCarts() {
  return useQuery<{ Carts: Cart[] }, Error>({
    queryKey: ['api', 'carts'],
    queryFn: async () => {
      const res = await apiGet<{ carts: Cart[] }>('/api/queries/carts');
      return { Carts: res.carts || [] };
    },
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

// Type-safe hook for Refunds (data from API)
export function useRefunds() {
  return useQuery<{ Refunds: Refund[] }, Error>({
    queryKey: ['api', 'all-refunds'],
    queryFn: async () => {
      const res = await apiGet<{ refunds: Refund[] }>('/api/queries/all-refunds');
      return { Refunds: res.refunds || [] };
    },
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

// Type-safe hook for Shoppers (data from API)
export function useShoppers() {
  return useQuery<{ shoppers: Shopper[] }, Error>({
    queryKey: ['api', 'shoppers'],
    queryFn: async () => {
      const res = await apiGet<{ shoppers: Shopper[] }>('/api/queries/shoppers');
      return { shoppers: res.shoppers || [] };
    },
  });
}

// Type-safe hook for adding a product name
export function useAddProductName() {
  return useMutation<
    { insert_productNames_one: any },
    Error,
    {
      name: string;
      description?: string;
      barcode?: string;
      sku?: string;
      image?: string;
    }
  >({
    mutationFn: variables => hasuraRequest(ADD_PRODUCT_NAME, variables),
  });
}

// Type-safe hook for updating a product name
export function useUpdateProductName() {
  return useMutation<
    { update_productNames_by_pk: any },
    Error,
    {
      id: string;
      name?: string;
      description?: string;
      barcode?: string;
      sku?: string;
      image?: string;
    }
  >({
    mutationFn: variables => hasuraRequest(UPDATE_PRODUCT_NAME, variables),
  });
}

// Type-safe hook for getting product name by barcode
export function useGetProductNameByBarcode() {
  return useMutation<{ productNames: any[] }, Error, { barcode: string }>({
    mutationFn: variables => hasuraRequest(GET_PRODUCT_NAME_BY_BARCODE, variables),
  });
}

// Type-safe hook for getting product name by SKU
export function useGetProductNameBySku() {
  return useMutation<{ productNames: any[] }, Error, { sku: string }>({
    mutationFn: variables => hasuraRequest(GET_PRODUCT_NAME_BY_SKU, variables),
  });
}

export function useAddProduct() {
  return useMutation<
    { insert_Products_one: ShopProduct },
    Error,
    {
      productName_id: string;
      price: string;
      quantity: number;
      measurement_unit: string;
      shop_id: string;
      category: string;
      reorder_point?: number;
      supplier?: string;
      is_active?: boolean;
      final_price: string;
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
      price?: string;
      quantity?: number;
      measurement_unit?: string;
      final_price?: string;
      supplier?: string;
      reorder_point?: number;
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

// Type-safe hook for Product Names
export function useProductNames() {
  return useQuery<{ productNames: ProductName[] }, Error>({
    queryKey: ['product-names'],
    queryFn: () => hasuraRequest(GET_PRODUCT_NAMES, {}),
  });
}

// Type-safe hook for searching Product Names
export function useSearchProductNames(searchTerm: string) {
  return useQuery<{ productNames: ProductName[] }, Error>({
    queryKey: ['product-names', 'search', searchTerm],
    queryFn: () => hasuraRequest(SEARCH_PRODUCT_NAMES, { searchTerm: `%${searchTerm}%` }),
    enabled: searchTerm.length > 0,
  });
}

// Type-safe hook for Reel Orders
export function useReelOrders() {
  return useQuery<{ reel_orders: ReelOrder[] }, Error>({
    queryKey: ['reel-orders'],
    queryFn: () => hasuraRequest(GET_REEL_ORDERS, {}),
  });
}

// Type-safe hook for Restaurants
export function useRestaurants() {
  return useQuery<{ Restaurants: Restaurant[] }, Error>({
    queryKey: ['restaurants'],
    queryFn: () => hasuraRequest(GET_RESTAURANTS, {}),
  });
}

// Type-safe hook for Reels
export function useReels() {
  return useQuery<{ Reels: Reel[] }, Error>({
    queryKey: ['reels'],
    queryFn: () => hasuraRequest(GET_REELS, {}),
  });
}

// Type-safe hook for adding a restaurant
export function useAddRestaurant() {
  return useMutation<
    { insert_Restaurants_one: any },
    Error,
    {
      name: string;
      address: string;
      phone_number: string;
      email: string;
      operating_hours: string;
      latitude: number;
      longitude: number;
      image: string;
      logo: string | null;
      is_active: boolean;
    }
  >({
    mutationFn: variables => hasuraRequest(ADD_RESTAURANT, variables),
  });
}

// Type-safe hook for adding a reel
export function useAddReel() {
  return useMutation<
    { insert_Reels: { affected_rows: number } },
    Error,
    {
      title: string;
      description: string;
      video_url: string;
      category: string;
      type: string;
      Price: string;
      Product?: any;
      delivery_time: string;
      likes?: string;
      restaurant_id?: string | null;
      shop_id?: string | null;
      user_id: string | null;
      is_active?: boolean;
    }
  >({
    mutationFn: variables => hasuraRequest(ADD_REEL, variables),
  });
}

// Type-safe hook for updating a reel
export function useUpdateReel() {
  return useMutation<
    { update_Reels_by_pk: {
      id: string;
      title: string;
      description: string;
      video_url: string;
      category: string;
      type: string;
      Price: string;
      delivery_time: string;
      is_active: boolean;
    } },
    Error,
    {
      id: string;
      title: string;
      description: string;
      video_url: string;
      category: string;
      type: string;
      Price: string;
      Product?: any;
      delivery_time: string;
      is_active: boolean;
    }
  >({
    mutationFn: variables => hasuraRequest(UPDATE_REEL, variables),
  });
}

// Staff Management Types
export interface OrgEmployee {
  id: string; // Primary key (UUID, auto-generated)
  employeeID: string; // Business identifier (employee number)
  fullnames: string;
  email: string;
  phone: string;
  Address: string;
  Position: string;
  roleType: string;
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
  privillages: string[]; // Array of permission strings
  created_on: string;
  update_on: string;
}

export interface ProjectUser {
  id: string;
  MembershipId: string;
  username: string;
  email: string;
  password: string;
  role: string;
  is_active: boolean;
  TwoAuth_enabled: boolean;
  last_Login: string | null;
  created_at: string;
  updated_at: string;
  gender: string | null;
  device_details: string | null;
  profile: string | null;
  privileges: any; // JSON object for project user privileges
}

// Default role templates as arrays
export const DEFAULT_ROLES = {
  globalAdmin: [
    'dashboard:view',
    'dashboard:edit',
    'pos:view',
    'pos:create',
    'pos:edit',
    'pos:delete',
    'pos:checkout',
    'pos:refund',
    'products:view',
    'products:create',
    'products:edit',
    'products:delete',
    'orders:view',
    'orders:edit',
    'orders:delete',
    'customers:view',
    'customers:create',
    'customers:edit',
    'customers:delete',
    'inventory:view',
    'inventory:edit',
    'inventory:stock',
    'reports:view',
    'reports:export',
    'settings:view',
    'settings:edit',
    'staff:view',
    'staff:create',
    'staff:edit',
    'staff:delete',
    'systemAdmin',
    'globalAdmin',
  ],
  systemAdmin: [
    'dashboard:view',
    'dashboard:edit',
    'pos:view',
    'pos:create',
    'pos:edit',
    'pos:checkout',
    'pos:refund',
    'products:view',
    'products:create',
    'products:edit',
    'products:delete',
    'orders:view',
    'orders:edit',
    'customers:view',
    'customers:create',
    'customers:edit',
    'inventory:view',
    'inventory:edit',
    'inventory:stock',
    'reports:view',
    'reports:export',
    'settings:view',
    'staff:view',
    'staff:create',
    'staff:edit',
    'systemAdmin',
  ],
  basicAdmin: [
    'dashboard:view',
    'pos:view',
    'pos:create',
    'pos:checkout',
    'products:view',
    'products:create',
    'products:edit',
    'orders:view',
    'orders:edit',
    'customers:view',
    'customers:create',
    'customers:edit',
    'inventory:view',
    'inventory:stock',
    'reports:view',
    'settings:view',
    'staff:view',
  ],
};

// Helper function to check if permission exists in array
export const hasPermission = (permissions: string[], permission: string): boolean => {
  return permissions.includes(permission);
};

// Helper function to get permissions for a role type
export const getPermissionsForRole = (roleType: string): string[] => {
  return DEFAULT_ROLES[roleType as keyof typeof DEFAULT_ROLES] || [];
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
      Position: string;
      password: string;
      roleType: string;
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
      privillages: string[];
    }
  >({
    mutationFn: variables => hasuraRequest(ADD_ORG_EMPLOYEE_ROLES, variables),
  });
}

// Type-safe hook for updating employee role
export function useUpdateEmployeeRole() {
  return useMutation<
    { update_orgEmployeeRoles: { affected_rows: number } },
    Error,
    {
      id: string;
      privillages: string[];
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
      fullnames?: string;
      email?: string;
      phone?: string;
      Address?: string;
      Position?: string;
      roleType?: string;
      active?: boolean;
    }
  >({
    mutationFn: variables => hasuraRequest(UPDATE_ORG_EMPLOYEE, variables),
  });
}

// Type-safe hook for deleting employee
export function useDeleteEmployee() {
  return useMutation<{ delete_orgEmployees: { affected_rows: number } }, Error, { id: string }>({
    mutationFn: variables => hasuraRequest(DELETE_ORG_EMPLOYEE, variables),
  });
}

// Type-safe hook for POS Transactions
export function usePOSTransactions(shopId: string) {
  return useQuery<{ shopCheckouts: any[] }, Error>({
    queryKey: ['pos-transactions', shopId],
    queryFn: () => hasuraRequest(GET_POS_TRANSACTIONS, { shop_id: shopId }),
    enabled: !!shopId,
  });
}

export function useProjectUsers() {
  return useQuery<{ ProjectUsers: ProjectUser[] }, Error>({
    queryKey: ['projectUsers'],
    queryFn: async () => {
      const query = `
        query getProjectAllUsers {
          ProjectUsers {
            MembershipId
            TwoAuth_enabled
            created_at
            device_details
            email
            gender
            id
            is_active
            last_Login
            password
            privileges
            profile
            role
            username
            updated_at
          }
        }
      `;
      return hasuraRequest(query);
    },
  });
}

// Type-safe hook for adding project user
export function useAddProjectUser() {
  return useMutation<
    { insert_ProjectUsers: { affected_rows: number } },
    Error,
    {
      username: string;
      email: string;
      password: string;
      role: string;
      is_active: boolean;
      TwoAuth_enabled: boolean;
      gender?: string;
      device_details?: string;
      profile?: string;
      privileges?: any;
    }
  >({
    mutationFn: variables => {
      const mutation = `
        mutation AddProjectUsers(
          $username: String!,
          $email: String!,
          $password: String!,
          $role: String!,
          $is_active: Boolean!,
          $TwoAuth_enabled: Boolean!,
          $gender: String = "",
          $device_details: String = "",
          $profile: String = "",
          $privileges: jsonb = null
        ) {
          insert_ProjectUsers(objects: {
            username: $username,
            email: $email,
            password: $password,
            role: $role,
            is_active: $is_active,
            TwoAuth_enabled: $TwoAuth_enabled,
            gender: $gender,
            device_details: $device_details,
            profile: $profile,
            privileges: $privileges
          }) {
            affected_rows
          }
        }
      `;
      return hasuraRequest(mutation, variables);
    },
  });
}

// Type-safe hook for updating project user
export function useUpdateProjectUser() {
  return useMutation<
    { update_ProjectUsers: { affected_rows: number } },
    Error,
    {
      id: string;
      username?: string;
      email?: string;
      password?: string;
      role?: string;
      is_active?: boolean;
      TwoAuth_enabled?: boolean;
      gender?: string;
      device_details?: string;
      profile?: string;
      privileges?: any;
    }
  >({
    mutationFn: variables => {
      const { id, ...updateData } = variables;

      // Build the _set object dynamically to avoid null values
      const setObject: any = {
        updated_at: 'now()',
      };

      // Only include fields that are actually provided
      if (updateData.username !== undefined) setObject.username = updateData.username;
      if (updateData.email !== undefined) setObject.email = updateData.email;
      if (updateData.password !== undefined) setObject.password = updateData.password;
      if (updateData.role !== undefined) setObject.role = updateData.role;
      if (updateData.is_active !== undefined) setObject.is_active = updateData.is_active;
      if (updateData.TwoAuth_enabled !== undefined)
        setObject.TwoAuth_enabled = updateData.TwoAuth_enabled;
      if (updateData.gender !== undefined) setObject.gender = updateData.gender;
      if (updateData.device_details !== undefined)
        setObject.device_details = updateData.device_details;
      if (updateData.profile !== undefined) setObject.profile = updateData.profile;
      if (updateData.privileges !== undefined) setObject.privileges = updateData.privileges;

      const mutation = `
        mutation UpdateProjectUser($id: uuid!, $set: ProjectUsers_set_input!) {
          update_ProjectUsers(
            where: { id: { _eq: $id } },
            _set: $set
          ) {
            affected_rows
          }
        }
      `;

      return hasuraRequest(mutation, { id, set: setObject });
    },
  });
}
