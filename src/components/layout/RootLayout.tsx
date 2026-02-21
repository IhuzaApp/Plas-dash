import React, { createContext, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Head from 'next/head';
import { Toaster } from '@/components/ui/toaster';
import LoadingProvider from './LoadingProvider';
import LoginModal from '../modals/LoginModal';
import { UserPrivileges } from '@/types/privileges';
import { getRecommendedLandingPage, isPageAccessible } from '@/lib/privileges';
import { ShopSessionProvider } from '@/contexts/ShopSessionContext';

interface SessionData {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  shop_id: string | null;
  privileges: UserPrivileges;
  expiresAt?: number;
  /** True when the user is from ProjectUsers table (catalog view). False when from orgEmployees (shop/products view). */
  isProjectUser?: boolean;
  role: string;
}

interface AuthContextType {
  session: SessionData | null;
  isAuthenticated: boolean;
  login: (sessionData: SessionData) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };

interface RootLayoutProps {
  children: React.ReactNode;
}

const getPageTitle = (pathname: string | null) => {
  // Handle null pathname
  if (!pathname) return 'Plas Admin';

  // Remove leading slash and split into segments
  const segments = pathname.slice(1).split('/');

  // If we're at root, return Dashboard
  if (pathname === '/') return 'Dashboard | Plas Admin';

  // Convert path segments to title case and join
  const title = segments
    .map(segment => {
      // Handle special cases like 'pos'
      if (segment.toLowerCase() === 'pos') return 'POS';

      // Convert kebab-case to Title Case
      return segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    })
    .join(' › '); // Using a better separator for visual hierarchy

  return `${title} | Plas Admin`;
};

export default function RootLayout({ children }: RootLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = getPageTitle(pathname);
  const [session, setSession] = React.useState<SessionData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    // Check for session in localStorage and expiration (8 hours)
    const sessionStr = localStorage.getItem('orgEmployeeSession');
    console.log('orgEmployeeSession:', sessionStr);
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
          setSession(null);
          setIsAuthenticated(false);
        }
      } catch {
        localStorage.removeItem('orgEmployeeSession');
        setSession(null);
        setIsAuthenticated(false);
      }
    } else {
      setSession(null);
      setIsAuthenticated(false);
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated && session && pathname) {
      const currentPageAccessible = isPageAccessible(session.privileges, pathname, session.role);

      if (!currentPageAccessible) {
        const recommendedPage = getRecommendedLandingPage(session.privileges, session.role);

        if (recommendedPage && recommendedPage.path !== pathname) {
          router.push(recommendedPage.path);
        }
      }
    }
  }, [isAuthenticated, session, pathname, router]);

  const handleLoginSuccess = (sessionData: SessionData) => {
    // Set session expiration to 8 hours from now
    const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
    const sessionWithExpiry = { ...sessionData, expiresAt };
    localStorage.setItem('orgEmployeeSession', JSON.stringify(sessionWithExpiry));
    setSession(sessionWithExpiry);
    setIsAuthenticated(true);

    // Only auto-route if current page is not accessible
    if (pathname) {
      const currentPageAccessible = isPageAccessible(
        sessionData.privileges,
        pathname,
        sessionData.role
      );
      if (!currentPageAccessible) {
        const recommendedPage = getRecommendedLandingPage(sessionData.privileges, sessionData.role);
        if (recommendedPage && recommendedPage.path !== pathname) {
          router.push(recommendedPage.path);
        }
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('orgEmployeeSession');
    setSession(null);
    setIsAuthenticated(false);
  };

  const authValue: AuthContextType = {
    session,
    isAuthenticated,
    login: handleLoginSuccess,
    logout: handleLogout,
  };

  return (
    <AuthContext.Provider value={authValue}>
      <ShopSessionProvider>
        <Head>
          <title key="title">{pageTitle}</title>
          <meta key="viewport" name="viewport" content="width=device-width, initial-scale=1" />
          <meta key="description" name="description" content="Plas Admin Dashboard" />
          <link key="favicon" rel="icon" href="/favicon.ico" />
        </Head>
        <LoadingProvider>
          <div className="min-h-screen bg-background relative">
            {children}
            {!isAuthenticated && (
              <div className="fixed inset-0 z-40 bg-white/30 backdrop-blur-md pointer-events-none" />
            )}
            {!isAuthenticated && <LoginModal onLoginSuccess={handleLoginSuccess} />}
            <Toaster />
          </div>
        </LoadingProvider>
      </ShopSessionProvider>
    </AuthContext.Provider>
  );
}
