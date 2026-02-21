import { UserPrivileges, PrivilegeKey } from '@/types/privileges';
import { hasPrivilege } from '@/types/privileges';

export interface PageRoute {
  path: string;
  module: PrivilegeKey;
  action?: string;
  title: string;
  priority: number; // Higher number = higher priority for routing
}

/**
 * Defines all available pages with their required privileges and routing priority
 * Higher priority pages will be selected first when finding an accessible page
 */
export const PAGE_ROUTES: PageRoute[] = [
  // High Priority - Main dashboards
  { path: '/', module: 'company_dashboard', action: 'access', title: 'Dashboard', priority: 100 },
  {
    path: '/pos/company-dashboard',
    module: 'company_dashboard',
    action: 'access',
    title: 'Company Dashboard',
    priority: 95,
  },
  {
    path: '/pos/shop-dashboard',
    module: 'shop_dashboard',
    action: 'access',
    title: 'Shop Dashboard',
    priority: 90,
  },

  // POS Operations
  { path: '/pos/checkout', module: 'checkout', action: 'access', title: 'Checkout', priority: 85 },
  {
    path: '/pos/inventory',
    module: 'inventory',
    action: 'access',
    title: 'Inventory',
    priority: 80,
  },
  {
    path: '/pos/transactions',
    module: 'transactions',
    action: 'access',
    title: 'Transactions',
    priority: 75,
  },
  {
    path: '/pos/discounts',
    module: 'discounts',
    action: 'access',
    title: 'Discounts',
    priority: 70,
  },
  {
    path: '/pos/financial',
    module: 'financial_overview',
    action: 'access',
    title: 'Financial Overview',
    priority: 65,
  },

  // Management Pages
  { path: '/orders', module: 'orders', action: 'access', title: 'Orders', priority: 60 },
  { path: '/products', module: 'products', action: 'access', title: 'Products', priority: 55 },
  { path: '/users', module: 'users', action: 'access', title: 'Users', priority: 50 },
  { path: '/shops', module: 'shops', action: 'access', title: 'Shops', priority: 45 },
  { path: '/shoppers', module: 'shoppers', action: 'access', title: 'Shoppers', priority: 40 },

  // Financial & Support
  {
    path: '/company-wallet',
    module: 'wallet',
    action: 'access',
    title: 'Wallet Operations',
    priority: 35,
  },
  {
    path: '/shopper-wallets',
    module: 'wallet',
    action: 'access',
    title: 'Shopper Wallets',
    priority: 30,
  },
  { path: '/refunds', module: 'refunds', action: 'access', title: 'Refunds', priority: 25 },
  { path: '/tickets', module: 'tickets', action: 'access', title: 'Tickets', priority: 20 },

  // Settings & Configuration
  {
    path: '/promotions',
    module: 'promotions',
    action: 'access',
    title: 'Promotions',
    priority: 15,
  },
  {
    path: '/delivery-settings',
    module: 'delivery_settings',
    action: 'access',
    title: 'Delivery Settings',
    priority: 10,
  },
  { path: '/settings', module: 'settings', action: 'access', title: 'Settings', priority: 5 },
  { path: '/referrals', module: 'referrals', action: 'access', title: 'Referrals', priority: 4 },
  { path: '/help', module: 'help', action: 'access', title: 'Help', priority: 1 },

  // Additional pages that might exist
  { path: '/pos', module: 'company_dashboard', action: 'access', title: 'POS', priority: 88 },
  {
    path: '/dashboard',
    module: 'company_dashboard',
    action: 'access',
    title: 'Dashboard',
    priority: 99,
  },
  { path: '/admin', module: 'company_dashboard', action: 'access', title: 'Admin', priority: 98 },
  { path: '/staff', module: 'staff_management', action: 'access', title: 'Staff', priority: 42 },
  { path: '/customers', module: 'users', action: 'access', title: 'Customers', priority: 48 },
  {
    path: '/analytics',
    module: 'company_dashboard',
    action: 'access',
    title: 'Analytics',
    priority: 67,
  },
  {
    path: '/reports',
    module: 'company_dashboard',
    action: 'access',
    title: 'Reports',
    priority: 66,
  },
];

/**
 * Find the first accessible page for a user based on their privileges
 * @param privileges - User's privileges
 * @param role - User's role
 * @returns The first accessible page route, or null if no access
 */
export const findFirstAccessiblePage = (
  privileges: UserPrivileges | null,
  role?: string
): PageRoute | null => {
  if (!privileges) return null;

  // Sort pages by priority (highest first)
  const sortedPages = [...PAGE_ROUTES].sort((a, b) => b.priority - a.priority);

  // Find the first page the user has access to
  for (const page of sortedPages) {
    if (hasPrivilege(privileges, page.module, page.action, role)) {
      return page;
    }
  }

  return null;
};

/**
 * Get all accessible pages for a user
 * @param privileges - User's privileges
 * @param role - User's role
 * @returns Array of accessible page routes
 */
export const getAccessiblePages = (
  privileges: UserPrivileges | null,
  role?: string
): PageRoute[] => {
  if (!privileges) return [];

  return PAGE_ROUTES.filter(page => hasPrivilege(privileges, page.module, page.action, role));
};

/**
 * Check if a specific page is accessible to a user
 * @param privileges - User's privileges
 * @param path - Page path to check
 * @param role - User's role
 * @returns boolean indicating if the page is accessible
 */
export const isPageAccessible = (
  privileges: UserPrivileges | null,
  path: string,
  role?: string
): boolean => {
  if (!privileges) return false;

  const page = PAGE_ROUTES.find(route => route.path === path);

  if (!page) {
    return true; // Allow access to pages not in our routing system
  }

  const hasAccess = hasPrivilege(privileges, page.module, page.action, role);

  return hasAccess;
};

/**
 * Get the recommended landing page for a user after login
 * This prioritizes dashboards and main operational pages
 * @param privileges - User's privileges
 * @param role - User's role
 * @returns Recommended page route or null
 */
export const getRecommendedLandingPage = (
  privileges: UserPrivileges | null,
  role?: string
): PageRoute | null => {
  if (!privileges) return null;

  // Priority order for landing pages
  const landingPageModules: PrivilegeKey[] = [
    'company_dashboard',
    'shop_dashboard',
    'checkout',
    'inventory',
    'transactions',
    'orders',
    'products',
    'users',
    'shops',
    'shoppers',
    'wallet',
    'refunds',
    'tickets',
    'promotions',
    'delivery_settings',
    'settings',
    'referrals',
    'help',
  ];

  // Find the first accessible module in priority order
  for (const module of landingPageModules) {
    if (hasPrivilege(privileges, module, 'access', role)) {
      const page = PAGE_ROUTES.find(route => route.module === module && route.action === 'access');
      if (page) return page;
    }
  }

  return null;
};
