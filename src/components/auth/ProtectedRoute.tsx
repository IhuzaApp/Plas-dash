import React from 'react';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  requiredPrivilege: string;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredPrivilege, children }) => {
  const router = useRouter();
  const [hasPrivilege, setHasPrivilege] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let allowed = false;
    if (typeof window !== 'undefined') {
      const sessionStr = localStorage.getItem('orgEmployeeSession');
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          let privillages: string[] = [];
          if (session.orgEmployeeRoles) {
            if (Array.isArray(session.orgEmployeeRoles)) {
              privillages = session.orgEmployeeRoles[0]?.privillages || [];
            } else if (session.orgEmployeeRoles.privillages) {
              privillages = session.orgEmployeeRoles.privillages;
            }
          }
          allowed = privillages.includes(requiredPrivilege);
        } catch {}
      }
    }
    setHasPrivilege(allowed);
    if (!allowed) {
      router.replace('/not-authorized');
    }
  }, [requiredPrivilege, router]);

  if (hasPrivilege === null) {
    return null; // Or a loading spinner
  }
  if (!hasPrivilege) {
    return null;
  }
  return <>{children}</>;
}; 