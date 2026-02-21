import { UserPrivileges, DEFAULT_PRIVILEGES, PrivilegeKey } from '@/types/privileges';

/**
 * Get default privileges for a specific role type
 * @param roleType - The role type to get privileges for
 * @returns UserPrivileges object with appropriate permissions for the role
 */
export const getDefaultPrivilegesForRole = (roleType: string): UserPrivileges => {
  // Start with all privileges set to false
  const privileges: UserPrivileges = {} as UserPrivileges;
  Object.keys(DEFAULT_PRIVILEGES).forEach(module => {
    privileges[module as PrivilegeKey] = {
      access: false,
      ...DEFAULT_PRIVILEGES[module as PrivilegeKey],
    };
    // Explicitly set all actions to false for all modules
    Object.keys(privileges[module as PrivilegeKey]!).forEach(action => {
      privileges[module as PrivilegeKey]![action] = false;
    });
    // Ensure 'access' is always present and set to false
    if (!('access' in privileges[module as PrivilegeKey]!)) {
      privileges[module as PrivilegeKey]!.access = false;
    }
  });

  switch (roleType) {
    case 'globalAdmin':
      // Full access to everything
      Object.keys(privileges).forEach(module => {
        const moduleKey = module as PrivilegeKey;
        if (privileges[moduleKey]) {
          Object.keys(privileges[moduleKey]!).forEach(action => {
            privileges[moduleKey]![action] = true;
          });
        }
      });
      break;

    case 'systemAdmin': {
      const systemAdminModules: PrivilegeKey[] = [
        'checkout',
        'inventory',
        'transactions',
        'discounts',
        'company_dashboard',
        'shop_dashboard',
        'financial_overview',
        'pos_terminal',
        'products',
        'settings',
        'referrals',
      ];
      systemAdminModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          Object.keys(privileges[module]!).forEach(action => {
            if (
              action === 'access' ||
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
              action.includes('resume')
            ) {
              privileges[module]![action] = true;
            }
            if (action.includes('delete') || action.includes('system_config')) {
              privileges[module]![action] = false;
            }
          });
        }
      });
      if (privileges.staff_management) {
        Object.keys(privileges.staff_management).forEach(action => {
          privileges.staff_management![action] = false;
        });
        privileges.staff_management!.access = true;
        privileges.staff_management!.add_new_staff = true;
        privileges.staff_management!.assign_roles = true;
        privileges.staff_management!.view_permissions = true;
      }
      if (privileges.settings) {
        privileges.settings.edit_settings = false;
        privileges.settings.manage_system_config = false;
        privileges.settings.manage_notifications = false;
      }
      break;
    }

    case 'storeManager': {
      const storeManagerModules: PrivilegeKey[] = [
        'checkout',
        'inventory',
        'transactions',
        'discounts',
        'company_dashboard',
        'shop_dashboard',
        'financial_overview',
        'pos_terminal',
        'products',
        'orders',
        'users',
        'shops',
        'shoppers',
        'wallet',
        'refunds',
        'tickets',
        'settings',
        'referrals',
      ];
      storeManagerModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          Object.keys(privileges[module]!).forEach(action => {
            if (
              action === 'access' ||
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
              action.includes('resume')
            ) {
              privileges[module]![action] = true;
            }
          });
        }
      });
      if (privileges.staff_management) {
        Object.keys(privileges.staff_management).forEach(action => {
          privileges.staff_management![action] = true;
        });
      }
      break;
    }

    case 'assistantManager': {
      const assistantManagerModules: PrivilegeKey[] = [
        'checkout',
        'inventory',
        'transactions',
        'discounts',
        'shop_dashboard',
        'pos_terminal',
        'products',
        'orders',
        'users',
        'shoppers',
        'wallet',
        'refunds',
        'tickets',
      ];
      assistantManagerModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          Object.keys(privileges[module]!).forEach(action => {
            if (
              action === 'access' ||
              action.includes('view') ||
              action.includes('create') ||
              action.includes('edit') ||
              action.includes('process') ||
              action.includes('export') ||
              action.includes('update') ||
              action.includes('apply') ||
              action.includes('park') ||
              action.includes('hold') ||
              action.includes('resume')
            ) {
              privileges[module]![action] = true;
            }
            if (action.includes('delete') || action.includes('system_config')) {
              privileges[module]![action] = false;
            }
          });
        }
      });
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
    }

    case 'cashier': {
      const cashierModules: PrivilegeKey[] = [
        'checkout',
        'pos_terminal',
        'transactions',
        'discounts',
        'products',
      ];
      cashierModules.forEach(module => {
        if (privileges[module]) {
          // Special handling for discounts: only allow view
          if (module === 'discounts') {
            Object.keys(privileges[module]!).forEach(action => {
              privileges[module]![action] = false;
            });
            privileges[module]!.access = true;
            privileges[module]!.view_discounts = true;
          } else {
            privileges[module]!.access = true;
            Object.keys(privileges[module]!).forEach(action => {
              if (
                action === 'access' ||
                action.includes('view') ||
                action.includes('create') ||
                action.includes('process') ||
                action.includes('apply') ||
                action.includes('park') ||
                action.includes('hold') ||
                action.includes('resume')
              ) {
                privileges[module]![action] = true;
              } else {
                privileges[module]![action] = false;
              }
            });
          }
        }
      });
      break;
    }

    case 'salesAssociate': {
      const salesAssociateModules: PrivilegeKey[] = [
        'checkout',
        'pos_terminal',
        'products',
        'inventory',
        'transactions',
      ];

      salesAssociateModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          Object.keys(privileges[module]!).forEach(action => {
            if (
              action === 'access' ||
              action.includes('view') ||
              action.includes('create') ||
              action.includes('process') ||
              action.includes('apply') ||
              action.includes('park') ||
              action.includes('hold') ||
              action.includes('resume')
            ) {
              privileges[module]![action] = true;
            } else {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
    }

    case 'inventorySpecialist': {
      const inventorySpecialistModules: PrivilegeKey[] = [
        'inventory',
        'products',
        'transactions',
        'shop_dashboard',
      ];

      inventorySpecialistModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          Object.keys(privileges[module]!).forEach(action => {
            if (
              action === 'access' ||
              action.includes('view') ||
              action.includes('create') ||
              action.includes('edit') ||
              action.includes('process') ||
              action.includes('export') ||
              action.includes('import') ||
              action.includes('update') ||
              action.includes('apply') ||
              action.includes('manage')
            ) {
              privileges[module]![action] = true;
            } else {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
    }

    case 'financeManager': {
      const financeManagerModules: PrivilegeKey[] = [
        'transactions',
        'financial_overview',
        'company_dashboard',
        'shop_dashboard',
        'wallet',
        'refunds',
        'settings',
      ];

      financeManagerModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          Object.keys(privileges[module]!).forEach(action => {
            if (
              action === 'access' ||
              action.includes('view') ||
              action.includes('create') ||
              action.includes('edit') ||
              action.includes('process') ||
              action.includes('export') ||
              action.includes('import') ||
              action.includes('update') ||
              action.includes('apply') ||
              action.includes('manage') ||
              action.includes('configure')
            ) {
              privileges[module]![action] = true;
            } else {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
    }

    case 'accountant': {
      const accountantModules: PrivilegeKey[] = [
        'transactions',
        'financial_overview',
        'company_dashboard',
        'shop_dashboard',
        'wallet',
      ];

      accountantModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          Object.keys(privileges[module]!).forEach(action => {
            if (
              action === 'access' ||
              action.includes('view') ||
              action.includes('create') ||
              action.includes('process') ||
              action.includes('export') ||
              action.includes('apply')
            ) {
              privileges[module]![action] = true;
            } else {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
    }

    case 'kitchenManager': {
      const kitchenManagerModules: PrivilegeKey[] = [
        'inventory',
        'products',
        'transactions',
        'shop_dashboard',
        'orders',
      ];

      kitchenManagerModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          Object.keys(privileges[module]!).forEach(action => {
            if (
              action === 'access' ||
              action.includes('view') ||
              action.includes('create') ||
              action.includes('edit') ||
              action.includes('process') ||
              action.includes('export') ||
              action.includes('update') ||
              action.includes('apply') ||
              action.includes('manage')
            ) {
              privileges[module]![action] = true;
            } else {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
    }

    case 'chef': {
      const chefModules: PrivilegeKey[] = ['inventory', 'products', 'orders', 'shop_dashboard'];

      chefModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          Object.keys(privileges[module]!).forEach(action => {
            if (
              action === 'access' ||
              action.includes('view') ||
              action.includes('create') ||
              action.includes('process') ||
              action.includes('update') ||
              action.includes('apply')
            ) {
              privileges[module]![action] = true;
            } else {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
    }

    case 'waiter': {
      const waiterModules: PrivilegeKey[] = ['checkout', 'pos_terminal', 'orders', 'products'];

      waiterModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          Object.keys(privileges[module]!).forEach(action => {
            if (
              action === 'access' ||
              action.includes('view') ||
              action.includes('create') ||
              action.includes('process') ||
              action.includes('apply') ||
              action.includes('park') ||
              action.includes('hold') ||
              action.includes('resume')
            ) {
              privileges[module]![action] = true;
            } else {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
    }

    case 'bartender': {
      const bartenderModules: PrivilegeKey[] = [
        'checkout',
        'pos_terminal',
        'inventory',
        'products',
        'orders',
      ];

      bartenderModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          Object.keys(privileges[module]!).forEach(action => {
            if (
              action === 'access' ||
              action.includes('view') ||
              action.includes('create') ||
              action.includes('process') ||
              action.includes('apply') ||
              action.includes('park') ||
              action.includes('hold') ||
              action.includes('resume')
            ) {
              privileges[module]![action] = true;
            } else {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
    }

    case 'deliveryDriver': {
      const deliveryDriverModules: PrivilegeKey[] = ['orders', 'shop_dashboard'];

      deliveryDriverModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          Object.keys(privileges[module]!).forEach(action => {
            if (action === 'access' || action.includes('view') || action.includes('update')) {
              privileges[module]![action] = true;
            } else {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
    }

    case 'securityGuard': {
      const securityGuardModules: PrivilegeKey[] = ['shop_dashboard'];

      securityGuardModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          Object.keys(privileges[module]!).forEach(action => {
            if (action === 'access' || action.includes('view')) {
              privileges[module]![action] = true;
            } else {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
    }

    case 'maintenanceStaff': {
      const maintenanceStaffModules: PrivilegeKey[] = ['shop_dashboard', 'settings'];

      maintenanceStaffModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          Object.keys(privileges[module]!).forEach(action => {
            if (action === 'access' || action.includes('view')) {
              privileges[module]![action] = true;
            } else {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
    }

    default:
      // Custom role - start with all privileges false, user will toggle as needed
      break;
  }

  // Ensure all users have at least view access to help center
  if (privileges.help) {
    privileges.help.access = true;
    privileges.help.view_help = true;
  }

  return privileges;
};
