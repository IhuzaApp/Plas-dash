'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import DeliverySettings from '@/components/pages/DeliverySettings';

export default function DeliverySettingsPage() {
  return (
    <ProtectedRoute requiredPrivilege="settings:view">
      <DeliverySettings />
    </ProtectedRoute>
  );
}
