// Project-level privilege system for developers, support, managers, and global admins
// These users manage the entire project/system, not individual stores

export interface ProjectModulePrivileges {
  access: boolean;
  [key: string]: boolean; // Additional action-specific privileges
}

export interface ProjectUserPrivileges {
  // Store Operations (No POS access for regular project users)
  orders?: ProjectModulePrivileges;
  shoppers?: ProjectModulePrivileges;
  users?: ProjectModulePrivileges;
  shops?: ProjectModulePrivileges;
  products?: ProjectModulePrivileges;
  wallet?: ProjectModulePrivileges;
  refunds?: ProjectModulePrivileges;
  tickets?: ProjectModulePrivileges;
  help?: ProjectModulePrivileges;

  // Additional Store Modules
  dashboard?: ProjectModulePrivileges;
  delivery_settings?: ProjectModulePrivileges;
  promotions?: ProjectModulePrivileges;
  settings?: ProjectModulePrivileges;
  restaurants?: ProjectModulePrivileges;

  // POS Operations (Only for Global System Admin)
  checkout?: ProjectModulePrivileges;
  staff_management?: ProjectModulePrivileges;
  inventory?: ProjectModulePrivileges;
  transactions?: ProjectModulePrivileges;
  discounts?: ProjectModulePrivileges;
  company_dashboard?: ProjectModulePrivileges;
  shop_dashboard?: ProjectModulePrivileges;
  financial_overview?: ProjectModulePrivileges;
  pos_terminal?: ProjectModulePrivileges;

  // System Management
  system_management?: ProjectModulePrivileges;
  user_management?: ProjectModulePrivileges;
  project_users?: ProjectModulePrivileges;
  analytics?: ProjectModulePrivileges;
  reporting?: ProjectModulePrivileges;
  support_management?: ProjectModulePrivileges;
  help_management?: ProjectModulePrivileges;
  system_configuration?: ProjectModulePrivileges;
  global_settings?: ProjectModulePrivileges;
  security_management?: ProjectModulePrivileges;
  access_control?: ProjectModulePrivileges;
  system_monitoring?: ProjectModulePrivileges;
  audit_logs?: ProjectModulePrivileges;
  development_tools?: ProjectModulePrivileges;
  maintenance?: ProjectModulePrivileges;

  // Page Access
  pages?: ProjectModulePrivileges;
  referrals?: ProjectModulePrivileges;
  plasmarket?: ProjectModulePrivileges;
  withdraw_requests?: ProjectModulePrivileges;
}

