'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProtectedShopRoute from '@/components/auth/ProtectedShopRoute';
import PurchaseOrdersPage from '@/components/pages/pos/procurement/PurchaseOrdersPage';
import AdminLayout from '@/components/layout/AdminLayout';

export default function PurchaseOrdersPageRoute() {
  return (
    <AdminLayout>
      <ProtectedRoute requiredPrivilege="procurement">
        <ProtectedShopRoute>
          <PurchaseOrdersPage />
        </ProtectedShopRoute>
      </ProtectedRoute>
    </AdminLayout>
  );
}
