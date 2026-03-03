'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProtectedShopRoute from '@/components/auth/ProtectedShopRoute';
import Transactions from '@/components/pages/pos/Transactions';

export default function TransactionsPage() {
  return (
    <ProtectedRoute requiredPrivilege="transactions">
      <ProtectedShopRoute>
        <Transactions />
      </ProtectedShopRoute>
    </ProtectedRoute>
  );
}
