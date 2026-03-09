'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Influencers from '@/components/pages/Influencers';

export default function InfluencersPage() {
    return (
        <ProtectedRoute requiredPrivilege="influencers" requiredAction="access">
            <Influencers />
        </ProtectedRoute>
    );
}
