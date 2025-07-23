'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Inventory from '@/components/pages/pos/Inventory';

export default function InventoryPage() {
  return (
    <ProtectedRoute requiredPrivilege="inventory:view">
      <Inventory />
    </ProtectedRoute>
  );
}
