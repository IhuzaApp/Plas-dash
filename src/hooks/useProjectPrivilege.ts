import { useCallback } from 'react';
import {
  ProjectUserPrivileges,
  ProjectPrivilegeKey,
  hasProjectPrivilege,
} from '@/types/projectPrivileges';

interface UseProjectPrivilegeReturn {
  hasProjectModuleAccess: (module: ProjectPrivilegeKey) => boolean;
  hasProjectAction: <T extends ProjectPrivilegeKey>(
    module: T,
    action: keyof NonNullable<ProjectUserPrivileges[T]>
  ) => boolean;
  isProjectUser: () => boolean;
}

export function useProjectPrivilege(): UseProjectPrivilegeReturn {
  // Get project user privileges from session/localStorage
  const getProjectPrivileges = useCallback((): ProjectUserPrivileges | null => {
    if (typeof window === 'undefined') return null;

    const session = localStorage.getItem('projectUserSession');
    if (!session) return null;

    try {
      const parsedSession = JSON.parse(session);
      return parsedSession.privileges || null;
    } catch {
      return null;
    }
  }, []);

  const hasProjectModuleAccess = useCallback(
    (module: ProjectPrivilegeKey): boolean => {
      const privileges = getProjectPrivileges();
      return hasProjectPrivilege(privileges, module);
    },
    [getProjectPrivileges]
  );

  const hasProjectAction = useCallback(
    <T extends ProjectPrivilegeKey>(
      module: T,
      action: keyof NonNullable<ProjectUserPrivileges[T]>
    ): boolean => {
      const privileges = getProjectPrivileges();
      return hasProjectPrivilege(privileges, module, action as string);
    },
    [getProjectPrivileges]
  );

  const isProjectUser = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;

    const session = localStorage.getItem('projectUserSession');
    if (!session) return false;

    try {
      const parsedSession = JSON.parse(session);
      return parsedSession.isProjectUser === true;
    } catch {
      return false;
    }
  }, []);

  return {
    hasProjectModuleAccess,
    hasProjectAction,
    isProjectUser,
  };
}