// Default project privileges template
export const DEFAULT_PROJECT_PRIVILEGES: ProjectUserPrivileges = {
  // Store Operations (No POS access)
  orders: {
    access: false,
    view_orders: false,
    create_orders: false,
    edit_orders: false,
    delete_orders: false,
    process_orders: false,
    view_order_details: false,
    update_order_status: false,
    assign_delivery: false,
  },
  shoppers: {
    access: false,
    view_shoppers: false,
    add_shoppers: false,
    edit_shoppers: false,
    delete_shoppers: false,
    view_shopper_details: false,
    view_shopper_orders: false,
    view_shopper_wallet: false,
    view_shopper_ratings: false,
  },
  users: {
    access: false,
    view_users: false,
    add_users: false,
    edit_users: false,
    delete_users: false,
    view_user_details: false,
    manage_user_roles: false,
    view_user_activity: false,
  },
  shops: {
    access: false,
    view_shops: false,
    add_shops: false,
    edit_shops: false,
    delete_shops: false,
    view_shop_details: false,
    manage_shop_settings: false,
    view_shop_performance: false,
  },
  products: {
    access: false,
    view_products: false,
    add_products: false,
    edit_products: false,
    delete_products: false,
    import_products: false,
    export_products: false,
    manage_categories: false,
    view_analytics: false,
  },
  wallet: {
    access: false,
    view_wallets: false,
    process_payouts: false,
    view_transactions: false,
    manage_wallet_settings: false,
    view_balance: false,
    export_wallet_data: false,
  },
  refunds: {
    access: false,
    view_refunds: false,
    process_refunds: false,
    approve_refunds: false,
    reject_refunds: false,
    view_refund_details: false,
    export_refund_data: false,
  },
  tickets: {
    access: false,
    view_tickets: false,
    create_tickets: false,
    edit_tickets: false,
    delete_tickets: false,
    assign_tickets: false,
    resolve_tickets: false,
    view_ticket_details: false,
  },
  help: {
    access: false,
    view_help: false,
    search_help: false,
    view_categories: false,
    view_articles: false,
  },
  dashboard: {
    access: false,
    view_dashboard: false,
    view_reports: false,
    view_analytics: false,
  },
  delivery_settings: {
    access: false,
    view_delivery_settings: false,
    edit_delivery_settings: false,
    manage_delivery_zones: false,
    set_delivery_fees: false,
    configure_delivery_times: false,
  },
  promotions: {
    access: false,
    view_promotions: false,
    create_promotions: false,
    edit_promotions: false,
    delete_promotions: false,
    activate_promotions: false,
    deactivate_promotions: false,
    view_promotion_analytics: false,
  },
  settings: {
    access: false,
    view_settings: false,
    edit_settings: false,
    manage_system_config: false,
    view_audit_logs: false,
    manage_notifications: false,
  },
  restaurants: {
    access: false,
    view_restaurants: false,
    add_restaurants: false,
    edit_restaurants: false,
    delete_restaurants: false,
    view_restaurant_details: false,
    manage_restaurant_settings: false,
    view_restaurant_performance: false,
  },
  // POS Operations (Only for Global System Admin)
  checkout: {
    access: false,
    delete_pending_orders: false,
    apply_discount: false,
    view_orders: false,
    create_orders: false,
    edit_orders: false,
    cancel_orders: false,
    process_payment: false,
    view_customer_info: false,
    edit_customer_info: false,
  },
  staff_management: {
    access: false,
    view_accounts: false,
    edit_accounts: false,
    view_activity_logs: false,
    add_new_staff: false,
    delete_staff: false,
    assign_roles: false,
    view_permissions: false,
    edit_permissions: false,
  },
  inventory: {
    access: false,
    view_products: false,
    add_products: false,
    edit_products: false,
    delete_products: false,
    import_products: false,
    export_products: false,
    manage_categories: false,
    view_stock_levels: false,
    update_stock: false,
  },
  transactions: {
    access: false,
    view: false,
    refund: false,
    export: false,
    view_details: false,
    process_refund: false,
    view_receipts: false,
    print_receipts: false,
  },
  discounts: {
    access: false,
    create_discount: false,
    delete_discount: false,
    edit_discount: false,
    view_discounts: false,
    apply_discount: false,
    manage_discount_rules: false,
  },
  company_dashboard: {
    access: false,
    view_reports: false,
    export_reports: false,
    view_analytics: false,
    view_revenue_data: false,
    view_performance_metrics: false,
  },
  shop_dashboard: {
    access: false,
    view_sales_data: false,
    manage_daily_targets: false,
    view_shop_performance: false,
    view_staff_performance: false,
    view_customer_metrics: false,
  },
  financial_overview: {
    access: false,
    view_profits: false,
    export_financial_data: false,
    view_revenue_reports: false,
    view_expense_reports: false,
    view_profit_margins: false,
  },
  pos_terminal: {
    access: false,
    park_sale: false,
    hold_order: false,
    resume_order: false,
    process_sale: false,
    view_cart: false,
    edit_cart: false,
    apply_promotions: false,
  },
  system_management: {
    access: false,
    view_system_status: false,
    manage_system_health: false,
    system_maintenance: false,
    performance_monitoring: false,
  },
  user_management: {
    access: false,
    view_all_users: false,
    create_users: false,
    edit_users: false,
    delete_users: false,
    manage_user_roles: false,
    view_user_activity: false,
  },
  project_users: {
    access: false,
    view_project_users: false,
    add_project_users: false,
    edit_project_users: false,
    delete_project_users: false,
    view_project_user_details: false,
    manage_project_user_roles: false,
    view_project_user_activity: false,
  },
  analytics: {
    access: false,
    view_analytics: false,
    export_reports: false,
    create_custom_reports: false,
    view_performance_metrics: false,
  },
  reporting: {
    access: false,
    generate_reports: false,
    schedule_reports: false,
    view_report_history: false,
    export_data: false,
  },
  support_management: {
    access: false,
    view_support_tickets: false,
    manage_tickets: false,
    assign_tickets: false,
    resolve_tickets: false,
    view_support_analytics: false,
  },
  help_management: {
    access: false,
    manage_help_content: false,
    create_help_articles: false,
    edit_help_articles: false,
    delete_help_articles: false,
    manage_help_categories: false,
  },
  system_configuration: {
    access: false,
    view_configuration: false,
    edit_configuration: false,
    manage_feature_flags: false,
    system_parameters: false,
  },
  global_settings: {
    access: false,
    view_global_settings: false,
    edit_global_settings: false,
    manage_global_config: false,
    system_preferences: false,
  },
  security_management: {
    access: false,
    view_security_settings: false,
    manage_security_policies: false,
    view_security_logs: false,
    manage_authentication: false,
  },
  access_control: {
    access: false,
    manage_permissions: false,
    view_access_logs: false,
    manage_roles: false,
    audit_access: false,
  },
  system_monitoring: {
    access: false,
    view_system_metrics: false,
    monitor_performance: false,
    view_alerts: false,
    manage_monitoring: false,
  },
  audit_logs: {
    access: false,
    view_audit_logs: false,
    export_audit_logs: false,
    search_audit_logs: false,
    manage_audit_settings: false,
  },
  development_tools: {
    access: false,
    view_development_tools: false,
    manage_development_settings: false,
    access_debug_tools: false,
    manage_development_config: false,
  },
  maintenance: {
    access: false,
    perform_maintenance: false,
    schedule_maintenance: false,
    view_maintenance_logs: false,
    manage_maintenance_schedule: false,
  },
  pages: {
    access: false,
    view_pages: false,
    access_project_users: false,
    access_orders: false,
    access_shops: false,
    access_products: false,
    access_users: false,
    access_shoppers: false,
    access_settings: false,
    access_refunds: false,
    access_tickets: false,
    access_help: false,
    access_wallet: false,
    access_promotions: false,
    access_delivery_settings: false,
    access_dashboard: false,
    access_pos: false,
    access_checkout: false,
    access_staff_management: false,
    access_inventory: false,
    access_transactions: false,
    access_discounts: false,
    access_company_dashboard: false,
    access_shop_dashboard: false,
    access_financial_overview: false,
    access_pos_terminal: false,
    access_referrals: false,
  },
  referrals: {
    access: false,
    view_data: false,
    export_data: false,
  },
  plasmarket: {
    access: false,
    view_businesses: false,
    delete_business: false,
    export_data: false,
  },
  withdraw_requests: {
    access: false,
    view: false,
    approve: false,
    reject: false,
  },
};

