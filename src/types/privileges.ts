// Privilege system types for fine-grained RBAC
export interface ModulePrivileges {
  access: boolean;
  [key: string]: boolean; // Additional action-specific privileges
}

export interface UserPrivileges {
  checkout?: ModulePrivileges;
  staff_management?: ModulePrivileges;
  inventory?: ModulePrivileges;
  transactions?: ModulePrivileges;
  discounts?: ModulePrivileges;
  company_dashboard?: ModulePrivileges;
  shop_dashboard?: ModulePrivileges;
  financial_overview?: ModulePrivileges;
  pos_terminal?: ModulePrivileges;
  orders?: ModulePrivileges;
  products?: ModulePrivileges;
  users?: ModulePrivileges;
  project_users?: ModulePrivileges;
  shops?: ModulePrivileges;
  restaurants?: ModulePrivileges;
  shoppers?: ModulePrivileges;
  settings?: ModulePrivileges;
  refunds?: ModulePrivileges;
  tickets?: ModulePrivileges;
  help?: ModulePrivileges;
  wallet?: ModulePrivileges;
  promotions?: ModulePrivileges;
  delivery_settings?: ModulePrivileges;
  pages?: ModulePrivileges;
  referrals?: ModulePrivileges;
  plasmarket?: ModulePrivileges;
  withdraw_requests?: ModulePrivileges;
  procurement?: ModulePrivileges;
  production?: ModulePrivileges;
  // Granular Production Modules
  recipes?: ModulePrivileges;
  production_orders?: ModulePrivileges;
  production_dashboard?: ModulePrivileges;
  cost_profit?: ModulePrivileges;
  simulate_stock?: ModulePrivileges;
  // Granular Procurement Modules
  procurement_dashboard?: ModulePrivileges;
  suppliers?: ModulePrivileges;
  quotations?: ModulePrivileges;
  purchase_orders?: ModulePrivileges;
  // Others from DB
  reels?: ModulePrivileges;
  point_of_sale?: ModulePrivileges;
  tax?: ModulePrivileges;
  ai_chat?: ModulePrivileges;
  subscriptions?: ModulePrivileges;
  influencers?: ModulePrivileges;
}

// Default privilege templates for each module
export const DEFAULT_PRIVILEGES: UserPrivileges = {
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
  settings: {
    access: false,
    view_settings: false,
    edit_settings: false,
    manage_system_config: false,
    view_audit_logs: false,
    manage_notifications: false,
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
  wallet: {
    access: false,
    view_wallets: false,
    process_payouts: false,
    view_transactions: false,
    manage_wallet_settings: false,
    view_balance: false,
    export_wallet_data: false,
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
  delivery_settings: {
    access: false,
    view_delivery_settings: false,
    edit_delivery_settings: false,
    manage_delivery_zones: false,
    set_delivery_fees: false,
    configure_delivery_times: false,
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
    access_procurement: false,
    access_production: false,
    access_tax: false,
    access_ai_chat: false,
    access_subscriptions: false,
    access_reels: false,
  },
  referrals: {
    access: false,
    view_data: false,
    export_data: false,
  },
  plasmarket: {
    access: false,
    view_businesses: false,
    manage_status: false,
    delete_business: false,
    export_data: false,
  },
  withdraw_requests: {
    access: false,
    view: false,
    approve: false,
    reject: false,
  },
  procurement: {
    access: false,
    view_suppliers: false,
    manage_suppliers: false,
    view_quotations: false,
    manage_quotations: false,
    view_purchase_orders: false,
    manage_purchase_orders: false,
    view_goods_received: false,
    manage_goods_received: false,
    view_reports: false,
  },
  production: {
    access: false,
    view_recipes: false,
    manage_recipes: false,
    view_orders: false,
    manage_orders: false,
    view_dashboard: false,
    simulate_stock: false,
    view_cost_profit: false,
  },
  // Granular Production
  recipes: { access: false, view: false, manage: false },
  production_orders: { access: false, view: false, manage: false },
  production_dashboard: { access: false, view: false },
  cost_profit: { access: false, view: false },
  simulate_stock: { access: false, view: false, run: false },
  // Granular Procurement
  procurement_dashboard: { access: false, view: false },
  suppliers: { access: false, view: false, manage: false },
  quotations: { access: false, view: false, manage: false },
  purchase_orders: { access: false, view: false, manage: false },
  // Others
  reels: { access: false, view: false, manage: false },
  point_of_sale: { access: false, park_sale: false, process_sale: false },
  tax: {
    access: false,
    view_dashboard: false,
    manage_declarations: false,
    export_reports: false,
  },
  ai_chat: {
    access: false,
    use_chat: false,
  },
  influencers: {
    access: false,
    view_earnings: false,
    manage_influencers: false,
  },
};

// Privilege check helper types
export type PrivilegeKey = keyof UserPrivileges;
export type ActionKey<T extends PrivilegeKey> = keyof NonNullable<UserPrivileges[T]>;

// Helper function to check if user has a specific privilege
export function hasPrivilege(
  userPrivileges: UserPrivileges | null | undefined,
  module: PrivilegeKey,
  action?: string,
  role?: string
): boolean {
  // Hard-coded override for Referrals for admin roles
  // This ensures existing admins get access even if their stored JSON is outdated
  const isAdminRole = role === 'globalAdmin' || role === 'projectAdmin' || role === 'systemAdmin';

  if (
    isAdminRole &&
    (module === 'referrals' ||
      module === 'help' ||
      module === 'plasmarket' ||
      module === 'restaurants' ||
      module === 'reels' ||
      module === 'withdraw_requests' ||
      (module === 'pages' &&
        (action === 'access_referrals' ||
          action === 'access_help' ||
          action === 'access_plasmarket' ||
          action === 'access_restaurants' ||
          action === 'access_reels' ||
          action === 'access_withdraw_requests')))
  ) {
    return true;
  }

  if (!userPrivileges || !userPrivileges[module]) {
    return false;
  }

  const modulePrivileges = userPrivileges[module] as ModulePrivileges;

  // If no specific action requested, check module access
  if (!action) {
    return modulePrivileges.access || false;
  }

  // Check specific action privilege
  return modulePrivileges[action] || false;
}

// Helper function to get all privileges for a module
export function getModulePrivileges(
  userPrivileges: UserPrivileges | null | undefined,
  module: PrivilegeKey
): ModulePrivileges | null {
  if (!userPrivileges || !userPrivileges[module]) {
    return null;
  }
  return userPrivileges[module] as ModulePrivileges;
}
