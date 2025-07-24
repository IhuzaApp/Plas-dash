'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Settings from '@/components/pages/Settings';

export default function SettingsPage() {
  return (
    <ProtectedRoute requiredPrivilege="settings">
      <Settings />
    </ProtectedRoute>
  );
}
