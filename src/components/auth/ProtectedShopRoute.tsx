'use client';

import React from 'react';
import ShopSelector from '@/components/layout/ShopSelector';
import { useShopSession } from '@/contexts/ShopSessionContext';
import { useAuth } from '@/components/layout/RootLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProtectedShopRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ProtectedShopRoute: React.FC<ProtectedShopRouteProps> = ({ children, fallback }) => {
  const { isAuthenticated } = useAuth();
  const { isLoggedIntoShop, shopSession } = useShopSession();
  const router = useRouter();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    router.push('/');
    return null;
  }

  // If not logged into a shop, show shop selection
  if (!isLoggedIntoShop) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Shop Authentication Required</CardTitle>
            <CardDescription>
              Select an assigned shop and authenticate with your 2FA code to proceed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ShopSelector isSidebarOpen={true} variant="inline" />

            <div className="mt-8 pt-6 border-t space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Secure 2FA authentication required</span>
              </div>
              <Button variant="outline" onClick={() => router.push('/')} className="w-full">
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show shop session info
  return (
    <div className="space-y-4">
      {/* Shop Session Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">{shopSession?.shopName}</p>
              <p className="text-xs text-muted-foreground">
                {shopSession?.employeeName} - {shopSession?.position}
              </p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">POS Session Active</div>
        </div>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
};

export default ProtectedShopRoute;
