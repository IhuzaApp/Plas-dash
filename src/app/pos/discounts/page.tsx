'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProtectedShopRoute from '@/components/auth/ProtectedShopRoute';
import Discounts from '@/components/pages/pos/Discounts';

export default function DiscountsPage() {
  return (
    <ProtectedRoute requiredPrivilege="discounts">
      <ProtectedShopRoute>
        <Discounts />
      </ProtectedShopRoute>
    </ProtectedRoute>
  );
}
