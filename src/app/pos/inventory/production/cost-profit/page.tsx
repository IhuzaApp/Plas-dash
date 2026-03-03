'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProtectedShopRoute from '@/components/auth/ProtectedShopRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import CostProfitPreview from '@/components/pages/pos/production/CostProfitPreview';
import { DollarSign } from 'lucide-react';

export default function CostProfitPage() {
  return (
    <ProtectedRoute requiredPrivilege="inventory">
      <ProtectedShopRoute>
        <AdminLayout>
          <PageHeader
            title="Cost & Profit Preview"
            description="Analyze ingredient costs, labour, and profit margins for any recipe."
            icon={<DollarSign className="h-6 w-6" />}
          />
          <div className="p-6">
            <CostProfitPreview />
          </div>
        </AdminLayout>
      </ProtectedShopRoute>
    </ProtectedRoute>
  );
}
