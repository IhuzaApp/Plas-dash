'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Products from '@/components/pages/Products';

export default function ProductsPage() {
  return (
    <ProtectedRoute requiredPrivilege="products">
      <Products />
    </ProtectedRoute>
  );
}
