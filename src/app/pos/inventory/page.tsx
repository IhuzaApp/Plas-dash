'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProtectedShopRoute from '@/components/auth/ProtectedShopRoute';
import Inventory from '@/components/pages/pos/Inventory';

export default function InventoryPage() {
  return (
    <ProtectedRoute requiredPrivilege="inventory">
      <ProtectedShopRoute>
        <Inventory />
      </ProtectedShopRoute>
    </ProtectedRoute>
  );
}
