import { useContext } from 'react';
import { AuthContext } from '@/components/layout/RootLayout';
import {
  hasPrivilege,
  getModulePrivileges,
  PrivilegeKey,
  UserPrivileges,
} from '@/types/privileges';

export function usePrivilege() {
  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error('usePrivilege must be used within an AuthProvider');
  }

  const { session } = authContext;

  // Check if user has access to a specific module
  const hasModuleAccess = (module: PrivilegeKey): boolean => {
    if (!session?.privileges) return false;
    return hasPrivilege(session.privileges, module, undefined, session.role);
  };

  // Check if user has a specific action privilege within a module
  const hasAction = (module: PrivilegeKey, action: string): boolean => {
    if (!session?.privileges) return false;
    return hasPrivilege(session.privileges, module, action, session.role);
  };

  // Get all privileges for a specific module
  const getModulePrivilegesData = (module: PrivilegeKey) => {
    if (!session?.privileges) return null;
    return getModulePrivileges(session.privileges, module);
  };

  // Check if user has any privilege in a module (useful for showing/hiding entire sections)
  const hasAnyPrivilege = (module: PrivilegeKey): boolean => {
    if (!session?.privileges) return false;
    const modulePrivileges = getModulePrivileges(session.privileges, module);
    if (!modulePrivileges) return false;

    // Check if any privilege in the module is true
    return Object.values(modulePrivileges).some(privilege => privilege === true);
  };

  // Get all user privileges
  const getAllPrivileges = (): UserPrivileges | null => {
    return session?.privileges || null;
  };

  // Check if user is authenticated
  const isAuthenticated = (): boolean => {
    return !!session;
  };

  // Check if user has admin/super user privileges (all privileges)
  const isSuperUser = (): boolean => {
    if (!session?.privileges) return false;

    // Check if user has access to all major modules
    const majorModules: PrivilegeKey[] = [
      'checkout',
      'staff_management',
      'inventory',
      'transactions',
      'orders',
      'products',
      'users',
      'shops',
      'shoppers',
    ];

    return majorModules.every(module => hasPrivilege(session.privileges, module, undefined, session.role));
  };

  return {
    hasModuleAccess,
    hasAction,
    getModulePrivileges: getModulePrivilegesData,
    hasAnyPrivilege,
    getAllPrivileges,
    isAuthenticated,
    isSuperUser,
    session,
  };
}

// Convenience hook for checking specific privileges
export function useSpecificPrivilege(module: PrivilegeKey, action?: string) {
  const { hasModuleAccess, hasAction } = usePrivilege();

  if (action) {
    return hasAction(module, action);
  }

  return hasModuleAccess(module);
}
