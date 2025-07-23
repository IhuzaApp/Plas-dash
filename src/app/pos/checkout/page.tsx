'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Checkout from '@/components/pages/pos/Checkout';

export default function CheckoutPage() {
  return (
    <ProtectedRoute requiredPrivilege="checkout:view">
      <Checkout />
    </ProtectedRoute>
  );
}
