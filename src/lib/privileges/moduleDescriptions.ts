import { PrivilegeKey } from '@/types/privileges';

export interface ModuleAction {
  key: string;
  label: string;
  description: string;
}

export interface ModuleDescription {
  title: string;
  description: string;
  actions: ModuleAction[];
}

/**
 * Module descriptions for better UX in privilege management
 * Used by PrivilegeManager component to display detailed information about each module
 */
export const MODULE_DESCRIPTIONS: Record<PrivilegeKey, ModuleDescription> = {
  checkout: {
    title: 'Checkout & POS',
    description: 'Manage point-of-sale operations and order processing',
    actions: [
      { key: 'access', label: 'Access Checkout', description: 'Can access the checkout page' },
      {
        key: 'delete_pending_orders',
        label: 'Delete Pending Orders',
        description: 'Can delete orders that are pending',
      },
      {
        key: 'apply_discount',
        label: 'Apply Discounts',
        description: 'Can apply discounts to orders',
      },
      { key: 'view_orders', label: 'View Orders', description: 'Can view order details' },
      { key: 'create_orders', label: 'Create Orders', description: 'Can create new orders' },
      { key: 'edit_orders', label: 'Edit Orders', description: 'Can modify existing orders' },
      { key: 'cancel_orders', label: 'Cancel Orders', description: 'Can cancel orders' },
      { key: 'process_payment', label: 'Process Payment', description: 'Can process payments' },
      {
        key: 'view_customer_info',
        label: 'View Customer Info',
        description: 'Can view customer information',
      },
      {
        key: 'edit_customer_info',
        label: 'Edit Customer Info',
        description: 'Can edit customer information',
      },
    ],
  },
  staff_management: {
    title: 'Staff Management',
    description: 'Manage staff accounts and permissions',
    actions: [
      {
        key: 'access',
        label: 'Access Staff Management',
        description: 'Can access staff management page',
      },
      { key: 'view_accounts', label: 'View Accounts', description: 'Can view staff accounts' },
      {
        key: 'edit_accounts',
        label: 'Edit Accounts',
        description: 'Can edit staff account details',
      },
      {
        key: 'view_activity_logs',
        label: 'View Activity Logs',
        description: 'Can view staff activity logs',
      },
      {
        key: 'add_new_staff',
        label: 'Add New Staff',
        description: 'Can create new staff accounts',
      },
      { key: 'delete_staff', label: 'Delete Staff', description: 'Can delete staff accounts' },
      { key: 'assign_roles', label: 'Assign Roles', description: 'Can assign roles to staff' },
      {
        key: 'view_permissions',
        label: 'View Permissions',
        description: 'Can view staff permissions',
      },
      {
        key: 'edit_permissions',
        label: 'Edit Permissions',
        description: 'Can edit staff permissions',
      },
    ],
  },
  inventory: {
    title: 'Inventory Management',
    description: 'Manage product inventory and stock levels',
    actions: [
      { key: 'access', label: 'Access Inventory', description: 'Can access inventory page' },
      { key: 'view_products', label: 'View Products', description: 'Can view product listings' },
      { key: 'add_products', label: 'Add Products', description: 'Can add new products' },
      { key: 'edit_products', label: 'Edit Products', description: 'Can edit product details' },
      { key: 'delete_products', label: 'Delete Products', description: 'Can delete products' },
      {
        key: 'import_products',
        label: 'Import Products',
        description: 'Can import products from files',
      },
      { key: 'export_products', label: 'Export Products', description: 'Can export product data' },
      {
        key: 'manage_categories',
        label: 'Manage Categories',
        description: 'Can manage product categories',
      },
      {
        key: 'view_stock_levels',
        label: 'View Stock Levels',
        description: 'Can view current stock levels',
      },
      { key: 'update_stock', label: 'Update Stock', description: 'Can update stock quantities' },
    ],
  },
  transactions: {
    title: 'Transactions',
    description: 'View and manage financial transactions',
    actions: [
      { key: 'access', label: 'Access Transactions', description: 'Can access transactions page' },
      { key: 'view', label: 'View Transactions', description: 'Can view transaction history' },
      { key: 'refund', label: 'Process Refunds', description: 'Can process refunds' },
      { key: 'export', label: 'Export Data', description: 'Can export transaction data' },
      { key: 'view_details', label: 'View Details', description: 'Can view transaction details' },
      { key: 'process_refund', label: 'Process Refund', description: 'Can process refunds' },
      {
        key: 'view_receipts',
        label: 'View Receipts',
        description: 'Can view transaction receipts',
      },
      {
        key: 'print_receipts',
        label: 'Print Receipts',
        description: 'Can print transaction receipts',
      },
    ],
  },
  discounts: {
    title: 'Discounts & Promotions',
    description: 'Manage discount codes and promotional offers',
    actions: [
      { key: 'access', label: 'Access Discounts', description: 'Can access discounts page' },
      {
        key: 'create_discount',
        label: 'Create Discount',
        description: 'Can create new discount codes',
      },
      {
        key: 'delete_discount',
        label: 'Delete Discount',
        description: 'Can delete discount codes',
      },
      { key: 'edit_discount', label: 'Edit Discount', description: 'Can edit discount details' },
      { key: 'view_discounts', label: 'View Discounts', description: 'Can view discount listings' },
      {
        key: 'apply_discount',
        label: 'Apply Discount',
        description: 'Can apply discounts to orders',
      },
      {
        key: 'manage_discount_rules',
        label: 'Manage Rules',
        description: 'Can manage discount rules',
      },
    ],
  },
  company_dashboard: {
    title: 'Company Dashboard',
    description: 'View company-wide analytics and reports',
    actions: [
      { key: 'access', label: 'Access Dashboard', description: 'Can access company dashboard' },
      { key: 'view_reports', label: 'View Reports', description: 'Can view company reports' },
      { key: 'export_reports', label: 'Export Reports', description: 'Can export report data' },
      { key: 'view_analytics', label: 'View Analytics', description: 'Can view analytics data' },
      {
        key: 'view_revenue_data',
        label: 'View Revenue Data',
        description: 'Can view revenue information',
      },
      {
        key: 'view_performance_metrics',
        label: 'View Performance Metrics',
        description: 'Can view performance data',
      },
    ],
  },
  shop_dashboard: {
    title: 'Shop Dashboard',
    description: 'View shop-specific analytics and performance',
    actions: [
      { key: 'access', label: 'Access Dashboard', description: 'Can access shop dashboard' },
      {
        key: 'view_sales_data',
        label: 'View Sales Data',
        description: 'Can view sales information',
      },
      {
        key: 'manage_daily_targets',
        label: 'Manage Daily Targets',
        description: 'Can set and manage daily targets',
      },
      {
        key: 'view_shop_performance',
        label: 'View Shop Performance',
        description: 'Can view shop performance metrics',
      },
      {
        key: 'view_staff_performance',
        label: 'View Staff Performance',
        description: 'Can view staff performance data',
      },
      {
        key: 'view_customer_metrics',
        label: 'View Customer Metrics',
        description: 'Can view customer-related metrics',
      },
    ],
  },
  financial_overview: {
    title: 'Financial Overview',
    description: 'View and manage financial data and reports',
    actions: [
      {
        key: 'access',
        label: 'Access Financial Overview',
        description: 'Can access financial overview page',
      },
      { key: 'view_profits', label: 'View Profits', description: 'Can view profit information' },
      {
        key: 'export_financial_data',
        label: 'Export Financial Data',
        description: 'Can export financial data',
      },
      {
        key: 'view_revenue_reports',
        label: 'View Revenue Reports',
        description: 'Can view revenue reports',
      },
      {
        key: 'view_expense_reports',
        label: 'View Expense Reports',
        description: 'Can view expense reports',
      },
      {
        key: 'view_profit_margins',
        label: 'View Profit Margins',
        description: 'Can view profit margin data',
      },
    ],
  },
  pos_terminal: {
    title: 'POS Terminal',
    description: 'Point of sale terminal operations',
    actions: [
      { key: 'access', label: 'Access POS Terminal', description: 'Can access POS terminal' },
      { key: 'park_sale', label: 'Park Sale', description: 'Can park a sale for later' },
      { key: 'hold_order', label: 'Hold Order', description: 'Can hold an order' },
      { key: 'resume_order', label: 'Resume Order', description: 'Can resume a held order' },
      { key: 'process_sale', label: 'Process Sale', description: 'Can process a sale' },
      { key: 'view_cart', label: 'View Cart', description: 'Can view shopping cart' },
      { key: 'edit_cart', label: 'Edit Cart', description: 'Can edit shopping cart' },
      {
        key: 'apply_promotions',
        label: 'Apply Promotions',
        description: 'Can apply promotional offers',
      },
    ],
  },
  products: {
    title: 'Products',
    description: 'Manage product catalog and information',
    actions: [
      { key: 'access', label: 'Access Products', description: 'Can access products page' },
      { key: 'view_products', label: 'View Products', description: 'Can view product listings' },
      { key: 'add_products', label: 'Add Products', description: 'Can add new products' },
      { key: 'edit_products', label: 'Edit Products', description: 'Can edit product details' },
      { key: 'delete_products', label: 'Delete Products', description: 'Can delete products' },
      {
        key: 'import_products',
        label: 'Import Products',
        description: 'Can import products from files',
      },
      { key: 'export_products', label: 'Export Products', description: 'Can export product data' },
      {
        key: 'manage_categories',
        label: 'Manage Categories',
        description: 'Can manage product categories',
      },
      { key: 'view_analytics', label: 'View Analytics', description: 'Can view product analytics' },
    ],
  },
  orders: {
    title: 'Orders',
    description: 'Manage customer orders and order processing',
    actions: [
      { key: 'access', label: 'Access Orders', description: 'Can access orders page' },
      { key: 'view_orders', label: 'View Orders', description: 'Can view order listings' },
      { key: 'create_orders', label: 'Create Orders', description: 'Can create new orders' },
      { key: 'edit_orders', label: 'Edit Orders', description: 'Can edit order details' },
      { key: 'delete_orders', label: 'Delete Orders', description: 'Can delete orders' },
      { key: 'process_orders', label: 'Process Orders', description: 'Can process orders' },
      { key: 'cancel_orders', label: 'Cancel Orders', description: 'Can cancel orders' },
      { key: 'export_orders', label: 'Export Orders', description: 'Can export order data' },
      {
        key: 'view_order_history',
        label: 'View Order History',
        description: 'Can view order history',
      },
    ],
  },
  users: {
    title: 'Users',
    description: 'Manage user accounts and customer information',
    actions: [
      { key: 'access', label: 'Access Users', description: 'Can access users page' },
      { key: 'add_users', label: 'Add Users', description: 'Can add new users' },
      { key: 'edit_users', label: 'Edit Users', description: 'Can edit user details' },
      { key: 'delete_users', label: 'Delete Users', description: 'Can delete users' },
      { key: 'view_users', label: 'View Users', description: 'Can view user listings' },
      {
        key: 'manage_user_roles',
        label: 'Manage User Roles',
        description: 'Can manage user roles',
      },
      {
        key: 'view_user_activity',
        label: 'View User Activity',
        description: 'Can view user activity logs',
      },
    ],
  },
  shops: {
    title: 'Shops',
    description: 'Manage shop locations and settings',
    actions: [
      { key: 'access', label: 'Access Shops', description: 'Can access shops page' },
      { key: 'add_shops', label: 'Add Shops', description: 'Can add new shops' },
      { key: 'edit_shops', label: 'Edit Shops', description: 'Can edit shop details' },
      { key: 'delete_shops', label: 'Delete Shops', description: 'Can delete shops' },
      { key: 'view_shops', label: 'View Shops', description: 'Can view shop listings' },
      {
        key: 'manage_shop_settings',
        label: 'Manage Shop Settings',
        description: 'Can manage shop settings',
      },
      {
        key: 'view_shop_performance',
        label: 'View Shop Performance',
        description: 'Can view shop performance data',
      },
    ],
  },
  shoppers: {
    title: 'Shoppers',
    description: 'Manage shopper accounts and information',
    actions: [
      { key: 'access', label: 'Access Shoppers', description: 'Can access shoppers page' },
      { key: 'add_shoppers', label: 'Add Shoppers', description: 'Can add new shoppers' },
      { key: 'edit_shoppers', label: 'Edit Shoppers', description: 'Can edit shopper details' },
      { key: 'delete_shoppers', label: 'Delete Shoppers', description: 'Can delete shoppers' },
      { key: 'view_shoppers', label: 'View Shoppers', description: 'Can view shopper listings' },
      {
        key: 'manage_shopper_data',
        label: 'Manage Shopper Data',
        description: 'Can manage shopper data',
      },
      {
        key: 'view_shopper_history',
        label: 'View Shopper History',
        description: 'Can view shopper history',
      },
    ],
  },
  wallet: {
    title: 'Wallet',
    description: 'Manage wallet transactions and balances',
    actions: [
      { key: 'access', label: 'Access Wallet', description: 'Can access wallet page' },
      { key: 'view_wallet', label: 'View Wallet', description: 'Can view wallet information' },
      { key: 'add_funds', label: 'Add Funds', description: 'Can add funds to wallet' },
      { key: 'remove_funds', label: 'Remove Funds', description: 'Can remove funds from wallet' },
      { key: 'process_payout', label: 'Process Payout', description: 'Can process wallet payouts' },
      {
        key: 'view_transactions',
        label: 'View Transactions',
        description: 'Can view wallet transactions',
      },
      {
        key: 'manage_wallet_settings',
        label: 'Manage Wallet Settings',
        description: 'Can manage wallet settings',
      },
    ],
  },
  refunds: {
    title: 'Refunds',
    description: 'Manage refund requests and processing',
    actions: [
      { key: 'access', label: 'Access Refunds', description: 'Can access refunds page' },
      { key: 'view_refunds', label: 'View Refunds', description: 'Can view refund listings' },
      { key: 'process_refunds', label: 'Process Refunds', description: 'Can process refunds' },
      {
        key: 'approve_refunds',
        label: 'Approve Refunds',
        description: 'Can approve refund requests',
      },
      { key: 'reject_refunds', label: 'Reject Refunds', description: 'Can reject refund requests' },
      { key: 'export_refunds', label: 'Export Refunds', description: 'Can export refund data' },
      {
        key: 'view_refund_history',
        label: 'View Refund History',
        description: 'Can view refund history',
      },
    ],
  },
  tickets: {
    title: 'Tickets',
    description: 'Manage support tickets and customer service',
    actions: [
      { key: 'access', label: 'Access Tickets', description: 'Can access tickets page' },
      { key: 'view_tickets', label: 'View Tickets', description: 'Can view ticket listings' },
      { key: 'create_tickets', label: 'Create Tickets', description: 'Can create new tickets' },
      { key: 'edit_tickets', label: 'Edit Tickets', description: 'Can edit ticket details' },
      { key: 'delete_tickets', label: 'Delete Tickets', description: 'Can delete tickets' },
      {
        key: 'assign_tickets',
        label: 'Assign Tickets',
        description: 'Can assign tickets to staff',
      },
      { key: 'resolve_tickets', label: 'Resolve Tickets', description: 'Can resolve tickets' },
      { key: 'export_tickets', label: 'Export Tickets', description: 'Can export ticket data' },
    ],
  },
  help: {
    title: 'Help Center',
    description: 'Manage help articles and documentation',
    actions: [
      { key: 'access', label: 'Access Help', description: 'Can access help center' },
      {
        key: 'view_help_articles',
        label: 'View Help Articles',
        description: 'Can view help articles',
      },
      {
        key: 'create_help_articles',
        label: 'Create Help Articles',
        description: 'Can create new help articles',
      },
      {
        key: 'edit_help_articles',
        label: 'Edit Help Articles',
        description: 'Can edit help articles',
      },
      {
        key: 'delete_help_articles',
        label: 'Delete Help Articles',
        description: 'Can delete help articles',
      },
      {
        key: 'manage_help_categories',
        label: 'Manage Help Categories',
        description: 'Can manage help categories',
      },
    ],
  },
  settings: {
    title: 'Settings',
    description: 'Manage system settings and configuration',
    actions: [
      { key: 'access', label: 'Access Settings', description: 'Can access settings page' },
      { key: 'edit_settings', label: 'Edit Settings', description: 'Can edit system settings' },
      {
        key: 'manage_system_config',
        label: 'Manage System Config',
        description: 'Can manage system configuration',
      },
      {
        key: 'manage_notifications',
        label: 'Manage Notifications',
        description: 'Can manage notification settings',
      },
      { key: 'view_system_logs', label: 'View System Logs', description: 'Can view system logs' },
      { key: 'manage_backup', label: 'Manage Backup', description: 'Can manage backup settings' },
    ],
  },
  promotions: {
    title: 'Promotions',
    description: 'Manage promotional campaigns and offers',
    actions: [
      { key: 'access', label: 'Access Promotions', description: 'Can access promotions page' },
      {
        key: 'view_promotions',
        label: 'View Promotions',
        description: 'Can view promotion listings',
      },
      {
        key: 'create_promotions',
        label: 'Create Promotions',
        description: 'Can create new promotions',
      },
      {
        key: 'edit_promotions',
        label: 'Edit Promotions',
        description: 'Can edit promotion details',
      },
      {
        key: 'delete_promotions',
        label: 'Delete Promotions',
        description: 'Can delete promotions',
      },
      {
        key: 'manage_promotion_rules',
        label: 'Manage Promotion Rules',
        description: 'Can manage promotion rules',
      },
      {
        key: 'export_promotions',
        label: 'Export Promotions',
        description: 'Can export promotion data',
      },
    ],
  },
  delivery_settings: {
    title: 'Delivery Settings',
    description: 'Manage delivery zones and settings',
    actions: [
      {
        key: 'access',
        label: 'Access Delivery Settings',
        description: 'Can access delivery settings page',
      },
      {
        key: 'view_delivery_settings',
        label: 'View Delivery Settings',
        description: 'Can view delivery settings',
      },
      {
        key: 'edit_delivery_settings',
        label: 'Edit Delivery Settings',
        description: 'Can edit delivery settings',
      },
      {
        key: 'manage_delivery_zones',
        label: 'Manage Delivery Zones',
        description: 'Can manage delivery zones',
      },
      {
        key: 'manage_delivery_fees',
        label: 'Manage Delivery Fees',
        description: 'Can manage delivery fees',
      },
      {
        key: 'view_delivery_reports',
        label: 'View Delivery Reports',
        description: 'Can view delivery reports',
      },
    ],
  },
};

/**
 * Get module description for a specific module
 * @param module - The module key
 * @returns ModuleDescription or undefined if not found
 */
export const getModuleDescription = (module: PrivilegeKey): ModuleDescription | undefined => {
  return MODULE_DESCRIPTIONS[module];
};

/**
 * Get all available modules
 * @returns Array of all module keys
 */
export const getAllModules = (): PrivilegeKey[] => {
  return Object.keys(MODULE_DESCRIPTIONS) as PrivilegeKey[];
};
