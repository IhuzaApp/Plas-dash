'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProtectedShopRoute from '@/components/auth/ProtectedShopRoute';
import ShopDashboard from '@/components/pages/pos/ShopDashboard';

export default function ShopDashboardPage() {
  return (
    <ProtectedRoute requiredPrivilege="shop_dashboard">
      <ProtectedShopRoute>
        <ShopDashboard />
      </ProtectedShopRoute>
    </ProtectedRoute>
  );
}
