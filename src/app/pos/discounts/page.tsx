'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Discounts from '@/components/pages/pos/Discounts';

export default function DiscountsPage() {
  return (
    <ProtectedRoute requiredPrivilege="discounts:view">
      <Discounts />
    </ProtectedRoute>
  );
}
