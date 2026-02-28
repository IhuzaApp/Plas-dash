'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProcurementDashboard from '@/components/pages/pos/procurement/ProcurementDashboard';
import AdminLayout from '@/components/layout/AdminLayout';

export default function ProcurementDashboardPage() {
    return (
        <AdminLayout>
            <ProtectedRoute requiredPrivilege="procurement">
                <ProcurementDashboard />
            </ProtectedRoute>
        </AdminLayout>
    );
}
