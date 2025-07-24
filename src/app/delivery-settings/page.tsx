'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import DeliverySettings from '@/components/pages/DeliverySettings';

export default function DeliverySettingsPage() {
  return (
    <ProtectedRoute requiredPrivilege="delivery_settings" requiredAction="view_delivery_settings">
      <DeliverySettings />
    </ProtectedRoute>
  );
}
