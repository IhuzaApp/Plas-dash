import { PrivilegeKey } from '@/types/privileges';

export interface MenuPrivilege {
  module: PrivilegeKey;
  action?: string;
  isProjectUser?: boolean;
  isOrgEmployeeOnly?: boolean;
}

/**
 * Maps menu item titles to their required privileges
 * Used by AdminSidebar to filter menu items based on user permissions
 */
export const menuPrivileges: Record<string, MenuPrivilege> = {
  Dashboard: { module: 'company_dashboard', isProjectUser: true },
  Orders: { module: 'orders' },
  Reels: { module: 'reels' },
  Plasas: { module: 'shoppers', isProjectUser: true },
  Customers: { module: 'users', isProjectUser: true },
  'Project Users': { module: 'project_users', isProjectUser: true },
  Shops: { module: 'shops', isProjectUser: true },
  Restaurants: { module: 'restaurants', isProjectUser: true },
  Products: { module: 'products', isProjectUser: true },
  'Company Dashboard': { module: 'company_dashboard', isOrgEmployeeOnly: true },
  'Shop Dashboard': { module: 'shop_dashboard' },
  Checkout: { module: 'checkout' },
  Inventory: { module: 'inventory' },
  Transactions: { module: 'transactions' },
  Discounts: { module: 'discounts' },
  'Financial Overview': { module: 'financial_overview' },
  'Staff Management': { module: 'staff_management' },
  'Wallet Operations': { module: 'wallet', isProjectUser: true },
  Wallets: { module: 'wallet', isProjectUser: true },
  // Backward compatibility for existing roles/users
  'Company Wallet': { module: 'wallet', isProjectUser: true },
  'Plasa Wallets': { module: 'wallet', isProjectUser: true },
  'Refund Claims': { module: 'refunds', isProjectUser: true },
  Tickets: { module: 'tickets', isProjectUser: true },
  'Help Center': { module: 'help', isProjectUser: true },
  'Delivery Settings': { module: 'delivery_settings', isProjectUser: true },
  Promotions: { module: 'promotions' },
  'System Settings': { module: 'settings', isProjectUser: true },
  Referrals: { module: 'referrals', isProjectUser: true },
  PlasMarket: { module: 'plasmarket', isProjectUser: true },
  'Withdraw Requests': { module: 'withdraw_requests', isProjectUser: true },

  // Procurement
  'Procurement Dashboard': { module: 'procurement_dashboard' },
  Suppliers: { module: 'suppliers' },
  Quotations: { module: 'quotations' },
  'Purchase Orders': { module: 'purchase_orders' },
  'Goods Received': { module: 'procurement' },
  'Procurement Reports': { module: 'procurement_dashboard' },

  // Production
  Recipes: { module: 'recipes' },
  'Production Orders': { module: 'production_orders' },
  'Production Dashboard': { module: 'production_dashboard' },
  'Cost & Profit': { module: 'cost_profit' },
  'Simulate Stock': { module: 'simulate_stock' },

  // Tax
  'Tax Dashboard': { module: 'tax' },
  'Tax Declaration': { module: 'tax' },
  Forecasting: { module: 'tax' },
  'Smart Import': { module: 'tax' },
  'Tax Summary': { module: 'tax' },
  Optimization: { module: 'tax' },
  Reports: { module: 'tax' },
  Settings: { module: 'tax' },
  'AI Chat': { module: 'ai_chat' },

  // Subscriptions (Project Users only)
  'Manage Plans': { module: 'subscriptions', isProjectUser: true },
  'Modules': { module: 'subscriptions', isProjectUser: true },
  'Plan Assignments': { module: 'subscriptions', isProjectUser: true },
  'Subscriptions & Billing': { module: 'subscriptions', isProjectUser: true },
};

/**
 * Get the required privilege for a menu item
 * @param menuTitle - The title of the menu item
 * @returns MenuPrivilege object or undefined if not found
 */
export const getMenuPrivilege = (menuTitle: string): MenuPrivilege | undefined => {
  return menuPrivileges[menuTitle];
};

/**
 * Check if a menu item should be visible based on user privileges
 * @param menuTitle - The title of the menu item
 * @param hasModuleAccess - Function to check if user has module access
 * @param hasAction - Function to check if user has specific action
 * @returns boolean indicating if menu item should be visible
 */
export const shouldShowMenuItem = (
  menuTitle: string,
  hasModuleAccess: (module: PrivilegeKey) => boolean,
  hasAction?: (module: PrivilegeKey, action: string) => boolean
): boolean => {
  const privilege = getMenuPrivilege(menuTitle);
  if (!privilege) return true; // If no privilege defined, allow access

  if (privilege.action && hasAction) {
    return hasAction(privilege.module, privilege.action);
  }

  return hasModuleAccess(privilege.module);
};
