'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProtectedShopRoute from '@/components/auth/ProtectedShopRoute';
import ProcurementDashboard from '@/components/pages/pos/procurement/ProcurementDashboard';
import AdminLayout from '@/components/layout/AdminLayout';

export default function ProcurementDashboardPage() {
  return (
    <AdminLayout>
      <ProtectedRoute requiredPrivilege="procurement">
        <ProtectedShopRoute>
          <ProcurementDashboard />
        </ProtectedShopRoute>
      </ProtectedRoute>
    </AdminLayout>
  );
}
