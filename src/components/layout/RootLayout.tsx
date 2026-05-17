import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Head from 'next/head';
import { Toaster } from '@/components/ui/toaster';
import LoadingProvider from './LoadingProvider';
import LoginModal from '../modals/LoginModal';
import { hasPrivilege } from '@/types/privileges';
import { getRecommendedLandingPage, isPageAccessible } from '@/lib/privileges';
import { FloatingChatButton } from '@/components/chat/FloatingChatButton';
import { ThemeColorProvider } from '@/components/providers/ThemeColorProvider';
import { useShopSession } from '@/contexts/ShopSessionContext';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeSubdomain } from '@/lib/utils';

interface RootLayoutProps {
  children: React.ReactNode;
}

const getPageTitle = (pathname: string | null) => {
  if (!pathname) return 'Plas Admin';
  const segments = pathname.slice(1).split('/');
  if (pathname === '/') return 'Dashboard | Plas Admin';
  const title = segments
    .map(segment => {
      if (segment.toLowerCase() === 'pos') return 'POS';
      return segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    })
    .join(' › ');
  return `${title} | Plas Admin`;
};

export default function RootLayout({ children }: RootLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeBusiness } = useShopSession();
  const { session, isAuthenticated, isInitializing, login } = useAuth();

  const pageTitle = activeBusiness
    ? `${getPageTitle(pathname).split(' | ')[0]} | ${activeBusiness.name}`
    : getPageTitle(pathname);

  React.useEffect(() => {
    if (isAuthenticated && session && pathname) {
      let currentPageAccessible = isPageAccessible(session.privileges, pathname, session.role);
      if (!session.isProjectUser && (pathname === '/' || pathname === '/dashboard')) {
        currentPageAccessible = false;
      }

      if (!currentPageAccessible) {
        let redirectPath = '/';
        if (!session.isProjectUser) {
          if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            const mainDomains = ['localhost', 'dash.plas.rw'];
            if (mainDomains.includes(hostname)) {
              const businessName = (session as any).shop_name || (session as any).restaurant_name;
              if (businessName) {
                const subdomain = normalizeSubdomain(businessName);
                const domain = hostname === 'localhost' ? 'lvh.me:3000' : 'plas.rw';
                window.location.href = `${window.location.protocol}//${subdomain}.${domain}${pathname}`;
                return;
              }
            }
          }
          const isAdmin = session.role === 'globalAdmin' || session.role === 'storeAdministrator';

          if (isAdmin) {
            redirectPath = '/pos/company-dashboard';
          } else if (
            hasPrivilege(session.privileges, 'company_dashboard', 'access', session.role)
          ) {
            redirectPath = '/pos/company-dashboard';
          } else {
            redirectPath = '/pos/checkout';
          }
        } else {
          const recommendedPage = getRecommendedLandingPage(session.privileges, session.role);
          redirectPath = recommendedPage?.path || '/';
        }
        if (redirectPath !== pathname) {
          router.push(redirectPath);
        }
      }
    }
  }, [isAuthenticated, session, pathname, router]);

  return (
    <ThemeColorProvider>
      <Head>
        <title key="title">{pageTitle}</title>
        <meta key="viewport" name="viewport" content="width=device-width, initial-scale=1" />
        <meta key="description" name="description" content="Plas Admin Dashboard" />
        <link key="favicon" rel="icon" href="/favicon.png" />
      </Head>
      <LoadingProvider>
        <div className="min-h-screen bg-background relative selection:bg-primary/20 selection:text-primary">
          <React.Suspense fallback={null}>{children}</React.Suspense>
          {!isAuthenticated && !pathname?.startsWith('/tax') && !isInitializing && (
            <div className="fixed inset-0 z-40 bg-white/30 dark:bg-black/30 backdrop-blur-md pointer-events-none" />
          )}
          {!isAuthenticated && !pathname?.startsWith('/tax') && !isInitializing && (
            <LoginModal onLoginSuccess={login} />
          )}
          {isAuthenticated &&
            pathname !== '/pos/ai-chat' &&
            session?.privileges?.ai_chat?.access && <FloatingChatButton />}
          <Toaster />
        </div>
      </LoadingProvider>
    </ThemeColorProvider>
  );
}
