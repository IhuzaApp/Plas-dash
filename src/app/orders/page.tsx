'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Orders from '@/components/pages/Orders';

export default function OrdersPage() {
  return (
    <ProtectedRoute requiredPrivilege="orders">
      <Orders />
    </ProtectedRoute>
  );
}
