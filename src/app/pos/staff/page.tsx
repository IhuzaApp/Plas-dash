'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import StaffLogin from '@/components/pages/pos/StaffLogin';

export default function StaffPage() {
  return (
    <ProtectedRoute requiredPrivilege="staff:view">
      <StaffLogin />
    </ProtectedRoute>
  );
}
