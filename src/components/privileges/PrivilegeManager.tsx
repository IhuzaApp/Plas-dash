'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Shield, Lock, Unlock, Settings } from 'lucide-react';
import {
  UserPrivileges,
  DEFAULT_PRIVILEGES,
  PrivilegeKey,
  ModulePrivileges,
} from '@/types/privileges';

interface PrivilegeManagerProps {
  privileges: UserPrivileges;
  onPrivilegesChange: (privileges: UserPrivileges) => void;
  readOnly?: boolean;
}

// Module descriptions for better UX
const MODULE_DESCRIPTIONS: Record<
  PrivilegeKey,
  {
    title: string;
    description: string;
    actions: { key: string; label: string; description: string }[];
  }
> = {
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
        label: 'View Performance',
        description: 'Can view performance metrics',
      },
    ],
  },
  shop_dashboard: {
    title: 'Shop Dashboard',
    description: 'View shop-specific analytics and performance',
    actions: [
      { key: 'access', label: 'Access Shop Dashboard', description: 'Can access shop dashboard' },
      {
        key: 'view_sales_data',
        label: 'View Sales Data',
        description: 'Can view sales information',
      },
      {
        key: 'manage_daily_targets',
        label: 'Manage Targets',
        description: 'Can manage daily sales targets',
      },
      {
        key: 'view_shop_performance',
        label: 'View Performance',
        description: 'Can view shop performance',
      },
      {
        key: 'view_staff_performance',
        label: 'View Staff Performance',
        description: 'Can view staff performance',
      },
      {
        key: 'view_customer_metrics',
        label: 'View Customer Metrics',
        description: 'Can view customer metrics',
      },
    ],
  },
  financial_overview: {
    title: 'Financial Overview',
    description: 'View financial reports and profit analysis',
    actions: [
      {
        key: 'access',
        label: 'Access Financial Overview',
        description: 'Can access financial overview',
      },
      { key: 'view_profits', label: 'View Profits', description: 'Can view profit information' },
      {
        key: 'export_financial_data',
        label: 'Export Data',
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
      { key: 'hold_order', label: 'Hold Order', description: 'Can hold orders' },
      { key: 'resume_order', label: 'Resume Order', description: 'Can resume held orders' },
      { key: 'process_sale', label: 'Process Sale', description: 'Can process sales' },
      { key: 'view_cart', label: 'View Cart', description: 'Can view shopping cart' },
      { key: 'edit_cart', label: 'Edit Cart', description: 'Can edit shopping cart' },
      {
        key: 'apply_promotions',
        label: 'Apply Promotions',
        description: 'Can apply promotions to sales',
      },
    ],
  },
  orders: {
    title: 'Order Management',
    description: 'Manage customer orders and delivery',
    actions: [
      { key: 'access', label: 'Access Orders', description: 'Can access orders page' },
      { key: 'view_orders', label: 'View Orders', description: 'Can view order listings' },
      { key: 'create_orders', label: 'Create Orders', description: 'Can create new orders' },
      { key: 'edit_orders', label: 'Edit Orders', description: 'Can edit order details' },
      { key: 'delete_orders', label: 'Delete Orders', description: 'Can delete orders' },
      { key: 'process_orders', label: 'Process Orders', description: 'Can process orders' },
      {
        key: 'view_order_details',
        label: 'View Order Details',
        description: 'Can view detailed order information',
      },
      {
        key: 'update_order_status',
        label: 'Update Status',
        description: 'Can update order status',
      },
      {
        key: 'assign_delivery',
        label: 'Assign Delivery',
        description: 'Can assign delivery to orders',
      },
    ],
  },
  products: {
    title: 'Product Management',
    description: 'Manage product catalog and listings',
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
  users: {
    title: 'User Management',
    description: 'Manage customer accounts and profiles',
    actions: [
      { key: 'access', label: 'Access Users', description: 'Can access users page' },
      { key: 'view_users', label: 'View Users', description: 'Can view user listings' },
      { key: 'add_users', label: 'Add Users', description: 'Can add new users' },
      { key: 'edit_users', label: 'Edit Users', description: 'Can edit user details' },
      { key: 'delete_users', label: 'Delete Users', description: 'Can delete users' },
      {
        key: 'view_user_details',
        label: 'View User Details',
        description: 'Can view detailed user information',
      },
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
    title: 'Shop Management',
    description: 'Manage shop locations and settings',
    actions: [
      { key: 'access', label: 'Access Shops', description: 'Can access shops page' },
      { key: 'view_shops', label: 'View Shops', description: 'Can view shop listings' },
      { key: 'add_shops', label: 'Add Shops', description: 'Can add new shops' },
      { key: 'edit_shops', label: 'Edit Shops', description: 'Can edit shop details' },
      { key: 'delete_shops', label: 'Delete Shops', description: 'Can delete shops' },
      {
        key: 'view_shop_details',
        label: 'View Shop Details',
        description: 'Can view detailed shop information',
      },
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
    title: 'Shopper Management',
    description: 'Manage shopper accounts and deliveries',
    actions: [
      { key: 'access', label: 'Access Shoppers', description: 'Can access shoppers page' },
      { key: 'view_shoppers', label: 'View Shoppers', description: 'Can view shopper listings' },
      { key: 'add_shoppers', label: 'Add Shoppers', description: 'Can add new shoppers' },
      { key: 'edit_shoppers', label: 'Edit Shoppers', description: 'Can edit shopper details' },
      { key: 'delete_shoppers', label: 'Delete Shoppers', description: 'Can delete shoppers' },
      {
        key: 'view_shopper_details',
        label: 'View Shopper Details',
        description: 'Can view detailed shopper information',
      },
      {
        key: 'view_shopper_orders',
        label: 'View Shopper Orders',
        description: 'Can view shopper order history',
      },
      {
        key: 'view_shopper_wallet',
        label: 'View Shopper Wallet',
        description: 'Can view shopper wallet information',
      },
      {
        key: 'view_shopper_ratings',
        label: 'View Shopper Ratings',
        description: 'Can view shopper ratings',
      },
    ],
  },
  settings: {
    title: 'System Settings',
    description: 'Manage system configuration and preferences',
    actions: [
      { key: 'access', label: 'Access Settings', description: 'Can access settings page' },
      { key: 'view_settings', label: 'View Settings', description: 'Can view system settings' },
      { key: 'edit_settings', label: 'Edit Settings', description: 'Can edit system settings' },
      {
        key: 'manage_system_config',
        label: 'Manage System Config',
        description: 'Can manage system configuration',
      },
      {
        key: 'view_audit_logs',
        label: 'View Audit Logs',
        description: 'Can view system audit logs',
      },
      {
        key: 'manage_notifications',
        label: 'Manage Notifications',
        description: 'Can manage notification settings',
      },
    ],
  },
  refunds: {
    title: 'Refund Management',
    description: 'Process and manage refund requests',
    actions: [
      { key: 'access', label: 'Access Refunds', description: 'Can access refunds page' },
      { key: 'view_refunds', label: 'View Refunds', description: 'Can view refund requests' },
      {
        key: 'process_refunds',
        label: 'Process Refunds',
        description: 'Can process refund requests',
      },
      {
        key: 'approve_refunds',
        label: 'Approve Refunds',
        description: 'Can approve refund requests',
      },
      { key: 'reject_refunds', label: 'Reject Refunds', description: 'Can reject refund requests' },
      {
        key: 'view_refund_details',
        label: 'View Refund Details',
        description: 'Can view detailed refund information',
      },
      {
        key: 'export_refund_data',
        label: 'Export Refund Data',
        description: 'Can export refund data',
      },
    ],
  },
  tickets: {
    title: 'Support Tickets',
    description: 'Manage customer support tickets',
    actions: [
      { key: 'access', label: 'Access Tickets', description: 'Can access tickets page' },
      { key: 'view_tickets', label: 'View Tickets', description: 'Can view support tickets' },
      {
        key: 'create_tickets',
        label: 'Create Tickets',
        description: 'Can create new support tickets',
      },
      { key: 'edit_tickets', label: 'Edit Tickets', description: 'Can edit ticket details' },
      { key: 'delete_tickets', label: 'Delete Tickets', description: 'Can delete tickets' },
      {
        key: 'assign_tickets',
        label: 'Assign Tickets',
        description: 'Can assign tickets to staff',
      },
      {
        key: 'resolve_tickets',
        label: 'Resolve Tickets',
        description: 'Can resolve support tickets',
      },
      {
        key: 'view_ticket_details',
        label: 'View Ticket Details',
        description: 'Can view detailed ticket information',
      },
    ],
  },
  help: {
    title: 'Help Center',
    description: 'Access help documentation and support',
    actions: [
      { key: 'access', label: 'Access Help', description: 'Can access help center' },
      { key: 'view_help', label: 'View Help', description: 'Can view help content' },
      { key: 'search_help', label: 'Search Help', description: 'Can search help documentation' },
      { key: 'view_categories', label: 'View Categories', description: 'Can view help categories' },
      { key: 'view_articles', label: 'View Articles', description: 'Can view help articles' },
    ],
  },
  wallet: {
    title: 'Wallet Operations',
    description: 'Manage wallet transactions and payouts',
    actions: [
      { key: 'access', label: 'Access Wallets', description: 'Can access wallet management' },
      { key: 'view_wallets', label: 'View Wallets', description: 'Can view wallet information' },
      {
        key: 'process_payouts',
        label: 'Process Payouts',
        description: 'Can process wallet payouts',
      },
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
      { key: 'view_balance', label: 'View Balance', description: 'Can view wallet balances' },
      {
        key: 'export_wallet_data',
        label: 'Export Wallet Data',
        description: 'Can export wallet data',
      },
    ],
  },
  promotions: {
    title: 'Promotion Management',
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
        key: 'activate_promotions',
        label: 'Activate Promotions',
        description: 'Can activate promotions',
      },
      {
        key: 'deactivate_promotions',
        label: 'Deactivate Promotions',
        description: 'Can deactivate promotions',
      },
      {
        key: 'view_promotion_analytics',
        label: 'View Analytics',
        description: 'Can view promotion analytics',
      },
    ],
  },
  delivery_settings: {
    title: 'Delivery Settings',
    description: 'Configure delivery zones and fees',
    actions: [
      {
        key: 'access',
        label: 'Access Delivery Settings',
        description: 'Can access delivery settings',
      },
      {
        key: 'view_delivery_settings',
        label: 'View Settings',
        description: 'Can view delivery settings',
      },
      {
        key: 'edit_delivery_settings',
        label: 'Edit Settings',
        description: 'Can edit delivery settings',
      },
      {
        key: 'manage_delivery_zones',
        label: 'Manage Zones',
        description: 'Can manage delivery zones',
      },
      {
        key: 'configure_delivery_times',
        label: 'Configure Times',
        description: 'Can configure delivery times',
      },
    ],
  },
  referrals: {
    title: 'Referrals',
    description: 'Track and manage user referrals and statistics',
    actions: [
      { key: 'access', label: 'Access Referrals', description: 'Can access referrals page' },
      { key: 'view_data', label: 'View Data', description: 'Can view referral window data' },
    ],
  },
  project_users: {
    title: 'Project Users',
    description: 'Manage project-specific user roles',
    actions: [{ key: 'access', label: 'Access', description: 'Can access project users' }],
  },
  restaurants: {
    title: 'Restaurants',
    description: 'Manage restaurant listings',
    actions: [
      { key: 'access', label: 'Access', description: 'Can access restaurants' },
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
  pages: {
    title: 'Pages',
    description: 'Manage custom pages',
    actions: [{ key: 'access', label: 'Access', description: 'Can access pages' }],
  },
  plasmarket: {
    title: 'PlasMarket',
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
  withdraw_requests: {
    title: 'Withdraw Requests',
    description: 'Manage shopper/user withdrawal requests',
    actions: [
      { key: 'access', label: 'Access Requests', description: 'Can view withdrawal requests' },
      { key: 'view', label: 'View Requests', description: 'Can view list of requests' },
      { key: 'approve', label: 'Approve', description: 'Can approve withdrawal requests' },
      { key: 'reject', label: 'Reject', description: 'Can reject withdrawal requests' },
    ],
  },
  procurement: {
    title: 'Procurement',
    description: 'Manage suppliers, quotations, purchase orders, and goods received',
    actions: [
      { key: 'access', label: 'Access Procurement', description: 'Can access procurement module' },
      { key: 'view_suppliers', label: 'View Suppliers', description: 'Can view supplier listings' },
      { key: 'manage_suppliers', label: 'Manage Suppliers', description: 'Can add, edit, or delete suppliers' },
      { key: 'view_quotations', label: 'View Quotations', description: 'Can view request for quotations (RFQs)' },
      { key: 'manage_quotations', label: 'Manage Quotations', description: 'Can create and manage RFQs' },
      { key: 'view_purchase_orders', label: 'View POs', description: 'Can view purchase orders' },
      { key: 'manage_purchase_orders', label: 'Manage POs', description: 'Can create and manage purchase orders' },
      { key: 'view_goods_received', label: 'View Goods Received', description: 'Can view goods received notes' },
      { key: 'manage_goods_received', label: 'Manage Goods Received', description: 'Can process received goods' },
      { key: 'view_reports', label: 'View Reports', description: 'Can view procurement reports' },
    ],
  },
};

export function PrivilegeManager({
  privileges,
  onPrivilegesChange,
  readOnly = false,
}: PrivilegeManagerProps) {
  const [expandedModules, setExpandedModules] = useState<Set<PrivilegeKey>>(new Set());

  const toggleModule = (module: PrivilegeKey) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(module)) {
      newExpanded.delete(module);
    } else {
      newExpanded.add(module);
    }
    setExpandedModules(newExpanded);
  };

  const updatePrivilege = (module: PrivilegeKey, action: string, value: boolean) => {
    if (readOnly) return;

    const newPrivileges = { ...privileges };
    if (!newPrivileges[module]) {
      newPrivileges[module] = { access: false };
    }
    newPrivileges[module]![action] = value;
    onPrivilegesChange(newPrivileges);
  };

  const toggleAllInModule = (module: PrivilegeKey, value: boolean) => {
    if (readOnly) return;

    const moduleInfo = MODULE_DESCRIPTIONS[module];
    const newPrivileges = { ...privileges };

    if (!newPrivileges[module]) {
      newPrivileges[module] = { access: false };
    }

    moduleInfo.actions.forEach(action => {
      newPrivileges[module]![action.key] = value;
    });

    onPrivilegesChange(newPrivileges);
  };

  const getModuleAccessCount = (module: PrivilegeKey) => {
    const modulePrivileges = privileges[module];
    if (!modulePrivileges) return 0;

    const moduleInfo = MODULE_DESCRIPTIONS[module];
    return moduleInfo.actions.filter(action => modulePrivileges[action.key]).length;
  };

  const getTotalAccessCount = () => {
    return Object.keys(MODULE_DESCRIPTIONS).reduce((total, module) => {
      return total + getModuleAccessCount(module as PrivilegeKey);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permission Management
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure fine-grained permissions for this staff member
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{getTotalAccessCount()} permissions granted</Badge>
          {readOnly && (
            <Badge variant="outline" className="text-muted-foreground">
              Read Only
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid gap-4">
        {Object.entries(MODULE_DESCRIPTIONS).map(([moduleKey, moduleInfo]) => {
          const mod = moduleKey as PrivilegeKey;
          const modulePrivileges = (privileges[mod] || { access: false }) as ModulePrivileges;
          const accessCount = getModuleAccessCount(mod);
          const totalActions = moduleInfo.actions.length;
          const isExpanded = expandedModules.has(mod);
          const hasAccess = modulePrivileges.access || false;

          return (
            <Card key={mod} className="overflow-hidden">
              <Collapsible open={isExpanded} onOpenChange={() => toggleModule(mod)}>
                <CollapsibleTrigger asChild>
                  <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div className="flex items-center gap-2">
                            {hasAccess ? (
                              <Unlock className="h-4 w-4 text-green-600" />
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            )}
                            <h4 className="font-medium">{moduleInfo.title}</h4>
                          </div>
                        </div>
                        <Badge variant={hasAccess ? 'default' : 'secondary'}>
                          {accessCount}/{totalActions}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {!readOnly && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              toggleAllInModule(mod, !hasAccess);
                            }}
                          >
                            {hasAccess ? 'Revoke All' : 'Grant All'}
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 ml-6">
                      {moduleInfo.description}
                    </p>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-3">
                    {moduleInfo.actions.map(action => {
                      const isEnabled = modulePrivileges[action.key] || false;

                      return (
                        <div
                          key={action.key}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`${mod}-${action.key}`} className="font-medium">
                                {action.label}
                              </Label>
                              {isEnabled && (
                                <Badge variant="outline" className="text-xs">
                                  Granted
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {action.description}
                            </p>
                          </div>
                          <Switch
                            id={`${mod}-${action.key}`}
                            checked={isEnabled}
                            onCheckedChange={checked => updatePrivilege(mod, action.key, checked)}
                            disabled={readOnly}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {readOnly && (
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <Settings className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            This is a read-only view. Contact an administrator to modify permissions.
          </p>
        </div>
      )}
    </div>
  );
}
