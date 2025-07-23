'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Transactions from '@/components/pages/pos/Transactions';

export default function TransactionsPage() {
  return (
    <ProtectedRoute requiredPrivilege="transactions:view">
      <Transactions />
    </ProtectedRoute>
  );
}
