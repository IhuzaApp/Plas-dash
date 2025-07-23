import React from 'react';
import { usePathname } from 'next/navigation';
import Head from 'next/head';
import { Toaster } from '@/components/ui/toaster';
import LoadingProvider from './LoadingProvider';
import LoginModal from '../modals/LoginModal';

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
  const pageTitle = getPageTitle(pathname);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    // Check for session in localStorage and expiration (8 hours)
    const sessionStr = localStorage.getItem('orgEmployeeSession');
    console.log('orgEmployeeSession:', sessionStr);
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        const now = Date.now();
        const expiresAt = session.expiresAt || 0;
        if (expiresAt && now < expiresAt) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('orgEmployeeSession');
          setIsAuthenticated(false);
        }
      } catch {
        localStorage.removeItem('orgEmployeeSession');
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLoginSuccess = (sessionData: any) => {
    // Set session expiration to 8 hours from now
    const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
    localStorage.setItem('orgEmployeeSession', JSON.stringify({ ...sessionData, expiresAt }));
    setIsAuthenticated(true);
  };

  return (
    <>
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
          {!isAuthenticated && (
            <LoginModal onLoginSuccess={handleLoginSuccess} />
          )}
          <Toaster />
        </div>
      </LoadingProvider>
    </>
  );
}
