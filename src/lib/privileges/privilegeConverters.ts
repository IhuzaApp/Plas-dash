import { UserPrivileges, PrivilegeKey } from '@/types/privileges';

/**
 * Convert old permission format to new privilege format
 * @param customPermissions - Array of old permission strings
 * @returns UserPrivileges object with new format
 */
export const convertCustomPermissionsToPrivileges = (
  customPermissions: string[]
): UserPrivileges => {
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
export function convertPrivilegesToOldFormat(privileges: Record<string, any>): string[] {
  const result: string[] = [];
  Object.entries(privileges).forEach(([module, actions]) => {
    Object.entries(actions || {}).forEach(([action, value]) => {
      if (value === true) {
        result.push(`${module}:${action}`);
      }
    });
  });
  return result;
}

/**
 * Merge two privilege objects
 * @param basePrivileges - Base privileges
 * @param additionalPrivileges - Additional privileges to merge
 * @returns Merged privileges object
 */
export const mergePrivileges = (
  basePrivileges: UserPrivileges,
  additionalPrivileges: UserPrivileges
): UserPrivileges => {
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
export const removePrivileges = (
  privileges: UserPrivileges,
  privilegesToRemove: UserPrivileges
): UserPrivileges => {
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
