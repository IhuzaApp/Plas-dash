import { ProjectUserPrivileges, DEFAULT_PROJECT_PRIVILEGES, ProjectPrivilegeKey } from '@/types/projectPrivileges';

/**
 * Get default project privileges for a specific project role type
 * @param projectRoleType - The project role type to get privileges for
 * @returns ProjectUserPrivileges object with appropriate permissions for the project role
 */
export const getDefaultProjectPrivilegesForRole = (projectRoleType: string): ProjectUserPrivileges => {
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
            if (action.includes('delete') || action.includes('debug') || action.includes('maintenance')) {
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
            if (action.includes('delete') || action.includes('debug') || action.includes('maintenance') || action.includes('configure') || action.includes('set')) {
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
            if (action.includes('delete') || action.includes('system') || action.includes('security') || action.includes('configure') || action.includes('set') || action.includes('activate') || action.includes('deactivate')) {
              privileges[module]![action] = false;
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

  return privileges;
};

// Project role types
export const PROJECT_ROLE_TYPES = [
  'projectAdmin',
  'systemAdmin', 
  'projectManager',
  'customerSupport',
] as const;

export type ProjectRoleType = typeof PROJECT_ROLE_TYPES[number]; 