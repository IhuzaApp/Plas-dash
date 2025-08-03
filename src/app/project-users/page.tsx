'use client';

import { ProtectedProjectRoute } from '@/components/auth/ProtectedProjectRoute';
import ProjectUsers from '@/components/pages/ProjectUsers';

export default function ProjectUsersPage() {
  return (
    <ProtectedProjectRoute requiredPrivilege="project_users">
      <ProjectUsers />
    </ProtectedProjectRoute>
  );
} 