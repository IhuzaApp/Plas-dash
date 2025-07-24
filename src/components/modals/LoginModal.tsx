import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useForm } from 'react-hook-form';
import { hasuraRequest } from '@/lib/hasura';
import bcrypt from 'bcryptjs';
import { Lock, User } from 'lucide-react';
import { GET_ORG_EMPLOYEE_BY_IDENTITY } from '@/lib/graphql/queries';
import { UPDATE_ORG_EMPLOYEE_LAST_LOGIN_AND_ONLINE } from '@/lib/graphql/mutations';
import { UserPrivileges, DEFAULT_PRIVILEGES } from '@/types/privileges';

interface LoginModalProps {
  onLoginSuccess: (sessionData: any) => void;
}

type LoginFormInputs = {
  identifier: string;
  password: string;
};

// Convert old privilege format to new fine-grained format
const convertPrivilegesToNewFormat = (orgEmployeeRoles: any): UserPrivileges => {
  const privileges = { ...DEFAULT_PRIVILEGES };
  
  if (!orgEmployeeRoles) return privileges;
  
  let oldPrivileges: string[] = [];
  
  // Extract privileges from orgEmployeeRoles
  if (Array.isArray(orgEmployeeRoles)) {
    oldPrivileges = orgEmployeeRoles[0]?.privillages || [];
  } else if (orgEmployeeRoles.privillages) {
    oldPrivileges = orgEmployeeRoles.privillages;
  }
  
  console.log('Converting privileges:', oldPrivileges);
  
  // Map old privilege keys to new module-based structure
  const privilegeMapping: { [key: string]: { module: keyof UserPrivileges; action: string } } = {
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
    'transactions:view': { module: 'transactions', action: 'view' },
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

    // Legacy mappings for backward compatibility
    'customers:create': { module: 'users', action: 'add_users' },
    'customers:view': { module: 'users', action: 'access' },
    'customers:edit': { module: 'users', action: 'edit_users' },
    'customers:delete': { module: 'users', action: 'delete_users' },
    'sidebar:view': { module: 'checkout', action: 'access' }, // This will be handled specially
  };
  
  // Apply privileges based on old format
  oldPrivileges.forEach((privilege: string) => {
    const mapping = privilegeMapping[privilege];
    if (mapping) {
      if (!privileges[mapping.module]) {
        privileges[mapping.module] = { access: false };
      }
      privileges[mapping.module]![mapping.action] = true;
      console.log(`Mapped ${privilege} to ${mapping.module}.${mapping.action}`);
    } else {
      console.log(`No mapping found for privilege: ${privilege}`);
    }
  });
  
  console.log('Final privileges:', privileges);
  return privileges;
};

const loginOrgEmployee = async (identity: string, password: string) => {
  const data = await hasuraRequest(GET_ORG_EMPLOYEE_BY_IDENTITY, { identity }) as { orgEmployees: any[] };
  const employees = data.orgEmployees;
  if (employees && employees.length > 0) {
    for (const emp of employees) {
      if (emp.password && bcrypt.compareSync(password, emp.password)) {
        return emp;
      }
    }
  }
  throw new Error('Invalid credentials');
};

const updateLastLoginAndOnline = async (id: string) => {
  const last_login = new Date().toISOString();
  await hasuraRequest(UPDATE_ORG_EMPLOYEE_LAST_LOGIN_AND_ONLINE, { id, last_login, online: true });
};

const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const form = useForm<LoginFormInputs>({ defaultValues: { identifier: '', password: '' } });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: LoginFormInputs) => {
    setLoading(true);
    setError(null);
    try {
      const session = await loginOrgEmployee(data.identifier, data.password);
      await updateLastLoginAndOnline(session.id);
      
      // Convert old privilege format to new fine-grained format
      const privileges = convertPrivilegesToNewFormat(session.orgEmployeeRoles);
      
      // Create session data with new privilege format
      const sessionData = {
        id: session.id,
        username: session.username,
        fullName: session.fullName,
        email: session.email,
        phoneNumber: session.phoneNumber,
        privileges: privileges,
        // Keep old format for backward compatibility
        orgEmployeeRoles: session.orgEmployeeRoles
      };
      
      onLoginSuccess(sessionData);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open>
      <DialogContent className="max-w-md rounded-2xl shadow-2xl border-2 border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden">
        <div className="bg-white dark:bg-zinc-900/90 p-8 rounded-2xl shadow-lg border border-zinc-100 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-2 text-center">Org Employee Login</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Username / Full Name / Email / Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                        <Input
                          {...field}
                          className="pl-10 bg-zinc-100 dark:bg-zinc-800/60 border-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-zinc-900/90 transition"
                          placeholder="Enter your identifier"
                          disabled={loading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                        <Input
                          {...field}
                          type="password"
                          className="pl-10 bg-zinc-100 dark:bg-zinc-800/60 border-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-zinc-900/90 transition"
                          placeholder="Enter your password"
                          disabled={loading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <div className="text-red-500 text-sm text-center">{error}</div>}
              <Button type="submit" className="w-full mt-2" size="lg" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal; 