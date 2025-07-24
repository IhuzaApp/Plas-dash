'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Wallets from '@/components/pages/Wallets';

export default function CompanyWalletPage() {
  return (
    <ProtectedRoute requiredPrivilege="wallet:view">
      <Wallets />
    </ProtectedRoute>
  );
}
