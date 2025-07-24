import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import bcrypt from 'bcryptjs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { RefreshCw, Eye, EyeOff } from 'lucide-react';
import { UserPrivileges, DEFAULT_PRIVILEGES, PrivilegeKey } from '@/types/privileges';

const formSchema = z.object({
  fullnames: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  Address: z.string().min(1, 'Address is required'),
  gender: z.string().min(1, 'Gender is required'),
  position: z.string().min(1, 'Position is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  generatePassword: z.boolean().default(false),
  roleType: z.enum([
    'globalAdmin', 
    'systemAdmin', 
    'storeManager', 
    'assistantManager', 
    'cashier', 
    'salesAssociate', 
    'inventorySpecialist', 
    'financeManager', 
    'accountant', 
    'kitchenManager', 
    'chef', 
    'waiter', 
    'bartender', 
    'deliveryDriver', 
    'securityGuard', 
    'maintenanceStaff', 
    'custom'
  ]),
});

type FormData = z.infer<typeof formSchema>;

interface AddStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    employee: {
      fullnames: string;
      email: string;
      phone: string;
      Address: string;
      gender: string;
      Position: string;
      password: string;
      roleType: string;
    };
    privileges: UserPrivileges;
  }) => void;
  shopId: string;
}

// Generate random password
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Helper functions for the new privilege system
const getDefaultPrivilegesForRole = (roleType: string): UserPrivileges => {
  const privileges = { ...DEFAULT_PRIVILEGES };
  
  switch (roleType) {
    case 'globalAdmin':
      // Full access to everything - can manage everything including staff and system settings
      Object.keys(privileges).forEach(module => {
        const moduleKey = module as PrivilegeKey;
        if (privileges[moduleKey]) {
          Object.keys(privileges[moduleKey]!).forEach(action => {
            privileges[moduleKey]![action] = true;
          });
        }
      });
      break;
      
    case 'systemAdmin':
      // System admin - can manage operations but not staff or sensitive system settings
      const systemAdminModules: PrivilegeKey[] = [
        'checkout', 'inventory', 'transactions', 'discounts', 
        'company_dashboard', 'shop_dashboard', 'financial_overview', 
        'pos_terminal', 'products', 'settings'
      ];
      
      systemAdminModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          // Enable most actions except staff management and sensitive system operations
          Object.keys(privileges[module]!).forEach(action => {
            if (action === 'access' || 
                action.includes('view') || 
                action.includes('create') || 
                action.includes('edit') ||
                action.includes('process') ||
                action.includes('export') ||
                action.includes('import') ||
                action.includes('update') ||
                action.includes('apply') ||
                action.includes('manage') ||
                action.includes('configure') ||
                action.includes('park') ||
                action.includes('hold') ||
                action.includes('resume')) {
              privileges[module]![action] = true;
            }
            // Exclude delete operations and system config management
            if (action.includes('delete') || action.includes('system_config')) {
              privileges[module]![action] = false;
            }
          });
        }
      });
      
      // Special restrictions for System Admin
      // Staff Management: Only specific actions allowed
      if (privileges.staff_management) {
        // Reset all staff management privileges to false first
        Object.keys(privileges.staff_management).forEach(action => {
          privileges.staff_management![action] = false;
        });
        // Then enable only the specific actions
        privileges.staff_management!.access = true;
        privileges.staff_management!.add_new_staff = true;
        privileges.staff_management!.assign_roles = true;
        privileges.staff_management!.view_permissions = true;
      }
      
      // Settings: No edit capabilities
      if (privileges.settings) {
        privileges.settings.edit_settings = false;
        privileges.settings.manage_system_config = false;
        privileges.settings.manage_notifications = false;
      }
      break;
      
    case 'storeManager':
      // Store Manager - Full store operations, staff management, financial oversight
      const storeManagerModules: PrivilegeKey[] = [
        'checkout', 'inventory', 'transactions', 'discounts', 
        'company_dashboard', 'shop_dashboard', 'financial_overview', 
        'pos_terminal', 'products', 'orders', 'users', 'shops', 
        'shoppers', 'wallet', 'refunds', 'tickets', 'settings'
      ];
      
      storeManagerModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          // Enable most actions except system-level operations
          Object.keys(privileges[module]!).forEach(action => {
            if (action === 'access' || 
                action.includes('view') || 
                action.includes('create') || 
                action.includes('edit') ||
                action.includes('process') ||
                action.includes('export') ||
                action.includes('import') ||
                action.includes('update') ||
                action.includes('apply') ||
                action.includes('manage') ||
                action.includes('configure') ||
                action.includes('park') ||
                action.includes('hold') ||
                action.includes('resume')) {
              privileges[module]![action] = true;
            }
          });
        }
      });
      
      // Staff Management: Full access
      if (privileges.staff_management) {
        Object.keys(privileges.staff_management).forEach(action => {
          privileges.staff_management![action] = true;
        });
      }
      break;
      
    case 'assistantManager':
      // Assistant Manager - Similar to store manager but with some restrictions
      const assistantManagerModules: PrivilegeKey[] = [
        'checkout', 'inventory', 'transactions', 'discounts', 
        'shop_dashboard', 'pos_terminal', 'products', 'orders', 
        'users', 'shoppers', 'wallet', 'refunds', 'tickets'
      ];
      
      assistantManagerModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          // Enable most actions except sensitive operations
          Object.keys(privileges[module]!).forEach(action => {
            if (action === 'access' || 
                action.includes('view') || 
                action.includes('create') || 
                action.includes('edit') ||
                action.includes('process') ||
                action.includes('export') ||
                action.includes('update') ||
                action.includes('apply') ||
                action.includes('park') ||
                action.includes('hold') ||
                action.includes('resume')) {
              privileges[module]![action] = true;
            }
            // Exclude delete operations and system config
            if (action.includes('delete') || action.includes('system_config')) {
              privileges[module]![action] = false;
            }
          });
        }
      });
      
      // Staff Management: Limited access
      if (privileges.staff_management) {
        privileges.staff_management!.access = true;
        privileges.staff_management!.add_new_staff = true;
        privileges.staff_management!.assign_roles = true;
        privileges.staff_management!.view_permissions = true;
        privileges.staff_management!.view_accounts = true;
        privileges.staff_management!.edit_accounts = false;
        privileges.staff_management!.delete_staff = false;
        privileges.staff_management!.edit_permissions = false;
        privileges.staff_management!.view_activity_logs = false;
      }
      break;
      
    case 'cashier':
      // Cashier - POS operations, basic transactions, customer service
      const cashierModules: PrivilegeKey[] = [
        'checkout', 'pos_terminal', 'transactions', 'discounts', 'products'
      ];
      
      cashierModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          // Enable basic operations
          Object.keys(privileges[module]!).forEach(action => {
            if (action === 'access' || 
                action.includes('view') || 
                action.includes('create') ||
                action.includes('process') ||
                action.includes('apply') ||
                action.includes('park') ||
                action.includes('hold') ||
                action.includes('resume')) {
              privileges[module]![action] = true;
            }
            // Exclude management operations
            if (action.includes('edit') || 
                action.includes('delete') || 
                action.includes('export') || 
                action.includes('import') ||
                action.includes('manage') ||
                action.includes('configure')) {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
      
    case 'salesAssociate':
      // Sales Associate - Product sales, customer assistance, basic inventory
      const salesAssociateModules: PrivilegeKey[] = [
        'checkout', 'pos_terminal', 'products', 'inventory', 'transactions'
      ];
      
      salesAssociateModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          // Enable basic operations
          Object.keys(privileges[module]!).forEach(action => {
            if (action === 'access' || 
                action.includes('view') || 
                action.includes('create') ||
                action.includes('process') ||
                action.includes('apply') ||
                action.includes('park') ||
                action.includes('hold') ||
                action.includes('resume')) {
              privileges[module]![action] = true;
            }
            // Exclude management operations
            if (action.includes('edit') || 
                action.includes('delete') || 
                action.includes('export') || 
                action.includes('import') ||
                action.includes('manage') ||
                action.includes('configure')) {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
      
    case 'inventorySpecialist':
      // Inventory Specialist - Stock management, product updates, inventory reports
      const inventorySpecialistModules: PrivilegeKey[] = [
        'inventory', 'products', 'transactions', 'shop_dashboard'
      ];
      
      inventorySpecialistModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          // Enable inventory-related operations
          Object.keys(privileges[module]!).forEach(action => {
            if (action === 'access' || 
                action.includes('view') || 
                action.includes('create') || 
                action.includes('edit') ||
                action.includes('process') ||
                action.includes('export') ||
                action.includes('import') ||
                action.includes('update') ||
                action.includes('apply') ||
                action.includes('manage')) {
              privileges[module]![action] = true;
            }
            // Exclude delete operations
            if (action.includes('delete')) {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
      
    case 'financeManager':
      // Finance Manager - Financial oversight, reports, transactions, accounting
      const financeManagerModules: PrivilegeKey[] = [
        'transactions', 'financial_overview', 'company_dashboard', 
        'shop_dashboard', 'wallet', 'refunds', 'settings'
      ];
      
      financeManagerModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          // Enable financial operations
          Object.keys(privileges[module]!).forEach(action => {
            if (action === 'access' || 
                action.includes('view') || 
                action.includes('create') || 
                action.includes('edit') ||
                action.includes('process') ||
                action.includes('export') ||
                action.includes('import') ||
                action.includes('update') ||
                action.includes('apply') ||
                action.includes('manage') ||
                action.includes('configure')) {
              privileges[module]![action] = true;
            }
          });
        }
      });
      break;
      
    case 'accountant':
      // Accountant - Financial records, reports, basic transactions
      const accountantModules: PrivilegeKey[] = [
        'transactions', 'financial_overview', 'company_dashboard', 
        'shop_dashboard', 'wallet'
      ];
      
      accountantModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          // Enable view and basic operations
          Object.keys(privileges[module]!).forEach(action => {
            if (action === 'access' || 
                action.includes('view') || 
                action.includes('create') ||
                action.includes('process') ||
                action.includes('export') ||
                action.includes('apply')) {
              privileges[module]![action] = true;
            }
            // Exclude management operations
            if (action.includes('edit') || 
                action.includes('delete') || 
                action.includes('import') ||
                action.includes('manage') ||
                action.includes('configure')) {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
      
    case 'kitchenManager':
      // Kitchen Manager - Food preparation, inventory, kitchen operations
      const kitchenManagerModules: PrivilegeKey[] = [
        'inventory', 'products', 'transactions', 'shop_dashboard', 'orders'
      ];
      
      kitchenManagerModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          // Enable kitchen operations
          Object.keys(privileges[module]!).forEach(action => {
            if (action === 'access' || 
                action.includes('view') || 
                action.includes('create') || 
                action.includes('edit') ||
                action.includes('process') ||
                action.includes('export') ||
                action.includes('update') ||
                action.includes('apply') ||
                action.includes('manage')) {
              privileges[module]![action] = true;
            }
            // Exclude delete operations
            if (action.includes('delete')) {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
      
    case 'chef':
      // Chef - Food preparation, basic inventory, order management
      const chefModules: PrivilegeKey[] = [
        'inventory', 'products', 'orders', 'shop_dashboard'
      ];
      
      chefModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          // Enable basic operations
          Object.keys(privileges[module]!).forEach(action => {
            if (action === 'access' || 
                action.includes('view') || 
                action.includes('create') ||
                action.includes('process') ||
                action.includes('update') ||
                action.includes('apply')) {
              privileges[module]![action] = true;
            }
            // Exclude management operations
            if (action.includes('edit') || 
                action.includes('delete') || 
                action.includes('export') || 
                action.includes('import') ||
                action.includes('manage') ||
                action.includes('configure')) {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
      
    case 'waiter':
      // Waiter - Order taking, customer service, basic POS
      const waiterModules: PrivilegeKey[] = [
        'checkout', 'pos_terminal', 'orders', 'products'
      ];
      
      waiterModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          // Enable basic operations
          Object.keys(privileges[module]!).forEach(action => {
            if (action === 'access' || 
                action.includes('view') || 
                action.includes('create') ||
                action.includes('process') ||
                action.includes('apply') ||
                action.includes('park') ||
                action.includes('hold') ||
                action.includes('resume')) {
              privileges[module]![action] = true;
            }
            // Exclude management operations
            if (action.includes('edit') || 
                action.includes('delete') || 
                action.includes('export') || 
                action.includes('import') ||
                action.includes('manage') ||
                action.includes('configure')) {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
      
    case 'bartender':
      // Bartender - Drink orders, inventory, basic POS
      const bartenderModules: PrivilegeKey[] = [
        'checkout', 'pos_terminal', 'inventory', 'products', 'orders'
      ];
      
      bartenderModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          // Enable basic operations
          Object.keys(privileges[module]!).forEach(action => {
            if (action === 'access' || 
                action.includes('view') || 
                action.includes('create') ||
                action.includes('process') ||
                action.includes('apply') ||
                action.includes('park') ||
                action.includes('hold') ||
                action.includes('resume')) {
              privileges[module]![action] = true;
            }
            // Exclude management operations
            if (action.includes('edit') || 
                action.includes('delete') || 
                action.includes('export') || 
                action.includes('import') ||
                action.includes('manage') ||
                action.includes('configure')) {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
      
    case 'deliveryDriver':
      // Delivery Driver - Order delivery, basic order viewing
      const deliveryDriverModules: PrivilegeKey[] = [
        'orders', 'shop_dashboard'
      ];
      
      deliveryDriverModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          // Enable view operations only
          Object.keys(privileges[module]!).forEach(action => {
            if (action === 'access' || 
                action.includes('view') ||
                action.includes('update')) {
              privileges[module]![action] = true;
            }
            // Exclude all other operations
            if (action.includes('create') || 
                action.includes('edit') || 
                action.includes('delete') || 
                action.includes('export') || 
                action.includes('import') ||
                action.includes('manage') ||
                action.includes('configure') ||
                action.includes('process')) {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
      
    case 'securityGuard':
      // Security Guard - Basic monitoring, no operational access
      const securityGuardModules: PrivilegeKey[] = [
        'shop_dashboard'
      ];
      
      securityGuardModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          // Enable view operations only
          Object.keys(privileges[module]!).forEach(action => {
            if (action === 'access' || 
                action.includes('view')) {
              privileges[module]![action] = true;
            }
            // Exclude all other operations
            if (action.includes('create') || 
                action.includes('edit') || 
                action.includes('delete') || 
                action.includes('export') || 
                action.includes('import') ||
                action.includes('manage') ||
                action.includes('configure') ||
                action.includes('process')) {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
      
    case 'maintenanceStaff':
      // Maintenance Staff - Basic system access for maintenance tasks
      const maintenanceStaffModules: PrivilegeKey[] = [
        'shop_dashboard', 'settings'
      ];
      
      maintenanceStaffModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          // Enable view operations only
          Object.keys(privileges[module]!).forEach(action => {
            if (action === 'access' || 
                action.includes('view')) {
              privileges[module]![action] = true;
            }
            // Exclude all other operations
            if (action.includes('create') || 
                action.includes('edit') || 
                action.includes('delete') || 
                action.includes('export') || 
                action.includes('import') ||
                action.includes('manage') ||
                action.includes('configure') ||
                action.includes('process')) {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
      
    default:
      // Custom role - start with no privileges
      break;
  }
  
  return privileges;
};

const convertCustomPermissionsToPrivileges = (customPermissions: string[]): UserPrivileges => {
  const privileges = { ...DEFAULT_PRIVILEGES };
  
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



// Permission groups for the new fine-grained privilege system
const permissionGroups = [
  {
    title: 'Point of Sale',
    module: 'checkout' as PrivilegeKey,
    permissions: [
      { key: 'access', label: 'Access Checkout' },
      { key: 'delete_pending_orders', label: 'Delete Pending Orders' },
      { key: 'apply_discount', label: 'Apply Discounts' },
      { key: 'view_orders', label: 'View Orders' },
      { key: 'create_orders', label: 'Create Orders' },
      { key: 'edit_orders', label: 'Edit Orders' },
      { key: 'cancel_orders', label: 'Cancel Orders' },
      { key: 'process_payment', label: 'Process Payment' },
      { key: 'view_customer_info', label: 'View Customer Info' },
      { key: 'edit_customer_info', label: 'Edit Customer Info' },
    ],
  },
  {
    title: 'Staff Management',
    module: 'staff_management' as PrivilegeKey,
    permissions: [
      { key: 'access', label: 'Access Staff Management' },
      { key: 'view_accounts', label: 'View Accounts' },
      { key: 'edit_accounts', label: 'Edit Accounts' },
      { key: 'view_activity_logs', label: 'View Activity Logs' },
      { key: 'add_new_staff', label: 'Add New Staff' },
      { key: 'delete_staff', label: 'Delete Staff' },
      { key: 'assign_roles', label: 'Assign Roles' },
      { key: 'view_permissions', label: 'View Permissions' },
      { key: 'edit_permissions', label: 'Edit Permissions' },
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
      { key: 'view_analytics', label: 'View Analytics' },
    ],
  },

  {
    title: 'Settings',
    module: 'settings' as PrivilegeKey,
    permissions: [
      { key: 'access', label: 'Access Settings' },
      { key: 'view_settings', label: 'View Settings' },
      { key: 'edit_settings', label: 'Edit Settings' },
      { key: 'manage_system_config', label: 'Manage System Config' },
      { key: 'view_audit_logs', label: 'View Audit Logs' },
      { key: 'manage_notifications', label: 'Manage Notifications' },
    ],
  },
];

// Permission display component for the new privilege system
const PermissionDisplay = ({ privileges }: { privileges: UserPrivileges }) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {permissionGroups.map(group => (
          <div key={group.title} className="space-y-2">
            <h4 className="font-medium text-sm">{group.title}</h4>
            <div className="grid grid-cols-2 gap-2">
              {group.permissions.map(permission => {
                const hasAccess = privileges[group.module]?.[permission.key] || false;
                return (
                <div key={permission.key} className="flex items-center gap-2">
                  <div
                      className={`w-2 h-2 rounded-full ${hasAccess ? 'bg-green-500' : 'bg-gray-300'}`}
                  />
                  <span className="text-xs text-muted-foreground">{permission.label}</span>
                </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AddStaffDialog: React.FC<AddStaffDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  shopId,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [customPrivileges, setCustomPrivileges] = useState<UserPrivileges>({ ...DEFAULT_PRIVILEGES });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullnames: '',
      email: '',
      phone: '',
      Address: '',
      gender: '',
      position: '',
      password: '',
      generatePassword: false,
      roleType: 'cashier',
    },
  });

  const roleType = form.watch('roleType');
  const generatePassword = form.watch('generatePassword');

  // Generate password when toggle is enabled
  React.useEffect(() => {
    if (generatePassword) {
      const newPassword = generateRandomPassword();
      form.setValue('password', newPassword);
    }
  }, [generatePassword, form]);

  // Update custom privileges when role type changes
  React.useEffect(() => {
    if (roleType !== 'custom') {
      const defaultPrivileges = getDefaultPrivilegesForRole(roleType);
      setCustomPrivileges(defaultPrivileges);
    }
  }, [roleType]);

  function handlePrivilegeToggle(module: PrivilegeKey, action: string) {
    setCustomPrivileges(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module]?.[action]
      }
    }));
  }

  function handleSubmit(values: FormData) {
    const { position, generatePassword, ...employeeData } = values;
    // Use custom privileges if custom role, otherwise use default
    const privileges = roleType === 'custom' ? customPrivileges : getDefaultPrivilegesForRole(roleType);
    // Hash the password before submitting
    const hashedPassword = bcrypt.hashSync(employeeData.password, 10);
    onSubmit({
      employee: {
        ...employeeData,
        password: hashedPassword,
        Position: position,
      },
      privileges,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
          <DialogDescription>
            Add a new staff member and assign their role and permissions.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullnames"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email*</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="cashier">Cashier</SelectItem>
                            <SelectItem value="salesperson">Salesperson</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                            <SelectItem value="assistant">Assistant</SelectItem>
                            <SelectItem value="admin">Administrator</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="generatePassword"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Generate Random Password</FormLabel>
                          <FormDescription>
                            Automatically generate a secure password
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="Address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!generatePassword && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password*</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Enter password"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Password must be at least 6 characters long
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {generatePassword && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Generated Password*</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Generated password"
                              {...field}
                              readOnly
                            />
                            <div className="absolute right-0 top-0 h-full flex items-center gap-1 px-3">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-transparent"
                                onClick={() => {
                                  const newPassword = generateRandomPassword();
                                  form.setValue('password', newPassword);
                                }}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Click the refresh icon to generate a new password
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Role Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Role & Permissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="roleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Type*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="globalAdmin">
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive">Global Admin</Badge>
                              <span>Full system access</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="systemAdmin">
                            <div className="flex items-center gap-2">
                              <Badge variant="default">System Admin</Badge>
                              <span>Limited system access</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="storeManager">
                            <div className="flex items-center gap-2">
                              <Badge variant="default">Store Manager</Badge>
                              <span>Full store operations & staff management</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="assistantManager">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Assistant Manager</Badge>
                              <span>Store operations with limited staff access</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="cashier">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Cashier</Badge>
                              <span>POS operations & customer service</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="salesAssociate">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Sales Associate</Badge>
                              <span>Product sales & customer assistance</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="inventorySpecialist">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Inventory Specialist</Badge>
                              <span>Stock management & product updates</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="financeManager">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Finance Manager</Badge>
                              <span>Financial oversight & accounting</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="accountant">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Accountant</Badge>
                              <span>Financial records & reports</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="kitchenManager">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Kitchen Manager</Badge>
                              <span>Food preparation & kitchen operations</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="chef">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Chef</Badge>
                              <span>Food preparation & order management</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="waiter">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Waiter</Badge>
                              <span>Order taking & customer service</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="bartender">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Bartender</Badge>
                              <span>Drink orders & inventory</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="deliveryDriver">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Delivery Driver</Badge>
                              <span>Order delivery & basic viewing</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="securityGuard">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Security Guard</Badge>
                              <span>Basic monitoring access</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="maintenanceStaff">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Maintenance Staff</Badge>
                              <span>System maintenance access</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="custom">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Custom</Badge>
                              <span>Custom permissions</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose a predefined role with preset permissions or select custom to pick specific permissions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Show permissions for selected role or custom selection */}
                {roleType === 'custom' ? (
                  <div className="space-y-4">
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Select Custom Permissions</h4>
                      {/* Custom permission selection UI */}
                      <div className="space-y-4">
                        <div className="grid gap-4">
                          {permissionGroups.map(group => (
                            <div key={group.title} className="space-y-2">
                              <h4 className="font-medium text-sm">{group.title}</h4>
                              <div className="grid grid-cols-1 gap-2">
                                {group.permissions.map(permission => (
                                  <div key={permission.key} className="flex items-center justify-between p-2 rounded-lg border">
                                    <span className="text-sm text-muted-foreground">{permission.label}</span>
                                    <Switch
                                      checked={customPrivileges[group.module]?.[permission.key] || false}
                                      onCheckedChange={() => handlePrivilegeToggle(group.module, permission.key)}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">
                        Permissions for{' '}
                        {roleType === 'globalAdmin'
                          ? 'Global Admin'
                          : roleType === 'systemAdmin'
                            ? 'System Admin'
                            : roleType === 'storeManager'
                              ? 'Store Manager'
                              : roleType === 'assistantManager'
                                ? 'Assistant Manager'
                                : roleType === 'cashier'
                                  ? 'Cashier'
                                  : roleType === 'salesAssociate'
                                    ? 'Sales Associate'
                                    : roleType === 'inventorySpecialist'
                                      ? 'Inventory Specialist'
                                      : roleType === 'financeManager'
                                        ? 'Finance Manager'
                                        : roleType === 'accountant'
                                          ? 'Accountant'
                                          : roleType === 'kitchenManager'
                                            ? 'Kitchen Manager'
                                            : roleType === 'chef'
                                              ? 'Chef'
                                              : roleType === 'waiter'
                                                ? 'Waiter'
                                                : roleType === 'bartender'
                                                  ? 'Bartender'
                                                  : roleType === 'deliveryDriver'
                                                    ? 'Delivery Driver'
                                                    : roleType === 'securityGuard'
                                                      ? 'Security Guard'
                                                      : roleType === 'maintenanceStaff'
                                                        ? 'Maintenance Staff'
                                                        : 'Custom Role'}
                      </h4>
                      <PermissionDisplay privileges={customPrivileges} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Staff Member</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStaffDialog;
