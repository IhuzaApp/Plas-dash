'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProtectedShopRoute from '@/components/auth/ProtectedShopRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import StockDeductionSimulator from '@/components/pages/pos/production/StockDeductionSimulator';
import { FlaskConical } from 'lucide-react';

export default function SimulatePage() {
    return (
        <ProtectedRoute requiredPrivilege="inventory">
            <ProtectedShopRoute>
                <AdminLayout>
                    <PageHeader
                        title="Stock Deduction Simulator"
                        description="Simulate ingredient stock deductions before committing to production."
                        icon={<FlaskConical className="h-6 w-6" />}
                    />
                    <div className="p-6">
                        <StockDeductionSimulator />
                    </div>
                </AdminLayout>
            </ProtectedShopRoute>
        </ProtectedRoute>
    );
}
