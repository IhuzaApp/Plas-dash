'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import SuppliersPage from '@/components/pages/pos/procurement/SuppliersPage';
import AdminLayout from '@/components/layout/AdminLayout';

export default function SuppliersPageRoute() {
    return (
        <AdminLayout>
            <ProtectedRoute requiredPrivilege="procurement">
                <SuppliersPage />
            </ProtectedRoute>
        </AdminLayout>
    );
}
