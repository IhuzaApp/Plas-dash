'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Pets from '@/components/pages/Pets';

export default function PetsPage() {
  return (
    <ProtectedRoute requiredPrivilege="pets">
      <Pets />
    </ProtectedRoute>
  );
}
