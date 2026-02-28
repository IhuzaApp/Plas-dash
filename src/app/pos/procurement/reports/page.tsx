'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProcurementReportsPage from '@/components/pages/pos/procurement/ProcurementReportsPage';
import AdminLayout from '@/components/layout/AdminLayout';

export default function ProcurementReportsPageRoute() {
    return (
        <AdminLayout>
            <ProtectedRoute requiredPrivilege="procurement">
                <ProcurementReportsPage />
            </ProtectedRoute>
        </AdminLayout>
    );
}
