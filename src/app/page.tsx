'use client';

import { ProtectedProjectRoute } from '@/components/auth/ProtectedProjectRoute';
import Index from '@/components/pages/Index';

export default function HomePage() {
  return (
    <ProtectedProjectRoute requiredPrivilege="company_dashboard">
      <Index />
    </ProtectedProjectRoute>
  );
}

