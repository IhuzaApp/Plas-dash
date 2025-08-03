'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProjectUsers from '@/components/pages/ProjectUsers';

export default function ProjectUsersPage() {
  return (
    <ProtectedRoute requiredPrivilege="project_users">
      <ProjectUsers />
    </ProtectedRoute>
  );
} 