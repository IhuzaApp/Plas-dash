'use client';

import React from 'react';
import ShopSelector from '@/components/layout/ShopSelector';
import { useShopSession } from '@/contexts/ShopSessionContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProtectedShopRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ProtectedShopRoute: React.FC<ProtectedShopRouteProps> = ({ children, fallback }) => {
  const { isAuthenticated, session } = useAuth();
  const { isLoggedIntoShop, shopSession } = useShopSession();
  const router = useRouter();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    router.push('/');
    return null;
  }

  // If user is a ProjectUser, they don't need shop authentication
  if (session?.isProjectUser) {
    return <>{children}</>;
  }

  // Determine if user has a shop or restaurant assigned at all
  const hasAssignedBusiness = !!session?.shop_id || !!session?.restaurant_id;

  // If not logged into a shop/restaurant, show selection ONLY IF they have an assigned business.
  // Unassigned users (like global admins) bypass this check.
  if (!isLoggedIntoShop && hasAssignedBusiness) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-hidden">
        {/* Hero background */}
        <img
          src="/Assets/plas-agents-hero.png"
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/60 to-black/40 backdrop-blur-[2px]" />

        {/* Glassmorphic card */}
        <div className="relative z-10 w-full max-w-lg bg-background/70 border border-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden">
          {/* Inner glow blobs */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
            <div className="absolute top-[-20%] right-[-10%] w-56 h-56 bg-primary/20 rounded-full blur-[70px] animate-pulse" />
            <div className="absolute bottom-[-20%] left-[-10%] w-56 h-56 bg-primary/10 rounded-full blur-[70px] animate-pulse delay-700" />
          </div>

          {/* Header */}
          <div className="flex flex-col items-center gap-4 px-8 pt-8 pb-6 text-center">
            <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-primary/15 border border-primary/20 shadow-lg">
              <img
                src="/Assets/logo/Plas Icon.png"
                alt="Plas"
                className="w-10 h-10 object-contain"
              />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">
                {session?.restaurant_id ? 'Restaurant' : 'Shop'} Authentication Required
              </h2>
              <p className="text-sm text-muted-foreground">
                Select an assigned {session?.restaurant_id ? 'restaurant' : 'shop'} and authenticate
                with your 2FA code to proceed.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border/40 mx-8" />

          {/* Body */}
          <div className="px-8 py-6 space-y-6">
            <ShopSelector isSidebarOpen={true} variant="inline" />

            <div className="pt-4 border-t border-border/40 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Secure 2FA authentication required</span>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="w-full border-border/50 bg-muted/20 hover:bg-muted/40"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show shop session info if they have one (unassigned users won't see this banner)
  return <>{children}</>;
};

export default ProtectedShopRoute;
