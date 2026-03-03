import QuotationDetailPage from '@/components/pages/pos/procurement/QuotationDetailPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';

export default function QuotationViewPage({ params }: { params: { id: string } }) {
  return (
    <AdminLayout>
      <ProtectedRoute requiredPrivilege="procurement">
        <QuotationDetailPage quotationId={params.id} />
      </ProtectedRoute>
    </AdminLayout>
  );
}
