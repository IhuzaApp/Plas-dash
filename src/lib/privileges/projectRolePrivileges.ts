import {
  ProjectUserPrivileges,
  DEFAULT_PROJECT_PRIVILEGES,
  ProjectPrivilegeKey,
} from '@/types/projectPrivileges';

/**
 * Get default project privileges for a specific project role type
 * @param projectRoleType - The project role type to get privileges for
 * @returns ProjectUserPrivileges object with appropriate permissions for the project role
 */
export const getDefaultProjectPrivilegesForRole = (
  projectRoleType: string
): ProjectUserPrivileges => {
  // Start with all privileges set to false
  const privileges: ProjectUserPrivileges = {} as ProjectUserPrivileges;
  Object.keys(DEFAULT_PROJECT_PRIVILEGES).forEach(module => {
    privileges[module as ProjectPrivilegeKey] = {
      access: false,
      ...DEFAULT_PROJECT_PRIVILEGES[module as ProjectPrivilegeKey],
    };
    // Explicitly set all actions to false for all modules
    Object.keys(privileges[module as ProjectPrivilegeKey]!).forEach(action => {
      privileges[module as ProjectPrivilegeKey]![action] = false;
    });
    // Ensure 'access' is always present and set to false
    if (!('access' in privileges[module as ProjectPrivilegeKey]!)) {
      privileges[module as ProjectPrivilegeKey]!.access = false;
    }
  });

  switch (projectRoleType) {
    case 'projectAdmin':
      // Global System Admin - Full access to everything including POS operations
      // This includes all store staff privileges + all project user privileges
      const globalAdminModules: ProjectPrivilegeKey[] = [
        // Store Operations (including POS)
        'orders',
        'shoppers',
        'users',
        'shops',
        'products',
        'wallet',
        'refunds',
        'tickets',
        'help',
        'dashboard',
        'delivery_settings',
        'promotions',
        'settings',

        // POS Operations (exclusive to Global Admin)
        'checkout',
        'staff_management',
        'inventory',
        'transactions',
        'discounts',
        'company_dashboard',
        'shop_dashboard',
        'financial_overview',
        'pos_terminal',

        // Project Management
        'system_management',
        'user_management',
        'project_users',
        'analytics',
        'reporting',
        'support_management',
        'help_management',
        'system_configuration',
        'global_settings',
        'security_management',
        'access_control',
        'system_monitoring',
        'audit_logs',
        'development_tools',
        'maintenance',

        // Page Access
        'pages',
        'referrals',
        'plasmarket',
        'restaurants',
      ];

      globalAdminModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          Object.keys(privileges[module]!).forEach(action => {
            // Grant ALL actions to Global System Admin
            privileges[module]![action] = true;
          });
        }
      });
      break;

    case 'systemAdmin': {
      const systemAdminModules: ProjectPrivilegeKey[] = [
        'orders',
        'shoppers',
        'users',
        'shops',
        'products',
        'wallet',
        'refunds',
        'tickets',
        'help',
        'dashboard',
        'delivery_settings',
        'promotions',
        'settings',
        'plasmarket',
        'restaurants',
      ];
      systemAdminModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          Object.keys(privileges[module]!).forEach(action => {
            if (
              action === 'access' ||
              action.includes('view') ||
              action.includes('manage') ||
              action.includes('create') ||
              action.includes('edit') ||
              action.includes('export') ||
              action.includes('generate') ||
              action.includes('schedule') ||
              action.includes('assign') ||
              action.includes('resolve') ||
              action.includes('process') ||
              action.includes('approve') ||
              action.includes('reject') ||
              action.includes('activate') ||
              action.includes('deactivate') ||
              action.includes('configure') ||
              action.includes('set')
            ) {
              privileges[module]![action] = true;
            }
            // Restrict sensitive operations
            if (
              action.includes('delete') ||
              action.includes('debug') ||
              action.includes('maintenance')
            ) {
              privileges[module]![action] = false;
            }
            // Allow System Admin to delete users, but NOT shops/businesses for safety
            if (action === 'delete_business') {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
    }

    case 'projectManager': {
      const projectManagerModules: ProjectPrivilegeKey[] = [
        'orders',
        'shoppers',
        'users',
        'shops',
        'products',
        'wallet',
        'refunds',
        'tickets',
        'help',
        'dashboard',
        'promotions',
        'plasmarket',
        'restaurants',
        'withdraw_requests',
      ];
      projectManagerModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          Object.keys(privileges[module]!).forEach(action => {
            if (
              action === 'access' ||
              action.includes('view') ||
              action.includes('manage') ||
              action.includes('create') ||
              action.includes('edit') ||
              action.includes('export') ||
              action.includes('generate') ||
              action.includes('schedule') ||
              action.includes('assign') ||
              action.includes('resolve') ||
              action.includes('process') ||
              action.includes('approve') ||
              action.includes('reject') ||
              action.includes('activate') ||
              action.includes('deactivate')
            ) {
              privileges[module]![action] = true;
            }
            // Restrict sensitive operations
            if (
              action.includes('delete') ||
              action.includes('debug') ||
              action.includes('maintenance') ||
              action.includes('configure') ||
              action.includes('set') ||
              action === 'manage_status' ||
              action === 'delete_business'
            ) {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
    }

    case 'customerSupport': {
      const customerSupportModules: ProjectPrivilegeKey[] = [
        'orders',
        'shoppers',
        'users',
        'shops',
        'products',
        'wallet',
        'refunds',
        'tickets',
        'help',
        'restaurants',
        'withdraw_requests',
      ];
      customerSupportModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          Object.keys(privileges[module]!).forEach(action => {
            if (
              action === 'access' ||
              action.includes('view') ||
              action.includes('manage') ||
              action.includes('create') ||
              action.includes('edit') ||
              action.includes('export') ||
              action.includes('assign') ||
              action.includes('resolve') ||
              action.includes('process') ||
              action.includes('approve') ||
              action.includes('reject')
            ) {
              privileges[module]![action] = true;
            }
            // Restrict sensitive operations
            if (
              action.includes('delete') ||
              action.includes('system') ||
              action.includes('security') ||
              action.includes('configure') ||
              action.includes('set') ||
              action.includes('activate') ||
              action.includes('deactivate') ||
              action === 'manage_status'
            ) {
              privileges[module]![action] = false;
            }
          });
        }
      });
      break;
    }

    case 'support': {
      const supportModules: ProjectPrivilegeKey[] = ['shops', 'tickets', 'shoppers', 'plasmarket'];
      supportModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          Object.keys(privileges[module]!).forEach(action => {
            if (
              action === 'access' ||
              action.includes('view') ||
              action.includes('manage') ||
              action.includes('create') ||
              action.includes('edit') ||
              action.includes('resolve') ||
              action.includes('process')
            ) {
              privileges[module]![action] = true;
            }
          });
        }
      });
      break;
    }

    case 'sales': {
      const salesModules: ProjectPrivilegeKey[] = [
        'financial_overview',
        'transactions',
        'wallet',
        'refunds',
        'company_dashboard',
      ];
      salesModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          Object.keys(privileges[module]!).forEach(action => {
            if (
              action === 'access' ||
              action.includes('view') ||
              action.includes('manage') ||
              action.includes('export') ||
              action.includes('process') ||
              action.includes('generate')
            ) {
              privileges[module]![action] = true;
            }
          });
        }
      });
      break;
    }

    case 'manager': {
      const managerModules: ProjectPrivilegeKey[] = ['project_users', 'users', 'staff_management'];
      managerModules.forEach(module => {
        if (privileges[module]) {
          privileges[module]!.access = true;
          Object.keys(privileges[module]!).forEach(action => {
            if (
              action === 'access' ||
              action.includes('view') ||
              action.includes('manage') ||
              action.includes('create') ||
              action.includes('edit') ||
              action.includes('assign') ||
              action.includes('add')
            ) {
              privileges[module]![action] = true;
            }
          });
        }
      });
      break;
    }

    default:
      // No privileges for unknown roles
      break;
  }

  // Sync with pages module for sidebar visibility
  if (!privileges.pages) {
    privileges.pages = { access: false };
  }
  const pages = privileges.pages as any;
  Object.keys(privileges).forEach(module => {
    if (module !== 'pages' && (privileges[module as ProjectPrivilegeKey] as any)?.access) {
      const pageKey = `access_${module}`;
      pages[pageKey] = true;
      pages.access = true;
    }
  });

  return privileges;
};

// Project role types
export const PROJECT_ROLE_TYPES = [
  'projectAdmin',
  'systemAdmin',
  'projectManager',
  'customerSupport',
  'support',
  'sales',
  'manager',
] as const;

export type ProjectRoleType = (typeof PROJECT_ROLE_TYPES)[number];
