'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProtectedShopRoute from '@/components/auth/ProtectedShopRoute';
import ProcurementReportsPage from '@/components/pages/pos/procurement/ProcurementReportsPage';
import AdminLayout from '@/components/layout/AdminLayout';

export default function ProcurementReportsPageRoute() {
  return (
    <AdminLayout>
      <ProtectedRoute requiredPrivilege="procurement">
        <ProtectedShopRoute>
          <ProcurementReportsPage />
        </ProtectedShopRoute>
      </ProtectedRoute>
    </AdminLayout>
  );
}
