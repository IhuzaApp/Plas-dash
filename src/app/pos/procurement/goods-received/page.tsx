'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import GoodsReceivedPage from '@/components/pages/pos/procurement/GoodsReceivedPage';
import AdminLayout from '@/components/layout/AdminLayout';

export default function GoodsReceivedPageRoute() {
    return (
        <AdminLayout>
            <ProtectedRoute requiredPrivilege="procurement">
                <GoodsReceivedPage />
            </ProtectedRoute>
        </AdminLayout>
    );
}
