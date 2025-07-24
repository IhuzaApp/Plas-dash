'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Index from '@/components/pages/Index';

export default function HomePage() {
  return (
    <ProtectedRoute requiredPrivilege="company_dashboard">
      <Index />
    </ProtectedRoute>
  );
}
