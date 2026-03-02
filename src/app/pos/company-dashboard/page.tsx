'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProtectedShopRoute from '@/components/auth/ProtectedShopRoute';
import CompanyDashboard from '@/components/pages/pos/CompanyDashboard';

export default function CompanyDashboardPage() {
  return (
    <ProtectedRoute requiredPrivilege="company_dashboard">
      <ProtectedShopRoute>
        <CompanyDashboard />
      </ProtectedShopRoute>
    </ProtectedRoute>
  );
}
