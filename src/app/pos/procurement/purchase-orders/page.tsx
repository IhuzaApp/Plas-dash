'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import PurchaseOrdersPage from '@/components/pages/pos/procurement/PurchaseOrdersPage';
import AdminLayout from '@/components/layout/AdminLayout';

export default function PurchaseOrdersPageRoute() {
  return (
    <AdminLayout>
      <ProtectedRoute requiredPrivilege="procurement">
        <PurchaseOrdersPage />
      </ProtectedRoute>
    </AdminLayout>
  );
}
