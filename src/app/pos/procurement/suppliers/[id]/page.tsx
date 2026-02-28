'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import SupplierDetailPage from '@/components/pages/pos/procurement/SupplierDetailPage';
import AdminLayout from '@/components/layout/AdminLayout';

export default function SupplierDetailRoute({ params }: { params: { id: string } }) {
    return (
        <AdminLayout>
            <ProtectedRoute requiredPrivilege="procurement">
                <SupplierDetailPage supplierId={params.id} />
            </ProtectedRoute>
        </AdminLayout>
    );
}
