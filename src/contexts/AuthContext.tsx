import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { UserPrivileges, DEFAULT_PRIVILEGES } from '@/types/privileges';
import { convertCustomPermissionsToPrivileges } from '@/lib/privileges/privilegeConverters';

export interface SessionData {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  shop_id: string | null;
  shop_name?: string;
  restaurant_name?: string;
  privileges: UserPrivileges;
  expiresAt?: number;
  isProjectUser?: boolean;
  role: string;
}

export interface AuthContextType {
  session: SessionData | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (sessionData: any) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Normalizes different privilege formats (legacy array vs new object) into standard UserPrivileges
export const normalizeUserPrivileges = (orgEmployeeRoles: any): UserPrivileges => {
  if (!orgEmployeeRoles) return { ...DEFAULT_PRIVILEGES };
  let oldPrivileges: any = [];
  if (Array.isArray(orgEmployeeRoles)) {
    oldPrivileges = orgEmployeeRoles[0]?.privillages || [];
  } else if (orgEmployeeRoles.privillages) {
    oldPrivileges = orgEmployeeRoles.privillages;
  }
  if (typeof oldPrivileges === 'object' && !Array.isArray(oldPrivileges)) {
    return { ...DEFAULT_PRIVILEGES, ...oldPrivileges };
  }
  return {
    ...DEFAULT_PRIVILEGES,
    ...convertCustomPermissionsToPrivileges(oldPrivileges as string[]),
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const sessionStr = localStorage.getItem('orgEmployeeSession');
    if (sessionStr) {
      try {
        const sessionData = JSON.parse(sessionStr);
        const now = Date.now();
        const expiresAt = sessionData.expiresAt || 0;
        if (expiresAt && now < expiresAt) {
          setSession(sessionData);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('orgEmployeeSession');
        }
      } catch (error) {
        localStorage.removeItem('orgEmployeeSession');
      }
    }
    setIsInitializing(false);
  }, []);

  const login = (sessionData: any) => {
    const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
    const finalSession = { ...sessionData, expiresAt };
    localStorage.setItem('orgEmployeeSession', JSON.stringify(finalSession));
    setSession(finalSession);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('orgEmployeeSession');
    localStorage.removeItem('shopSession');
    setSession(null);
    setIsAuthenticated(false);
    router.push('/');
  };

  const value: AuthContextType = {
    session,
    isAuthenticated,
    isInitializing,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
