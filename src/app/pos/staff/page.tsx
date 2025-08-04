'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProtectedShopRoute from '@/components/auth/ProtectedShopRoute';
import StaffLogin from '@/components/pages/pos/StaffLogin';

export default function StaffPage() {
  return (
    <ProtectedRoute requiredPrivilege="staff_management">
      <ProtectedShopRoute>
        <StaffLogin />
      </ProtectedShopRoute>
    </ProtectedRoute>
  );
}
