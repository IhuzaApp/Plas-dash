'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import CompanyDashboard from '@/components/pages/pos/CompanyDashboard';

export default function CompanyDashboardPage() {
  return (
    <ProtectedRoute requiredPrivilege="company_dashboard">
      <CompanyDashboard />
    </ProtectedRoute>
  );
}
