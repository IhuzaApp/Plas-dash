'use client';

import React from 'react';
import { useShopSession } from '@/hooks/useShopSession';
import { useAuth } from '@/components/layout/RootLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, Shield, AlertTriangle } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <Store className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle>Shop Authentication Required</CardTitle>
            <CardDescription>
              You need to be logged into a shop to access this POS feature.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>2FA authentication required for shop access</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>Session valid for 24 hours</span>
            </div>
            <Button onClick={() => router.push('/pos/company-dashboard')} className="w-full">
              Go to Company Dashboard
            </Button>
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
