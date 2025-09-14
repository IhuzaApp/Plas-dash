'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Shops from '@/components/pages/Shops';

export default function ShopsPage() {
  return (
    <ProtectedRoute requiredPrivilege="shops">
      <Shops />
    </ProtectedRoute>
  );
}
