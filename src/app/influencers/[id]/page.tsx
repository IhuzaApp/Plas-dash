'use client';

import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import InfluencerProfile from '@/components/pages/InfluencerProfile';

export default function InfluencerProfilePage() {
  const params = useParams();

  if (!params || !params.id) return null;

  const id = params.id as string;

  return (
    <ProtectedRoute requiredPrivilege="influencers" requiredAction="access">
      <InfluencerProfile id={id} />
    </ProtectedRoute>
  );
}
