'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProtectedShopRoute from '@/components/auth/ProtectedShopRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import ProductionOrders from '@/components/pages/pos/production/ProductionOrders';
import { ClipboardList } from 'lucide-react';

export default function ProductionOrdersPage() {
  return (
    <ProtectedRoute requiredPrivilege="inventory">
      <ProtectedShopRoute>
        <AdminLayout>
          <PageHeader
            title="Production Orders"
            description="Manage and track production batch orders."
            icon={<ClipboardList className="h-6 w-6" />}
          />
          <div className="p-6">
            <ProductionOrders />
          </div>
        </AdminLayout>
      </ProtectedShopRoute>
    </ProtectedRoute>
  );
}
