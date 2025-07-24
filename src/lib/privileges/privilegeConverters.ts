import { UserPrivileges, PrivilegeKey } from '@/types/privileges';

/**
 * Convert old permission format to new privilege format
 * @param customPermissions - Array of old permission strings
 * @returns UserPrivileges object with new format
 */
export const convertCustomPermissionsToPrivileges = (customPermissions: string[]): UserPrivileges => {
  const privileges: UserPrivileges = {};
  
  // Map old permission format to new privilege format
  const permissionMapping: { [key: string]: { module: PrivilegeKey; action: string } } = {
    'companyDashboard:view': { module: 'company_dashboard', action: 'access' },
    'shopDashboard:view': { module: 'shop_dashboard', action: 'access' },
    'checkout:view': { module: 'checkout', action: 'access' },
    'inventory:view': { module: 'inventory', action: 'access' },
    'transactions:view': { module: 'transactions', action: 'access' },
    'discounts:view': { module: 'discounts', action: 'access' },
    'financial:view': { module: 'financial_overview', action: 'access' },
    'staff:view': { module: 'staff_management', action: 'access' },
    'products:view': { module: 'products', action: 'access' },
    'products:create': { module: 'products', action: 'add_products' },
    'products:edit': { module: 'products', action: 'edit_products' },
    'products:delete': { module: 'products', action: 'delete_products' },
    'orders:view': { module: 'orders', action: 'access' },
    'orders:edit': { module: 'orders', action: 'edit_orders' },
    'orders:delete': { module: 'orders', action: 'delete_orders' },
    'customers:view': { module: 'users', action: 'access' },
    'customers:create': { module: 'users', action: 'add_users' },
    'customers:edit': { module: 'users', action: 'edit_users' },
    'customers:delete': { module: 'users', action: 'delete_users' },
    'inventory:edit': { module: 'inventory', action: 'edit_products' },
    'inventory:stock': { module: 'inventory', action: 'update_stock' },
    'reports:view': { module: 'company_dashboard', action: 'view_reports' },
    'reports:export': { module: 'company_dashboard', action: 'export_reports' },
    'settings:view': { module: 'settings', action: 'access' },
    'settings:edit': { module: 'settings', action: 'edit_settings' },
    'staff:create': { module: 'staff_management', action: 'add_new_staff' },
    'staff:edit': { module: 'staff_management', action: 'edit_accounts' },
    'staff:delete': { module: 'staff_management', action: 'delete_staff' },
  };
  
  customPermissions.forEach(permission => {
    const mapping = permissionMapping[permission];
    if (mapping) {
      if (!privileges[mapping.module]) {
        privileges[mapping.module] = { access: false };
      }
      privileges[mapping.module]![mapping.action] = true;
    }
  });
  
  return privileges;
};

/**
 * Convert new privilege format to old permission format
 * @param privileges - UserPrivileges object in new format
 * @returns Array of old permission strings
 */
export const convertPrivilegesToOldFormat = (privileges: UserPrivileges): string[] => {
  const oldPermissions: string[] = [];
  
  // Reverse mapping from new format to old format
  const reverseMapping: { [key: string]: { module: string; action: string } } = {
    'company_dashboard.access': { module: 'companyDashboard', action: 'view' },
    'shop_dashboard.access': { module: 'shopDashboard', action: 'view' },
    'checkout.access': { module: 'checkout', action: 'view' },
    'inventory.access': { module: 'inventory', action: 'view' },
    'transactions.access': { module: 'transactions', action: 'view' },
    'discounts.access': { module: 'discounts', action: 'view' },
    'financial_overview.access': { module: 'financial', action: 'view' },
    'staff_management.access': { module: 'staff', action: 'view' },
    'products.access': { module: 'products', action: 'view' },
    'products.add_products': { module: 'products', action: 'create' },
    'products.edit_products': { module: 'products', action: 'edit' },
    'products.delete_products': { module: 'products', action: 'delete' },
    'orders.access': { module: 'orders', action: 'view' },
    'orders.edit_orders': { module: 'orders', action: 'edit' },
    'orders.delete_orders': { module: 'orders', action: 'delete' },
    'users.access': { module: 'customers', action: 'view' },
    'users.add_users': { module: 'customers', action: 'create' },
    'users.edit_users': { module: 'customers', action: 'edit' },
    'users.delete_users': { module: 'customers', action: 'delete' },
    'inventory.edit_products': { module: 'inventory', action: 'edit' },
    'inventory.update_stock': { module: 'inventory', action: 'stock' },
    'company_dashboard.view_reports': { module: 'reports', action: 'view' },
    'company_dashboard.export_reports': { module: 'reports', action: 'export' },
    'settings.access': { module: 'settings', action: 'view' },
    'settings.edit_settings': { module: 'settings', action: 'edit' },
    'staff_management.add_new_staff': { module: 'staff', action: 'create' },
    'staff_management.edit_accounts': { module: 'staff', action: 'edit' },
    'staff_management.delete_staff': { module: 'staff', action: 'delete' },
  };
  
  Object.keys(privileges).forEach(module => {
    const modulePrivileges = privileges[module as PrivilegeKey];
    if (modulePrivileges) {
      Object.keys(modulePrivileges).forEach(action => {
        if (modulePrivileges[action]) {
          const key = `${module}.${action}`;
          const mapping = reverseMapping[key];
          if (mapping) {
            oldPermissions.push(`${mapping.module}:${mapping.action}`);
          }
        }
      });
    }
  });
  
  return oldPermissions;
};

/**
 * Merge two privilege objects
 * @param basePrivileges - Base privileges
 * @param additionalPrivileges - Additional privileges to merge
 * @returns Merged privileges object
 */
export const mergePrivileges = (basePrivileges: UserPrivileges, additionalPrivileges: UserPrivileges): UserPrivileges => {
  const merged = { ...basePrivileges };
  
  Object.keys(additionalPrivileges).forEach(module => {
    const moduleKey = module as PrivilegeKey;
    if (!merged[moduleKey]) {
      merged[moduleKey] = {};
    }
    
    const modulePrivileges = additionalPrivileges[moduleKey];
    if (modulePrivileges) {
      Object.keys(modulePrivileges).forEach(action => {
        merged[moduleKey]![action] = modulePrivileges[action];
      });
    }
  });
  
  return merged;
};

/**
 * Remove specific privileges from a privileges object
 * @param privileges - Base privileges
 * @param privilegesToRemove - Privileges to remove
 * @returns Privileges object with specified privileges removed
 */
export const removePrivileges = (privileges: UserPrivileges, privilegesToRemove: UserPrivileges): UserPrivileges => {
  const result = { ...privileges };
  
  Object.keys(privilegesToRemove).forEach(module => {
    const moduleKey = module as PrivilegeKey;
    if (result[moduleKey]) {
      const modulePrivileges = privilegesToRemove[moduleKey];
      if (modulePrivileges) {
        Object.keys(modulePrivileges).forEach(action => {
          if (modulePrivileges[action]) {
            result[moduleKey]![action] = false;
          }
        });
      }
    }
  });
  
  return result;
}; 