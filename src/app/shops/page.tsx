'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import dynamic from 'next/dynamic';

const Shops = dynamic(() => import('@/components/pages/Shops'), { ssr: false });

export default function ShopsPage() {
  return (
    <ProtectedRoute requiredPrivilege="shops">
      <Shops />
    </ProtectedRoute>
  );
}
