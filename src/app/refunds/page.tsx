'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Refunds from '@/components/pages/Refunds';

export default function RefundsPage() {
  return (
    <ProtectedRoute requiredPrivilege="refunds" requiredAction="view_refunds">
      <Refunds />
    </ProtectedRoute>
  );
}
