'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProtectedShopRoute from '@/components/auth/ProtectedShopRoute';
import GoodsReceivedPage from '@/components/pages/pos/procurement/GoodsReceivedPage';
import AdminLayout from '@/components/layout/AdminLayout';

export default function GoodsReceivedPageRoute() {
  return (
    <AdminLayout>
      <ProtectedRoute requiredPrivilege="procurement">
        <ProtectedShopRoute>
          <GoodsReceivedPage />
        </ProtectedShopRoute>
      </ProtectedRoute>
    </AdminLayout>
  );
}
