import { PrivilegeKey } from '@/types/privileges';

export interface MenuPrivilege {
  module: PrivilegeKey;
  action?: string;
  isProjectUser?: boolean;
}

/**
 * Maps menu item titles to their required privileges
 * Used by AdminSidebar to filter menu items based on user permissions
 */
export const menuPrivileges: Record<string, MenuPrivilege> = {
  Dashboard: { module: 'company_dashboard' },
  Orders: { module: 'orders' },
  Plasas: { module: 'shoppers' },
  Customers: { module: 'users' },
  'Project Users': { module: 'project_users', isProjectUser: true },
  Shops: { module: 'shops' },
  Restaurants: { module: 'restaurants' },
  Products: { module: 'products' },
  'Company Dashboard': { module: 'company_dashboard' },
  'Shop Dashboard': { module: 'shop_dashboard' },
  Checkout: { module: 'checkout' },
  Inventory: { module: 'inventory' },
  Transactions: { module: 'transactions' },
  Discounts: { module: 'discounts' },
  'Financial Overview': { module: 'financial_overview' },
  'Staff Management': { module: 'staff_management' },
  'Wallet Operations': { module: 'wallet' },
  Wallets: { module: 'wallet' },
  // Backward compatibility for existing roles/users
  'Company Wallet': { module: 'wallet' },
  'Plasa Wallets': { module: 'wallet' },
  'Refund Claims': { module: 'refunds' },
  Tickets: { module: 'tickets' },
  'Help Center': { module: 'help' },
  'Delivery Settings': { module: 'delivery_settings' },
  Promotions: { module: 'promotions' },
  'System Settings': { module: 'settings' },
  Referrals: { module: 'referrals' },
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
