'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Logistics from '@/components/pages/Logistics';

export default function LogisticsPage() {
  return (
    <ProtectedRoute requiredPrivilege="logistics">
      <Logistics />
    </ProtectedRoute>
  );
}
