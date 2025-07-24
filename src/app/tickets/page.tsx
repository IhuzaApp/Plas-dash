'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Tickets from '@/components/pages/Tickets';

export default function TicketsPage() {
  return (
    <ProtectedRoute requiredPrivilege="tickets:view">
      <Tickets />
    </ProtectedRoute>
  );
}
