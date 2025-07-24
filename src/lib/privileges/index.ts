// Export all privilege-related utilities
export { getDefaultPrivilegesForRole } from './rolePrivileges';
export { permissionGroups, type Permission, type PermissionGroup } from './permissionGroups';
export {
  convertCustomPermissionsToPrivileges,
  convertPrivilegesToOldFormat,
  mergePrivileges,
  removePrivileges,
} from './privilegeConverters';
export {
  menuPrivileges,
  getMenuPrivilege,
  shouldShowMenuItem,
  type MenuPrivilege,
} from './menuPrivileges';
export {
  MODULE_DESCRIPTIONS,
  getModuleDescription,
  getAllModules,
  type ModuleDescription,
  type ModuleAction,
} from './moduleDescriptions';
export {
  PAGE_ROUTES,
  findFirstAccessiblePage,
  getAccessiblePages,
  isPageAccessible,
  getRecommendedLandingPage,
  type PageRoute,
} from './pageRouting';

// Re-export types from the main types file
export type { UserPrivileges, PrivilegeKey } from '@/types/privileges';
