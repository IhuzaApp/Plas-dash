'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Shoppers from '@/components/pages/Shoppers';

export default function ShoppersPage() {
  return (
    <ProtectedRoute requiredPrivilege="shoppers">
      <Shoppers />
    </ProtectedRoute>
  );
}
