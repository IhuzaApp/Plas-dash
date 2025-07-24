import { UserPrivileges, DEFAULT_PRIVILEGES, PrivilegeKey } from '@/types/privileges';

/**
 * Get default privileges for a specific role type
 * @param roleType - The role type to get privileges for
 * @returns UserPrivileges object with appropriate permissions for the role
 */
export const getDefaultPrivilegesForRole = (roleType: string): UserPrivileges => {
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