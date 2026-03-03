'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProtectedShopRoute from '@/components/auth/ProtectedShopRoute';
import Checkout from '@/components/pages/pos/Checkout';

export default function CheckoutPage() {
  return (
    <ProtectedRoute requiredPrivilege="checkout">
      <ProtectedShopRoute>
        <Checkout />
      </ProtectedShopRoute>
    </ProtectedRoute>
  );
}
