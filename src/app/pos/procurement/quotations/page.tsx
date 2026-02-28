'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import QuotationsPage from '@/components/pages/pos/procurement/QuotationsPage';
import AdminLayout from '@/components/layout/AdminLayout';

export default function QuotationsPageRoute() {
    return (
        <AdminLayout>
            <ProtectedRoute requiredPrivilege="procurement">
                <QuotationsPage />
            </ProtectedRoute>
        </AdminLayout>
    );
}
