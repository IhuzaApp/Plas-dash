'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProtectedShopRoute from '@/components/auth/ProtectedShopRoute';
import CompanyDashboard from '@/components/pages/pos/CompanyDashboard';
import { useAuth } from '@/components/layout/RootLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

export default function CompanyDashboardPage() {
  const { session } = useAuth();

  if (session?.isProjectUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            This page is for Organization Employees only. Project Users should use the main
            dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPrivilege="company_dashboard">
      <ProtectedShopRoute>
        <CompanyDashboard />
      </ProtectedShopRoute>
    </ProtectedRoute>
  );
}
