'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import LogisticsDetails from '@/components/pages/LogisticsDetails';

export default function LogisticsDetailsPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute requiredPrivilege="logistics">
      <LogisticsDetails accountId={params.id} />
    </ProtectedRoute>
  );
}
