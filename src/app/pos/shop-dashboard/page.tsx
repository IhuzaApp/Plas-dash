'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ShopDashboard from '@/components/pages/pos/ShopDashboard';

export default function ShopDashboardPage() {
  return (
    <ProtectedRoute requiredPrivilege="shopDashboard:view">
      <ShopDashboard />
    </ProtectedRoute>
  );
}
