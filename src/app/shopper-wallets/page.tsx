'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Wallets from '@/components/pages/Wallets';

export default function ShopperWalletsPage() {
  return (
    <ProtectedRoute requiredPrivilege="wallet" requiredAction="view_wallets">
      <Wallets />
    </ProtectedRoute>
  );
}
