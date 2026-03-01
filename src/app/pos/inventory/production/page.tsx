'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProtectedShopRoute from '@/components/auth/ProtectedShopRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import ProductionSection from '@/components/pages/pos/production/ProductionSection';
import { FlaskConical } from 'lucide-react';

export default function ProductionPage() {
    return (
        <ProtectedRoute requiredPrivilege="inventory">
            <ProtectedShopRoute>
                <AdminLayout>
                    <PageHeader
                        title="Production"
                        description="Manage production orders, simulate runs, and monitor stock levels."
                        icon={<FlaskConical className="h-6 w-6" />}
                    />
                    <div className="p-6">
                        <ProductionSection />
                    </div>
                </AdminLayout>
            </ProtectedShopRoute>
        </ProtectedRoute>
    );
}
