'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import FinancialOverview from '@/components/pages/pos/FinancialOverview';

export default function FinancialOverviewPage() {
  return (
    <ProtectedRoute requiredPrivilege="financial_overview">
      <FinancialOverview />
    </ProtectedRoute>
  );
}
