'use client';

import React from 'react';
import { useProjectPrivilege } from '@/hooks/useProjectPrivilege';
import { ProjectPrivilegeKey } from '@/types/projectPrivileges';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock } from 'lucide-react';

interface ProtectedProjectRouteProps {
  children: React.ReactNode;
  requiredPrivilege?: ProjectPrivilegeKey;
  requiredAction?: string;
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
}

export function ProtectedProjectRoute({
  children,
  requiredPrivilege,
  requiredAction,
  fallback,
  showAccessDenied = true,
}: ProtectedProjectRouteProps) {
  const { hasProjectModuleAccess, hasProjectAction, isProjectUser } = useProjectPrivilege();

  // Check if user is a project user
  if (!isProjectUser()) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert className="max-w-md">
            <Lock className="h-4 w-4" />
            <AlertDescription>This page is only accessible to project users.</AlertDescription>
          </Alert>
        </div>
      )
    );
  }

  // If no privilege is required, just check if user is project user
  if (!requiredPrivilege) {
    return <>{children}</>;
  }

  // Check if user has the required privilege
  let hasAccess = false;

  if (requiredAction) {
    // Check for specific action within the module
    hasAccess = hasProjectAction(requiredPrivilege, requiredAction as any);
  } else {
    // Check for module access
    hasAccess = hasProjectModuleAccess(requiredPrivilege);
  }

  if (!hasAccess) {
    if (showAccessDenied) {
      return (
        fallback || (
          <div className="flex items-center justify-center min-h-[400px]">
            <Alert className="max-w-md">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                You don&apos;t have permission to access this page.
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

// Convenience component for protecting specific project actions
export function ProtectedProjectAction({
  children,
  module,
  action,
  fallback,
  showAccessDenied = false,
}: {
  children: React.ReactNode;
  module: ProjectPrivilegeKey;
  action: string;
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
}) {
  return (
    <ProtectedProjectRoute
      requiredPrivilege={module}
      requiredAction={action}
      fallback={fallback}
      showAccessDenied={showAccessDenied}
    >
      {children}
    </ProtectedProjectRoute>
  );
}

// Convenience component for protecting UI elements that should be hidden when no access
export function ProtectedProjectUI({
  children,
  module,
  action,
  fallback = null,
}: {
  children: React.ReactNode;
  module: ProjectPrivilegeKey;
  action?: string;
  fallback?: React.ReactNode;
}) {
  return (
    <ProtectedProjectRoute
      requiredPrivilege={module}
      requiredAction={action}
      fallback={fallback}
      showAccessDenied={false}
    >
      {children}
    </ProtectedProjectRoute>
  );
}
