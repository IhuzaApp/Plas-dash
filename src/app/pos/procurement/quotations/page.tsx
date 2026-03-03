'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProtectedShopRoute from '@/components/auth/ProtectedShopRoute';
import QuotationsPage from '@/components/pages/pos/procurement/QuotationsPage';
import AdminLayout from '@/components/layout/AdminLayout';

export default function QuotationsPageRoute() {
  return (
    <AdminLayout>
      <ProtectedRoute requiredPrivilege="procurement">
        <ProtectedShopRoute>
          <QuotationsPage />
        </ProtectedShopRoute>
      </ProtectedRoute>
    </AdminLayout>
  );
}
