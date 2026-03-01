import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import PurchaseOrderDetailPage from '../../../../../components/pages/pos/procurement/PurchaseOrderDetailPage';

export default function Page({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute requiredPrivilege="procurement">
      <AdminLayout>
        <div className="p-6">
          <PurchaseOrderDetailPage id={params.id} />
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
