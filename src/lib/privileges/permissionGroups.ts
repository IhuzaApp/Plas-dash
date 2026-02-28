import { PrivilegeKey } from '@/types/privileges';

export interface Permission {
  key: string;
  label: string;
}

export interface PermissionGroup {
  title: string;
  module: PrivilegeKey;
  permissions: Permission[];
}

export const permissionGroups: PermissionGroup[] = [
  {
    title: 'Checkout & POS',
    module: 'checkout' as PrivilegeKey,
    permissions: [
      { key: 'access', label: 'Access Checkout' },
      { key: 'view_orders', label: 'View Orders' },
      { key: 'create_orders', label: 'Create Orders' },
      { key: 'edit_orders', label: 'Edit Orders' },
      { key: 'delete_orders', label: 'Delete Orders' },
      { key: 'process_payment', label: 'Process Payment' },
      { key: 'view_customer_info', label: 'View Customer Info' },
      { key: 'edit_customer_info', label: 'Edit Customer Info' },
      { key: 'delete_pending_orders', label: 'Delete Pending Orders' },
      { key: 'apply_discount', label: 'Apply Discount' },
    ],
  },
  {
    title: 'Staff Management',
    module: 'staff_management' as PrivilegeKey,
    permissions: [
      { key: 'access', label: 'Access Staff Management' },
      { key: 'add_new_staff', label: 'Add New Staff' },
      { key: 'assign_roles', label: 'Assign Roles' },
      { key: 'view_permissions', label: 'View Permissions' },
      { key: 'view_accounts', label: 'View Accounts' },
      { key: 'edit_accounts', label: 'Edit Accounts' },
      { key: 'delete_staff', label: 'Delete Staff' },
      { key: 'edit_permissions', label: 'Edit Permissions' },
      { key: 'view_activity_logs', label: 'View Activity Logs' },
    ],
  },
  {
    title: 'Inventory Management',
    module: 'inventory' as PrivilegeKey,
    permissions: [
      { key: 'access', label: 'Access Inventory' },
      { key: 'view_products', label: 'View Products' },
      { key: 'add_products', label: 'Add Products' },
      { key: 'edit_products', label: 'Edit Products' },
      { key: 'delete_products', label: 'Delete Products' },
      { key: 'import_products', label: 'Import Products' },
      { key: 'export_products', label: 'Export Products' },
      { key: 'manage_categories', label: 'Manage Categories' },
      { key: 'view_stock_levels', label: 'View Stock Levels' },
      { key: 'update_stock', label: 'Update Stock' },
    ],
  },
  {
    title: 'Transactions',
    module: 'transactions' as PrivilegeKey,
    permissions: [
      { key: 'access', label: 'Access Transactions' },
      { key: 'view', label: 'View Transactions' },
      { key: 'refund', label: 'Process Refunds' },
      { key: 'export', label: 'Export Transactions' },
      { key: 'view_details', label: 'View Details' },
      { key: 'process_refund', label: 'Process Refund' },
      { key: 'view_receipts', label: 'View Receipts' },
      { key: 'print_receipts', label: 'Print Receipts' },
    ],
  },
  {
    title: 'Discounts',
    module: 'discounts' as PrivilegeKey,
    permissions: [
      { key: 'access', label: 'Access Discounts' },
      { key: 'create_discount', label: 'Create Discounts' },
      { key: 'delete_discount', label: 'Delete Discounts' },
      { key: 'edit_discount', label: 'Edit Discounts' },
      { key: 'view_discounts', label: 'View Discounts' },
      { key: 'apply_discount', label: 'Apply Discounts' },
      { key: 'manage_discount_rules', label: 'Manage Discount Rules' },
    ],
  },
  {
    title: 'Company Dashboard',
    module: 'company_dashboard' as PrivilegeKey,
    permissions: [
      { key: 'access', label: 'Access Company Dashboard' },
      { key: 'view_reports', label: 'View Reports' },
      { key: 'export_reports', label: 'Export Reports' },
      { key: 'view_analytics', label: 'View Analytics' },
      { key: 'view_revenue_data', label: 'View Revenue Data' },
      { key: 'view_performance_metrics', label: 'View Performance Metrics' },
    ],
  },
  {
    title: 'Shop Dashboard',
    module: 'shop_dashboard' as PrivilegeKey,
    permissions: [
      { key: 'access', label: 'Access Shop Dashboard' },
      { key: 'view_sales_data', label: 'View Sales Data' },
      { key: 'manage_daily_targets', label: 'Manage Daily Targets' },
      { key: 'view_shop_performance', label: 'View Shop Performance' },
      { key: 'view_staff_performance', label: 'View Staff Performance' },
      { key: 'view_customer_metrics', label: 'View Customer Metrics' },
    ],
  },
  {
    title: 'Financial Overview',
    module: 'financial_overview' as PrivilegeKey,
    permissions: [
      { key: 'access', label: 'Access Financial Overview' },
      { key: 'view_profits', label: 'View Profits' },
      { key: 'export_financial_data', label: 'Export Financial Data' },
      { key: 'view_revenue_reports', label: 'View Revenue Reports' },
      { key: 'view_expense_reports', label: 'View Expense Reports' },
      { key: 'view_profit_margins', label: 'View Profit Margins' },
    ],
  },
  {
    title: 'POS Terminal',
    module: 'pos_terminal' as PrivilegeKey,
    permissions: [
      { key: 'access', label: 'Access POS Terminal' },
      { key: 'park_sale', label: 'Park Sale' },
      { key: 'hold_order', label: 'Hold Order' },
      { key: 'resume_order', label: 'Resume Order' },
      { key: 'process_sale', label: 'Process Sale' },
      { key: 'view_cart', label: 'View Cart' },
      { key: 'edit_cart', label: 'Edit Cart' },
      { key: 'apply_promotions', label: 'Apply Promotions' },
    ],
  },
  {
    title: 'Products',
    module: 'products' as PrivilegeKey,
    permissions: [
      { key: 'access', label: 'Access Products' },
      { key: 'view_products', label: 'View Products' },
      { key: 'add_products', label: 'Add Products' },
      { key: 'edit_products', label: 'Edit Products' },
      { key: 'delete_products', label: 'Delete Products' },
      { key: 'import_products', label: 'Import Products' },
      { key: 'export_products', label: 'Export Products' },
      { key: 'manage_categories', label: 'Manage Categories' },
      { key: 'manage_pricing', label: 'Manage Pricing' },
      { key: 'manage_inventory', label: 'Manage Inventory' },
    ],
  },
  {
    title: 'Tickets',
    module: 'tickets' as PrivilegeKey,
    permissions: [
      { key: 'access', label: 'Access Tickets' },
      { key: 'view_tickets', label: 'View Tickets' },
      { key: 'create_tickets', label: 'Create Tickets' },
      { key: 'edit_tickets', label: 'Edit Tickets' },
      { key: 'delete_tickets', label: 'Delete Tickets' },
      { key: 'assign_tickets', label: 'Assign Tickets' },
      { key: 'resolve_tickets', label: 'Resolve Tickets' },
      { key: 'export_tickets', label: 'Export Tickets' },
    ],
  },
  {
    title: 'Help',
    module: 'help' as PrivilegeKey,
    permissions: [
      { key: 'access', label: 'Access Help' },
      { key: 'view_help_articles', label: 'View Help Articles' },
      { key: 'create_help_articles', label: 'Create Help Articles' },
      { key: 'edit_help_articles', label: 'Edit Help Articles' },
      { key: 'delete_help_articles', label: 'Delete Help Articles' },
      { key: 'manage_help_categories', label: 'Manage Help Categories' },
    ],
  },
  {
    title: 'Settings',
    module: 'settings' as PrivilegeKey,
    permissions: [
      { key: 'access', label: 'Access Settings' },
      { key: 'edit_settings', label: 'Edit Settings' },
      { key: 'manage_system_config', label: 'Manage System Config' },
      { key: 'manage_notifications', label: 'Manage Notifications' },
      { key: 'view_system_logs', label: 'View System Logs' },
      { key: 'manage_backup', label: 'Manage Backup' },
    ],
  },
  {
    title: 'Referrals',
    module: 'referrals' as PrivilegeKey,
    permissions: [
      { key: 'access', label: 'Access Referrals' },
      { key: 'view_data', label: 'View Referral Data' },
      { key: 'export_data', label: 'Export Referral Data' },
    ],
  },
  {
    title: 'Procurement',
    module: 'procurement' as PrivilegeKey,
    permissions: [
      { key: 'access', label: 'Access Procurement' },
      { key: 'view_suppliers', label: 'View Suppliers' },
      { key: 'manage_suppliers', label: 'Manage Suppliers' },
      { key: 'view_quotations', label: 'View Quotations' },
      { key: 'manage_quotations', label: 'Manage Quotations' },
      { key: 'view_purchase_orders', label: 'View Purchase Orders' },
      { key: 'manage_purchase_orders', label: 'Manage Purchase Orders' },
      { key: 'view_goods_received', label: 'View Goods Received' },
      { key: 'manage_goods_received', label: 'Manage Goods Received' },
      { key: 'view_reports', label: 'View Reports' },
    ],
  },
];
