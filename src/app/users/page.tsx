'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Users from '@/components/pages/Users';

export default function UsersPage() {
  return (
    <ProtectedRoute requiredPrivilege="users">
      <Users />
    </ProtectedRoute>
  );
}
