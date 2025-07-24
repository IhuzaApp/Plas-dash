'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Promotions from '@/components/pages/Promotions';

export default function PromotionsPage() {
  return (
    <ProtectedRoute requiredPrivilege="promotions" requiredAction="view_promotions">
      <Promotions />
    </ProtectedRoute>
  );
}
