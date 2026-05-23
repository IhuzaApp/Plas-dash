'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProtectedShopRoute from '@/components/auth/ProtectedShopRoute';
import POSBoard from '@/components/pages/pos/POSBoard';

export default function POSBoardPage() {
  return (
    <ProtectedRoute requiredPrivilege="checkout">
      <ProtectedShopRoute>
        <POSBoard />
      </ProtectedShopRoute>
    </ProtectedRoute>
  );
}
