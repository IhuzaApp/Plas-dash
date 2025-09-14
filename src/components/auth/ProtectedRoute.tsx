'use client';

import React from 'react';
import { usePrivilege } from '@/hooks/usePrivilege';
import { useProjectPrivilege } from '@/hooks/useProjectPrivilege';
import { PrivilegeKey } from '@/types/privileges';
import { ProjectPrivilegeKey } from '@/types/projectPrivileges';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPrivilege?: PrivilegeKey | ProjectPrivilegeKey;
  requiredAction?: string;
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
}

export function ProtectedRoute({
  children,
  requiredPrivilege,
  requiredAction,
  fallback,
  showAccessDenied = true,
}: ProtectedRouteProps) {
  const { hasModuleAccess, hasAction, isAuthenticated } = usePrivilege();
  const { hasProjectModuleAccess, hasProjectAction, isProjectUser } = useProjectPrivilege();

  // Check if user is authenticated (either regular user or project user)
  const isUserAuthenticated = isAuthenticated() || isProjectUser();

  // If no privilege is required, just check authentication
  if (!requiredPrivilege) {
    if (!isUserAuthenticated) {
      return (
        fallback || (
          <div className="flex items-center justify-center min-h-[400px]">
            <Alert className="max-w-md">
              <Lock className="h-4 w-4" />
              <AlertDescription>Please log in to access this page.</AlertDescription>
            </Alert>
          </div>
        )
      );
    }
    return <>{children}</>;
  }

  // Check if user has the required privilege
  let hasAccess = false;

  // Check both privilege systems
  if (isProjectUser()) {
    // Check project user privileges
    if (requiredAction) {
      hasAccess = hasProjectAction(requiredPrivilege as ProjectPrivilegeKey, requiredAction as any);
    } else {
      hasAccess = hasProjectModuleAccess(requiredPrivilege as ProjectPrivilegeKey);
    }
  } else if (isAuthenticated()) {
    // Check regular user privileges
    if (requiredAction) {
      hasAccess = hasAction(requiredPrivilege as PrivilegeKey, requiredAction);
    } else {
      hasAccess = hasModuleAccess(requiredPrivilege as PrivilegeKey);
    }
  }

  if (!hasAccess) {
    if (showAccessDenied) {
      return (
        fallback || (
          <div className="flex items-center justify-center min-h-[400px]">
            <Alert className="max-w-md">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                You don't have permission to access this page.
                {requiredAction && (
                  <span className="block mt-1 text-sm text-muted-foreground">
                    Required: {requiredPrivilege}.{requiredAction}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )
      );
    }
    return null;
  }

  return <>{children}</>;
}

// Convenience component for protecting specific actions
export function ProtectedAction({
  children,
  module,
  action,
  fallback,
  showAccessDenied = false,
}: {
  children: React.ReactNode;
  module: PrivilegeKey;
  action: string;
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
}) {
  return (
    <ProtectedRoute
      requiredPrivilege={module}
      requiredAction={action}
      fallback={fallback}
      showAccessDenied={showAccessDenied}
    >
      {children}
    </ProtectedRoute>
  );
}

// Convenience component for protecting UI elements that should be hidden when no access
export function ProtectedUI({
  children,
  module,
  action,
  fallback = null,
}: {
  children: React.ReactNode;
  module: PrivilegeKey;
  action?: string;
  fallback?: React.ReactNode;
}) {
  return (
    <ProtectedRoute
      requiredPrivilege={module}
      requiredAction={action}
      fallback={fallback}
      showAccessDenied={false}
    >
      {children}
    </ProtectedRoute>
  );
}