// Project privilege check helper types
export type ProjectPrivilegeKey = keyof ProjectUserPrivileges;
export type ProjectActionKey<T extends ProjectPrivilegeKey> = keyof NonNullable<
  ProjectUserPrivileges[T]
>;

// Helper function to check if project user has a specific privilege
export function hasProjectPrivilege(
  projectPrivileges: ProjectUserPrivileges | null | undefined,
  module: ProjectPrivilegeKey,
  action?: string,
  role?: string
): boolean {
  // Hard-coded override for Referrals for admin roles
  const isAdminRole = role === 'projectAdmin' || role === 'systemAdmin';

  if (
    isAdminRole &&
    (module === 'referrals' ||
      module === 'help' ||
      module === 'plasmarket' ||
      module === 'restaurants' ||
      module === 'withdraw_requests' ||
      (module === 'pages' && (action === 'access_referrals' || action === 'access_help' || action === 'access_plasmarket' || action === 'access_restaurants' || action === 'access_withdraw_requests')))
  ) {
    return true;
  }

  if (!projectPrivileges || !projectPrivileges[module]) {
    return false;
  }

  const modulePrivileges = projectPrivileges[module] as ProjectModulePrivileges;

  // If no specific action requested, check module access
  if (!action) {
    return modulePrivileges.access || false;
  }

  // Check specific action privilege
  return modulePrivileges[action] || false;
}

// Helper function to get all privileges for a project module
export function getProjectModulePrivileges(
  projectPrivileges: ProjectUserPrivileges | null | undefined,
  module: ProjectPrivilegeKey
): ProjectModulePrivileges | null {
  if (!projectPrivileges || !projectPrivileges[module]) {
    return null;
  }
  return projectPrivileges[module] as ProjectModulePrivileges;
}
