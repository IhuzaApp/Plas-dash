import { PrivilegeKey } from '@/types/privileges';

export interface ModuleAction {
  key: string;
  label: string;
  description: string;
}

export interface ModuleDescription {
  title: string;
  group: string;
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
    group: 'Operations',
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
    group: 'Staff & Access',
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
    group: 'Inventory & Catalog',
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
    group: 'Finance',
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
    group: 'Finance',
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
    group: 'Dashboards',
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
    group: 'Dashboards',
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
    group: 'Finance',
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
    group: 'Operations',
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
    group: 'Inventory & Catalog',
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
    group: 'Operations',
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
    group: 'Staff & Access',
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
    group: 'System',
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
    group: 'Engagement & CRM',
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
    title: 'Wallet Operations',
    group: 'Finance',
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
    group: 'Finance',
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
    group: 'Engagement & CRM',
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
    group: 'Engagement & CRM',
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
    group: 'System',
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
    group: 'Engagement & CRM',
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
    group: 'Logistics & Suppliers',
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
  referrals: {
    title: 'Referrals',
    group: 'Engagement & CRM',
    description: 'Track and manage user referrals and statistics',
    actions: [
      { key: 'access', label: 'Access Referrals', description: 'Can access referrals page' },
      { key: 'view_data', label: 'View Data', description: 'Can view referral window data' },
      { key: 'export_data', label: 'Export Data', description: 'Can export referral records' },
    ],
  },
  project_users: {
    title: 'Project Users',
    group: 'Staff & Access',
    description: 'Manage project-specific user roles and access',
    actions: [
      {
        key: 'access',
        label: 'Access Project Users',
        description: 'Can access project users page',
      },
    ],
  },
  restaurants: {
    title: 'Restaurants',
    group: 'System',
    description: 'Manage restaurant listings and menus',
    actions: [
      { key: 'access', label: 'Access Restaurants', description: 'Can access restaurants page' },
      {
        key: 'view_restaurants',
        label: 'View Restaurants',
        description: 'Can view restaurant listings',
      },
      { key: 'add_restaurants', label: 'Add Restaurants', description: 'Can add new restaurants' },
      {
        key: 'edit_restaurants',
        label: 'Edit Restaurants',
        description: 'Can edit restaurant details',
      },
      {
        key: 'delete_restaurants',
        label: 'Delete Restaurants',
        description: 'Can delete restaurants',
      },
      {
        key: 'view_restaurant_details',
        label: 'View Details',
        description: 'Can view detailed restaurant info',
      },
      {
        key: 'manage_restaurant_settings',
        label: 'Manage Settings',
        description: 'Can manage restaurant settings',
      },
      {
        key: 'view_restaurant_performance',
        label: 'View Performance',
        description: 'Can view restaurant performance',
      },
    ],
  },
  // Granular Production Modules
  recipes: {
    title: 'Recipes',
    group: 'Inventory & Catalog',
    description: 'Manage food and product recipes',
    actions: [
      { key: 'access', label: 'Access Recipes', description: 'Can access recipes page' },
      { key: 'view', label: 'View Recipes', description: 'Can view recipe details' },
      {
        key: 'manage',
        label: 'Manage Recipes',
        description: 'Can create, edit and delete recipes',
      },
    ],
  },
  production_orders: {
    title: 'Production Orders',
    group: 'Inventory & Catalog',
    description: 'Manage manufacturing and kitchen orders',
    actions: [
      { key: 'access', label: 'Access Orders', description: 'Can access production orders' },
      { key: 'view', label: 'View Orders', description: 'Can view production order status' },
      { key: 'manage', label: 'Manage Orders', description: 'Can create and fulfill orders' },
    ],
  },
  production_dashboard: {
    title: 'Production Dashboard',
    group: 'Dashboards',
    description: 'Overview of kitchen and production activity',
    actions: [
      { key: 'access', label: 'Access Dashboard', description: 'Can access production dashboard' },
      { key: 'view', label: 'View Analytics', description: 'Can view production metrics' },
    ],
  },
  cost_profit: {
    title: 'Cost & Profit',
    group: 'Finance',
    description: 'Analyze production costs and margins',
    actions: [
      { key: 'access', label: 'Access Analytics', description: 'Can access cost & profit data' },
      { key: 'view', label: 'View Reports', description: 'Can view financial production reports' },
    ],
  },
  simulate_stock: {
    title: 'Simulate Stock',
    group: 'Inventory & Catalog',
    description: 'Run stock deduction and requirement simulations',
    actions: [
      { key: 'access', label: 'Access Simulator', description: 'Can access stock simulator' },
      { key: 'view', label: 'View Results', description: 'Can view simulation outcomes' },
      { key: 'run', label: 'Run Simulation', description: 'Can execute new simulations' },
    ],
  },
  // Granular Procurement Modules
  procurement_dashboard: {
    title: 'Procurement Dashboard',
    group: 'Dashboards',
    description: 'Overview of supply chain and purchasing',
    actions: [
      { key: 'access', label: 'Access Dashboard', description: 'Can access procurement dashboard' },
      { key: 'view', label: 'View Metrics', description: 'Can view purchasing analytics' },
    ],
  },
  suppliers: {
    title: 'Suppliers',
    group: 'Logistics & Suppliers',
    description: 'Manage vendors and supplier directories',
    actions: [
      { key: 'access', label: 'Access Suppliers', description: 'Can access suppliers page' },
      { key: 'view', label: 'View Suppliers', description: 'Can view vendor details' },
      {
        key: 'manage',
        label: 'Manage Suppliers',
        description: 'Can create and edit vendor profiles',
      },
    ],
  },
  quotations: {
    title: 'Quotations',
    group: 'Logistics & Suppliers',
    description: 'Manage supplier price quotes and bids',
    actions: [
      { key: 'access', label: 'Access Quotations', description: 'Can access quotations page' },
      { key: 'view', label: 'View Quotations', description: 'Can view price quotes' },
      { key: 'manage', label: 'Manage Quotations', description: 'Can create and compare quotes' },
    ],
  },
  purchase_orders: {
    title: 'Purchase Orders',
    group: 'Logistics & Suppliers',
    description: 'Manage procurement orders and fulfillment',
    actions: [
      { key: 'access', label: 'Access POs', description: 'Can access purchase orders' },
      { key: 'view', label: 'View POs', description: 'Can view order status' },
      { key: 'manage', label: 'Manage POs', description: 'Can create and approve purchase orders' },
    ],
  },
  // Others
  reels: {
    title: 'Reels',
    group: 'Operations',
    description: 'Manage short video content and engagement',
    actions: [
      { key: 'access', label: 'Access Reels', description: 'Can access reels management' },
      { key: 'view', label: 'View Reels', description: 'Can view video content' },
      { key: 'manage', label: 'Manage Content', description: 'Can upload and edit reels' },
    ],
  },
  point_of_sale: {
    title: 'Point of Sale',
    group: 'Operations',
    description: 'Unified point of sale operations',
    actions: [
      { key: 'access', label: 'Access POS', description: 'Can access the POS system' },
      { key: 'park_sale', label: 'Park Sale', description: 'Can put sales on hold' },
      { key: 'process_sale', label: 'Process Sale', description: 'Can complete transactions' },
    ],
  },
  pages: {
    title: 'Pages',
    group: 'System',
    description: 'Manage custom pages and content',
    actions: [{ key: 'access', label: 'Access Pages', description: 'Can access pages management' }],
  },
  plasmarket: {
    title: 'PlasMarket',
    group: 'System',
    description: 'Manage the business directory and global marketplace',
    actions: [
      {
        key: 'access',
        label: 'Access PlasMarket',
        description: 'Can view the PlasMarket dashboard',
      },
      {
        key: 'view_businesses',
        label: 'View Businesses',
        description: 'Can view individual business accounts',
      },
      {
        key: 'manage_status',
        label: 'Manage Account Status',
        description: 'Can put business accounts on hold or re-activate them',
      },
      {
        key: 'export_data',
        label: 'Export Data',
        description: 'Can export business directories to CSV',
      },
      {
        key: 'delete_business',
        label: 'Delete Business',
        description: 'Can permanently delete business accounts',
      },
    ],
  },
  influencers: {
    title: 'Influencers',
    group: 'Marketing',
    description: 'Manage influencer profiles, commissions, and earnings',
    actions: [
      { key: 'access', label: 'Access Influencers', description: 'Can access influencers page' },
      { key: 'view_earnings', label: 'View Earnings', description: 'Can view influencer earnings' },
      {
        key: 'manage_influencers',
        label: 'Manage Influencers',
        description: 'Can create, edit, and delete influencers',
      },
    ],
  },
  withdraw_requests: {
    title: 'Withdraw Requests',
    group: 'Finance',
    description: 'Manage shopper and business wallet withdraw requests',
    actions: [
      {
        key: 'access',
        label: 'Access Withdraw Requests',
        description: 'Can view the withdraw requests dashboard',
      },
      {
        key: 'view',
        label: 'View Request Details',
        description: 'Can view individual withdraw request details',
      },
      { key: 'approve', label: 'Approve Requests', description: 'Can approve withdraw requests' },
      { key: 'reject', label: 'Reject Requests', description: 'Can reject withdraw requests' },
    ],
  },
  procurement: {
    title: 'Procurement',
    group: 'Logistics & Suppliers',
    description: 'Manage back-office procurement operations',
    actions: [
      { key: 'access', label: 'Access', description: 'Can access procurement module' },
      { key: 'view_suppliers', label: 'View Suppliers', description: 'Can view suppliers' },
      { key: 'manage_suppliers', label: 'Manage Suppliers', description: 'Can manage suppliers' },
      { key: 'view_quotations', label: 'View Quotations', description: 'Can view quotations' },
      {
        key: 'manage_quotations',
        label: 'Manage Quotations',
        description: 'Can manage quotations',
      },
      {
        key: 'view_purchase_orders',
        label: 'View Purchase Orders',
        description: 'Can view purchase orders',
      },
      {
        key: 'manage_purchase_orders',
        label: 'Manage Purchase Orders',
        description: 'Can manage purchase orders',
      },
      {
        key: 'view_goods_received',
        label: 'View Goods Received',
        description: 'Can view goods received',
      },
      {
        key: 'manage_goods_received',
        label: 'Manage Goods Received',
        description: 'Can manage goods received',
      },
      { key: 'view_reports', label: 'View Reports', description: 'Can view procurement reports' },
    ],
  },
  production: {
    title: 'Production & Recipes',
    group: 'Inventory & Catalog',
    description: 'Manage recipes, production orders, and stock simulations',
    actions: [
      { key: 'access', label: 'Access Production', description: 'Can access production module' },
      { key: 'view_recipes', label: 'View Recipes', description: 'Can view recipe listings' },
      {
        key: 'manage_recipes',
        label: 'Manage Recipes',
        description: 'Can create, edit, and delete recipes',
      },
      {
        key: 'view_orders',
        label: 'View Production Orders',
        description: 'Can view production orders',
      },
      {
        key: 'manage_orders',
        label: 'Manage Production Orders',
        description: 'Can create and manage production orders',
      },
      {
        key: 'view_dashboard',
        label: 'View Dashboard',
        description: 'Can view production dashboard',
      },
      {
        key: 'simulate_stock',
        label: 'Simulate Stock',
        description: 'Can run stock deduction simulations',
      },
      {
        key: 'view_cost_profit',
        label: 'View Cost & Profit',
        description: 'Can view cost and profit analysis',
      },
    ],
  },
  tax: {
    title: 'Tax & Forecasting',
    group: 'Finance',
    description: 'Manage tax declarations and forecast tax liabilities',
    actions: [
      { key: 'access', label: 'Access Tax', description: 'Can access tax module' },
      { key: 'view_dashboard', label: 'View Dashboard', description: 'Can view tax dashboards' },
      {
        key: 'manage_declarations',
        label: 'Manage Declarations',
        description: 'Can manage tax declarations',
      },
      { key: 'export_reports', label: 'Export Reports', description: 'Can export tax reports' },
    ],
  },
  ai_chat: {
    title: 'AI Chat',
    group: 'Engagement & CRM',
    description: 'Access and utilize the AI assistant for reporting and queries',
    actions: [
      { key: 'access', label: 'Access AI Chat', description: 'Can access the AI chat page' },
      { key: 'use_chat', label: 'Use Chat', description: 'Can send messages to the AI assistant' },
    ],
  },
  subscriptions: {
    title: 'Subscriptions',
    group: 'System',
    description: 'Manage SaaS subscriptions, plans, and feature limits',
    actions: [
      {
        key: 'access',
        label: 'Access Subscriptions',
        description: 'Can access the subscriptions module',
      },
      {
        key: 'manage_plans',
        label: 'Manage Plans',
        description: 'Can view, create, edit, and delete subscription plans',
      },
      {
        key: 'manage_modules',
        label: 'Manage Modules',
        description: 'Can view, create, edit, and delete software modules',
      },
      {
        key: 'assign_plan_modules',
        label: 'Assign Plan Modules',
        description: 'Can link modules to subscription plans',
      },
      {
        key: 'manage_shop_subscriptions',
        label: 'Manage Shop Subscriptions',
        description: 'Can view and modify active shop subscriptions',
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
