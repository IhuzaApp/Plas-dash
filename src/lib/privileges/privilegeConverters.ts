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
    // Checkout Module
    'checkout:access': { module: 'checkout', action: 'access' },
    'checkout:view': { module: 'checkout', action: 'access' },
    'checkout:delete_pending_orders': { module: 'checkout', action: 'delete_pending_orders' },
    'checkout:apply_discount': { module: 'checkout', action: 'apply_discount' },
    'checkout:view_orders': { module: 'checkout', action: 'view_orders' },
    'checkout:create_orders': { module: 'checkout', action: 'create_orders' },
    'checkout:edit_orders': { module: 'checkout', action: 'edit_orders' },
    'checkout:cancel_orders': { module: 'checkout', action: 'cancel_orders' },
    'checkout:process_payment': { module: 'checkout', action: 'process_payment' },
    'checkout:view_customer_info': { module: 'checkout', action: 'view_customer_info' },
    'checkout:edit_customer_info': { module: 'checkout', action: 'edit_customer_info' },

    // Staff Management Module
    'staff_management:access': { module: 'staff_management', action: 'access' },
    'staff:view': { module: 'staff_management', action: 'access' },
    'staff:view_accounts': { module: 'staff_management', action: 'view_accounts' },
    'staff:edit_accounts': { module: 'staff_management', action: 'edit_accounts' },
    'staff:add_new_staff': { module: 'staff_management', action: 'add_new_staff' },
    'staff_management:view_accounts': { module: 'staff_management', action: 'view_accounts' },
    'staff_management:edit_accounts': { module: 'staff_management', action: 'edit_accounts' },
    'staff_management:view_activity_logs': { module: 'staff_management', action: 'view_activity_logs' },
    'staff_management:add_new_staff': { module: 'staff_management', action: 'add_new_staff' },
    'staff_management:delete_staff': { module: 'staff_management', action: 'delete_staff' },
    'staff_management:assign_roles': { module: 'staff_management', action: 'assign_roles' },
    'staff_management:view_permissions': { module: 'staff_management', action: 'view_permissions' },
    'staff_management:edit_permissions': { module: 'staff_management', action: 'edit_permissions' },

    // Inventory Module
    'inventory:access': { module: 'inventory', action: 'access' },
    'inventory:view': { module: 'inventory', action: 'access' },
    'inventory:view_products': { module: 'inventory', action: 'view_products' },
    'inventory:add_products': { module: 'inventory', action: 'add_products' },
    'inventory:edit_products': { module: 'inventory', action: 'edit_products' },
    'inventory:delete_products': { module: 'inventory', action: 'delete_products' },
    'inventory:import_products': { module: 'inventory', action: 'import_products' },
    'inventory:export_products': { module: 'inventory', action: 'export_products' },
    'inventory:manage_categories': { module: 'inventory', action: 'manage_categories' },
    'inventory:view_stock_levels': { module: 'inventory', action: 'view_stock_levels' },
    'inventory:update_stock': { module: 'inventory', action: 'update_stock' },

    // Transactions Module
    'transactions:access': { module: 'transactions', action: 'access' },
    'transactions:view': { module: 'transactions', action: 'access' },
    'transactions:refund': { module: 'transactions', action: 'refund' },
    'transactions:export': { module: 'transactions', action: 'export' },
    'transactions:view_details': { module: 'transactions', action: 'view_details' },
    'transactions:process_refund': { module: 'transactions', action: 'process_refund' },
    'transactions:view_receipts': { module: 'transactions', action: 'view_receipts' },
    'transactions:print_receipts': { module: 'transactions', action: 'print_receipts' },

    // Discounts Module
    'discounts:access': { module: 'discounts', action: 'access' },
    'discounts:view': { module: 'discounts', action: 'access' },
    'discounts:create_discount': { module: 'discounts', action: 'create_discount' },
    'discounts:delete_discount': { module: 'discounts', action: 'delete_discount' },
    'discounts:edit_discount': { module: 'discounts', action: 'edit_discount' },
    'discounts:view_discounts': { module: 'discounts', action: 'view_discounts' },
    'discounts:apply_discount': { module: 'discounts', action: 'apply_discount' },
    'discounts:manage_discount_rules': { module: 'discounts', action: 'manage_discount_rules' },

    // Company Dashboard Module
    'company_dashboard:access': { module: 'company_dashboard', action: 'access' },
    'companyDashboard:view': { module: 'company_dashboard', action: 'access' },
    'company_dashboard:view_reports': { module: 'company_dashboard', action: 'view_reports' },
    'company_dashboard:export_reports': { module: 'company_dashboard', action: 'export_reports' },
    'company_dashboard:view_analytics': { module: 'company_dashboard', action: 'view_analytics' },
    'company_dashboard:view_revenue_data': { module: 'company_dashboard', action: 'view_revenue_data' },
    'company_dashboard:view_performance_metrics': { module: 'company_dashboard', action: 'view_performance_metrics' },

    // Shop Dashboard Module
    'shop_dashboard:access': { module: 'shop_dashboard', action: 'access' },
    'shopDashboard:view': { module: 'shop_dashboard', action: 'access' },
    'shop_dashboard:view_sales_data': { module: 'shop_dashboard', action: 'view_sales_data' },
    'shop_dashboard:manage_daily_targets': { module: 'shop_dashboard', action: 'manage_daily_targets' },
    'shop_dashboard:view_shop_performance': { module: 'shop_dashboard', action: 'view_shop_performance' },
    'shop_dashboard:view_staff_performance': { module: 'shop_dashboard', action: 'view_staff_performance' },
    'shop_dashboard:view_customer_metrics': { module: 'shop_dashboard', action: 'view_customer_metrics' },

    // Financial Overview Module
    'financial_overview:access': { module: 'financial_overview', action: 'access' },
    'financial:view': { module: 'financial_overview', action: 'access' },
    'financial:view_profits': { module: 'financial_overview', action: 'view_profits' },
    'financial_overview:view_profits': { module: 'financial_overview', action: 'view_profits' },
    'financial_overview:export_financial_data': { module: 'financial_overview', action: 'export_financial_data' },
    'financial_overview:view_revenue_reports': { module: 'financial_overview', action: 'view_revenue_reports' },
    'financial_overview:view_expense_reports': { module: 'financial_overview', action: 'view_expense_reports' },
    'financial_overview:view_profit_margins': { module: 'financial_overview', action: 'view_profit_margins' },

    // POS Terminal Module
    'pos_terminal:access': { module: 'pos_terminal', action: 'access' },
    'pos:view': { module: 'pos_terminal', action: 'access' },
    'pos:park_sale': { module: 'pos_terminal', action: 'park_sale' },
    'pos:hold_order': { module: 'pos_terminal', action: 'hold_order' },
    'pos_terminal:park_sale': { module: 'pos_terminal', action: 'park_sale' },
    'pos_terminal:hold_order': { module: 'pos_terminal', action: 'hold_order' },
    'pos_terminal:resume_order': { module: 'pos_terminal', action: 'resume_order' },
    'pos_terminal:process_sale': { module: 'pos_terminal', action: 'process_sale' },
    'pos_terminal:view_cart': { module: 'pos_terminal', action: 'view_cart' },
    'pos_terminal:edit_cart': { module: 'pos_terminal', action: 'edit_cart' },
    'pos_terminal:apply_promotions': { module: 'pos_terminal', action: 'apply_promotions' },

    // Orders Module
    'orders:access': { module: 'orders', action: 'access' },
    'orders:view': { module: 'orders', action: 'access' },
    'orders:view_orders': { module: 'orders', action: 'view_orders' },
    'orders:create_orders': { module: 'orders', action: 'create_orders' },
    'orders:edit_orders': { module: 'orders', action: 'edit_orders' },
    'orders:delete_orders': { module: 'orders', action: 'delete_orders' },
    'orders:process_orders': { module: 'orders', action: 'process_orders' },
    'orders:view_order_details': { module: 'orders', action: 'view_order_details' },
    'orders:update_order_status': { module: 'orders', action: 'update_order_status' },
    'orders:assign_delivery': { module: 'orders', action: 'assign_delivery' },

    // Products Module
    'products:access': { module: 'products', action: 'access' },
    'products:view': { module: 'products', action: 'access' },
    'products:view_products': { module: 'products', action: 'view_products' },
    'products:add_products': { module: 'products', action: 'add_products' },
    'products:edit_products': { module: 'products', action: 'edit_products' },
    'products:delete_products': { module: 'products', action: 'delete_products' },
    'products:import_products': { module: 'products', action: 'import_products' },
    'products:export_products': { module: 'products', action: 'export_products' },
    'products:manage_categories': { module: 'products', action: 'manage_categories' },
    'products:view_analytics': { module: 'products', action: 'view_analytics' },

    // Users Module
    'users:access': { module: 'users', action: 'access' },
    'users:view': { module: 'users', action: 'access' },
    'users:view_users': { module: 'users', action: 'view_users' },
    'users:add_users': { module: 'users', action: 'add_users' },
    'users:edit_users': { module: 'users', action: 'edit_users' },
    'users:delete_users': { module: 'users', action: 'delete_users' },
    'users:view_user_details': { module: 'users', action: 'view_user_details' },
    'users:manage_user_roles': { module: 'users', action: 'manage_user_roles' },
    'users:view_user_activity': { module: 'users', action: 'view_user_activity' },

    // Project Users Module
    'project_users:access': { module: 'project_users', action: 'access' },
    'project_users:view': { module: 'project_users', action: 'access' },
    'project_users:view_project_users': { module: 'project_users', action: 'view_project_users' },
    'project_users:add_project_users': { module: 'project_users', action: 'add_project_users' },
    'project_users:edit_project_users': { module: 'project_users', action: 'edit_project_users' },
    'project_users:delete_project_users': { module: 'project_users', action: 'delete_project_users' },
    'project_users:view_project_user_details': { module: 'project_users', action: 'view_project_user_details' },
    'project_users:manage_project_user_roles': { module: 'project_users', action: 'manage_project_user_roles' },
    'project_users:view_project_user_activity': { module: 'project_users', action: 'view_project_user_activity' },

    // Shops Module
    'shops:access': { module: 'shops', action: 'access' },
    'shops:view': { module: 'shops', action: 'access' },
    'shops:view_shops': { module: 'shops', action: 'view_shops' },
    'shops:add_shops': { module: 'shops', action: 'add_shops' },
    'shops:edit_shops': { module: 'shops', action: 'edit_shops' },
    'shops:delete_shops': { module: 'shops', action: 'delete_shops' },
    'shops:view_shop_details': { module: 'shops', action: 'view_shop_details' },
    'shops:manage_shop_settings': { module: 'shops', action: 'manage_shop_settings' },
    'shops:view_shop_performance': { module: 'shops', action: 'view_shop_performance' },

    // Shoppers Module
    'shoppers:access': { module: 'shoppers', action: 'access' },
    'shoppers:view': { module: 'shoppers', action: 'access' },
    'shoppers:view_shoppers': { module: 'shoppers', action: 'view_shoppers' },
    'shoppers:add_shoppers': { module: 'shoppers', action: 'add_shoppers' },
    'shoppers:edit_shoppers': { module: 'shoppers', action: 'edit_shoppers' },
    'shoppers:delete_shoppers': { module: 'shoppers', action: 'delete_shoppers' },
    'shoppers:view_shopper_details': { module: 'shoppers', action: 'view_shopper_details' },
    'shoppers:view_shopper_orders': { module: 'shoppers', action: 'view_shopper_orders' },
    'shoppers:view_shopper_wallet': { module: 'shoppers', action: 'view_shopper_wallet' },
    'shoppers:view_shopper_ratings': { module: 'shoppers', action: 'view_shopper_ratings' },

    // Settings Module
    'settings:access': { module: 'settings', action: 'access' },
    'settings:view': { module: 'settings', action: 'access' },
    'settings:view_settings': { module: 'settings', action: 'view_settings' },
    'settings:edit_settings': { module: 'settings', action: 'edit_settings' },
    'settings:manage_system_config': { module: 'settings', action: 'manage_system_config' },
    'settings:view_audit_logs': { module: 'settings', action: 'view_audit_logs' },
    'settings:manage_notifications': { module: 'settings', action: 'manage_notifications' },

    // Refunds Module
    'refunds:access': { module: 'refunds', action: 'access' },
    'refunds:view': { module: 'refunds', action: 'access' },
    'refunds:view_refunds': { module: 'refunds', action: 'view_refunds' },
    'refunds:process_refunds': { module: 'refunds', action: 'process_refunds' },
    'refunds:approve_refunds': { module: 'refunds', action: 'approve_refunds' },
    'refunds:reject_refunds': { module: 'refunds', action: 'reject_refunds' },
    'refunds:view_refund_details': { module: 'refunds', action: 'view_refund_details' },
    'refunds:export_refund_data': { module: 'refunds', action: 'export_refund_data' },

    // Tickets Module
    'tickets:access': { module: 'tickets', action: 'access' },
    'tickets:view': { module: 'tickets', action: 'access' },
    'tickets:view_tickets': { module: 'tickets', action: 'view_tickets' },
    'tickets:create_tickets': { module: 'tickets', action: 'create_tickets' },
    'tickets:edit_tickets': { module: 'tickets', action: 'edit_tickets' },
    'tickets:delete_tickets': { module: 'tickets', action: 'delete_tickets' },
    'tickets:assign_tickets': { module: 'tickets', action: 'assign_tickets' },
    'tickets:resolve_tickets': { module: 'tickets', action: 'resolve_tickets' },
    'tickets:view_ticket_details': { module: 'tickets', action: 'view_ticket_details' },

    // Help Module
    'help:access': { module: 'help', action: 'access' },
    'help:view': { module: 'help', action: 'access' },
    'help:view_help': { module: 'help', action: 'view_help' },
    'help:search_help': { module: 'help', action: 'search_help' },
    'help:view_categories': { module: 'help', action: 'view_categories' },
    'help:view_articles': { module: 'help', action: 'view_articles' },

    // Wallet Module
    'wallet:access': { module: 'wallet', action: 'access' },
    'wallet:view': { module: 'wallet', action: 'access' },
    'wallet:view_wallets': { module: 'wallet', action: 'view_wallets' },
    'wallet:process_payouts': { module: 'wallet', action: 'process_payouts' },
    'wallet:view_transactions': { module: 'wallet', action: 'view_transactions' },
    'wallet:manage_wallet_settings': { module: 'wallet', action: 'manage_wallet_settings' },
    'wallet:view_balance': { module: 'wallet', action: 'view_balance' },
    'wallet:export_wallet_data': { module: 'wallet', action: 'export_wallet_data' },

    // Promotions Module
    'promotions:access': { module: 'promotions', action: 'access' },
    'promotions:view': { module: 'promotions', action: 'access' },
    'promotions:view_promotions': { module: 'promotions', action: 'view_promotions' },
    'promotions:create_promotions': { module: 'promotions', action: 'create_promotions' },
    'promotions:edit_promotions': { module: 'promotions', action: 'edit_promotions' },
    'promotions:delete_promotions': { module: 'promotions', action: 'delete_promotions' },
    'promotions:activate_promotions': { module: 'promotions', action: 'activate_promotions' },
    'promotions:deactivate_promotions': { module: 'promotions', action: 'deactivate_promotions' },
    'promotions:view_promotion_analytics': { module: 'promotions', action: 'view_promotion_analytics' },

    // Delivery Settings Module
    'delivery_settings:access': { module: 'delivery_settings', action: 'access' },
    'delivery_settings:view': { module: 'delivery_settings', action: 'access' },
    'delivery_settings:view_delivery_settings': { module: 'delivery_settings', action: 'view_delivery_settings' },
    'delivery_settings:edit_delivery_settings': { module: 'delivery_settings', action: 'edit_delivery_settings' },
    'delivery_settings:manage_delivery_zones': { module: 'delivery_settings', action: 'manage_delivery_zones' },
    'delivery_settings:set_delivery_fees': { module: 'delivery_settings', action: 'set_delivery_fees' },
    'delivery_settings:configure_delivery_times': { module: 'delivery_settings', action: 'configure_delivery_times' },

    // Pages Module
    'pages:access': { module: 'pages', action: 'access' },
    'pages:view_pages': { module: 'pages', action: 'view_pages' },
    'pages:access_project_users': { module: 'pages', action: 'access_project_users' },
    'pages:access_orders': { module: 'pages', action: 'access_orders' },
    'pages:access_shops': { module: 'pages', action: 'access_shops' },
    'pages:access_products': { module: 'pages', action: 'access_products' },
    'pages:access_users': { module: 'pages', action: 'access_users' },
    'pages:access_shoppers': { module: 'pages', action: 'access_shoppers' },
    'pages:access_settings': { module: 'pages', action: 'access_settings' },
    'pages:access_refunds': { module: 'pages', action: 'access_refunds' },
    'pages:access_tickets': { module: 'pages', action: 'access_tickets' },
    'pages:access_help': { module: 'pages', action: 'access_help' },
    'pages:access_wallet': { module: 'pages', action: 'access_wallet' },
    'pages:access_promotions': { module: 'pages', action: 'access_promotions' },
    'pages:access_delivery_settings': { module: 'pages', action: 'access_delivery_settings' },
    'pages:access_dashboard': { module: 'pages', action: 'access_dashboard' },
    'pages:access_pos': { module: 'pages', action: 'access_pos' },
    'pages:access_checkout': { module: 'pages', action: 'access_checkout' },
    'pages:access_staff_management': { module: 'pages', action: 'access_staff_management' },
    'pages:access_inventory': { module: 'pages', action: 'access_inventory' },
    'pages:access_transactions': { module: 'pages', action: 'access_transactions' },
    'pages:access_discounts': { module: 'pages', action: 'access_discounts' },
    'pages:access_company_dashboard': { module: 'pages', action: 'access_company_dashboard' },
    'pages:access_shop_dashboard': { module: 'pages', action: 'access_shop_dashboard' },
    'pages:access_financial_overview': { module: 'pages', action: 'access_financial_overview' },
    'pages:access_pos_terminal': { module: 'pages', action: 'access_pos_terminal' },
    'pages:access_procurement': { module: 'pages', action: 'access_procurement' },
    'pages:access_production': { module: 'pages', action: 'access_production' },
    'pages:access_tax': { module: 'pages', action: 'access_tax' },

    // Procurement Module
    'procurement:access': { module: 'procurement', action: 'access' },
    'procurement:view_suppliers': { module: 'procurement', action: 'view_suppliers' },
    'procurement:manage_suppliers': { module: 'procurement', action: 'manage_suppliers' },
    'procurement:view_quotations': { module: 'procurement', action: 'view_quotations' },
    'procurement:manage_quotations': { module: 'procurement', action: 'manage_quotations' },
    'procurement:view_purchase_orders': { module: 'procurement', action: 'view_purchase_orders' },
    'procurement:manage_purchase_orders': { module: 'procurement', action: 'manage_purchase_orders' },
    'procurement:view_goods_received': { module: 'procurement', action: 'view_goods_received' },
    'procurement:manage_goods_received': { module: 'procurement', action: 'manage_goods_received' },
    'procurement:view_reports': { module: 'procurement', action: 'view_reports' },

    // Production Module
    'production:access': { module: 'production', action: 'access' },
    'production:view_recipes': { module: 'production', action: 'view_recipes' },
    'production:manage_recipes': { module: 'production', action: 'manage_recipes' },
    'production:view_orders': { module: 'production', action: 'view_orders' },
    'production:manage_orders': { module: 'production', action: 'manage_orders' },
    'production:view_dashboard': { module: 'production', action: 'view_dashboard' },
    'production:simulate_stock': { module: 'production', action: 'simulate_stock' },
    'production:view_cost_profit': { module: 'production', action: 'view_cost_profit' },

    // Tax Module
    'tax:access': { module: 'tax', action: 'access' },
    'tax:view_dashboard': { module: 'tax', action: 'view_dashboard' },
    'tax:manage_declarations': { module: 'tax', action: 'manage_declarations' },
    'tax:export_reports': { module: 'tax', action: 'export_reports' },

    // Legacy mappings for backward compatibility
    'customers:create': { module: 'users', action: 'add_users' },
    'customers:view': { module: 'users', action: 'access' },
    'customers:edit': { module: 'users', action: 'edit_users' },
    'customers:delete': { module: 'users', action: 'delete_users' },
    'sidebar:view': { module: 'checkout', action: 'access' },
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

  // Sync with pages module for sidebar visibility
  if (!privileges.pages) {
    privileges.pages = { access: false };
  }
  const pages = privileges.pages;
  Object.keys(privileges).forEach(module => {
    if (module !== 'pages' && (privileges[module as PrivilegeKey] as any)?.access) {
      const pageKey = `access_${module}`;
      (pages as any)[pageKey] = true;
      pages.access = true;
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
      merged[moduleKey] = { access: false };
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
