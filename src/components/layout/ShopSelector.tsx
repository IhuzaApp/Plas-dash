'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, Clock, Shield, LogOut, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useCurrentOrgEmployee } from '@/hooks/useCurrentOrgEmployee';
import { useShopSession } from '@/contexts/ShopSessionContext';
import { useAuth } from '@/components/layout/RootLayout';
import { useQueryClient } from '@tanstack/react-query';
import ShopAuthModal from '@/components/modals/ShopAuthModal';
import { cn } from '@/lib/utils';

interface ShopSelectorProps {
  isSidebarOpen: boolean;
}

const ShopSelector: React.FC<ShopSelectorProps> = ({ isSidebarOpen }) => {
  const { session } = useAuth();
  const { orgEmployee, isLoading } = useCurrentOrgEmployee();
  const { shopSession, isLoggedIntoShop, logoutFromShop } = useShopSession();
  const queryClient = useQueryClient();



  // Listen for shop session changes
  useEffect(() => {
    const handleShopSessionChange = (event: CustomEvent) => {
      console.log('=== SHOP SELECTOR: SHOP SESSION EVENT RECEIVED ===');
      console.log('Event type:', event.detail.type);
      
      // Trigger real-time updates when shop session changes
      setTimeout(() => {
        console.log('=== TRIGGERING REAL-TIME UPDATES AFTER SHOP SESSION CHANGE ===');
        queryClient.invalidateQueries({ queryKey: ['currentOrgEmployee'] });
        queryClient.invalidateQueries({ queryKey: ['userShops'] });
        queryClient.invalidateQueries({ queryKey: ['orgEmployees'] });
        
        // Force refetch
        queryClient.refetchQueries({ queryKey: ['currentOrgEmployee'] });
        queryClient.refetchQueries({ queryKey: ['userShops'] });
        
        // Force re-render
        setForceUpdate(prev => prev + 1);
      }, 100);
    };

    // Listen for orgEmployee data updates
    const handleOrgEmployeeUpdate = () => {
      console.log('=== SHOP SELECTOR: ORG EMPLOYEE DATA UPDATE EVENT ===');
      setForceUpdate(prev => prev + 1);
    };

    // Add event listeners
    window.addEventListener('shopSessionChanged', handleShopSessionChange as EventListener);
    window.addEventListener('orgEmployeeDataUpdated', handleOrgEmployeeUpdate);

    // Cleanup
    return () => {
      window.removeEventListener('shopSessionChanged', handleShopSessionChange as EventListener);
      window.removeEventListener('orgEmployeeDataUpdated', handleOrgEmployeeUpdate);
    };
  }, [queryClient]);
  const [selectedShop, setSelectedShop] = useState<{
    shopId: string;
    shopName: string;
    employeeId: string;
    employeeName: string;
    position: string;
    multAuthEnabled: boolean;
    userId: string;
  } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  const handleShopSelect = (shop: any) => {
    const selectedShopData = {
      shopId: shop.shop.id,
      shopName: shop.shop.name,
      employeeId: shop.employeeId || '',
      employeeName: shop.employeeName || '',
      position: shop.position,
      multAuthEnabled: shop.multAuthEnabled || false,
      userId: shop.userId || '',
    };
    setSelectedShop(selectedShopData);
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setSelectedShop(null);
    
    // Trigger real-time updates after successful authentication
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['currentOrgEmployee'] });
      queryClient.invalidateQueries({ queryKey: ['userShops'] });
      queryClient.invalidateQueries({ queryKey: ['orgEmployees'] });
      
      // Force refetch
      queryClient.refetchQueries({ queryKey: ['currentOrgEmployee'] });
      queryClient.refetchQueries({ queryKey: ['userShops'] });
    }, 100);
  };

  const handleLogout = () => {
    logoutFromShop();
    
    // Trigger real-time updates after logout
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['currentOrgEmployee'] });
      queryClient.invalidateQueries({ queryKey: ['userShops'] });
      queryClient.invalidateQueries({ queryKey: ['orgEmployees'] });
      
      // Force refetch
      queryClient.refetchQueries({ queryKey: ['currentOrgEmployee'] });
      queryClient.refetchQueries({ queryKey: ['userShops'] });
    }, 100);
  };

  const handleManualRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['currentOrgEmployee'] });
    queryClient.refetchQueries({ queryKey: ['currentOrgEmployee'] });
    setForceUpdate(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!orgEmployee || !orgEmployee.Shops) {
    // Fallback: use session data if available
    if (session && session.shop_id) {
      const fallbackShopData = {
        shop: {
          id: session.shop_id,
          name: 'Current Shop',
          address: '',
          phone: '',
          is_active: true,
        },
        position: 'Employee',
        roleType: 'employee',
        multAuthEnabled: false,
        employeeId: session.id,
        employeeName: session.fullName,
        userId: session.id,
      };

      return (
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <h3 className={cn('font-medium', isSidebarOpen ? 'text-sm' : 'sr-only')}>
              Select Shop for POS
            </h3>
          </div>

          <div className="space-y-2">
            <Card
              key={fallbackShopData.shop.id}
              className="cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={() => {
                handleShopSelect(fallbackShopData);
              }}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{fallbackShopData.shop.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {fallbackShopData.position}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4">
        <div className="text-center text-sm text-muted-foreground">
          <Store className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No shop assigned</p>
        </div>
      </div>
    );
  }

  if (isLoggedIntoShop && shopSession) {
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Active Shop</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-3 w-3" />
          </Button>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">{shopSession.shopName}</CardTitle>
            </div>
            <CardDescription className="text-xs">
              {shopSession.employeeName} - {shopSession.position}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Session active</span>
              <Badge variant="secondary" className="text-xs">
                POS Ready
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4" />
          <h3 className={cn('font-medium', isSidebarOpen ? 'text-sm' : 'sr-only')}>
            Select Shop for POS
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualRefresh}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>

      <div className="space-y-2">
        <Card
          key={orgEmployee.Shops.id}
          className="cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                      onClick={() => {
              const shopData = {
                shop: orgEmployee.Shops,
                position: orgEmployee.Position,
                roleType: orgEmployee.roleType,
                multAuthEnabled: orgEmployee.multAuthEnabled,
                employeeId: orgEmployee.employeeID,
                employeeName: orgEmployee.fullnames,
                userId: orgEmployee.id,
              };
              handleShopSelect(shopData);
            }}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium truncate">{orgEmployee.Shops.name}</h4>
                <p className="text-xs text-muted-foreground truncate">{orgEmployee.Position}</p>
              </div>
              <div className="flex items-center gap-1">
                {orgEmployee.multAuthEnabled ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedShop && (
        <ShopAuthModal
          open={showAuthModal}
          onOpenChange={setShowAuthModal}
          shopId={selectedShop.shopId}
          shopName={selectedShop.shopName}
          employeeId={selectedShop.employeeId}
          employeeName={selectedShop.employeeName}
          position={selectedShop.position}
          multAuthEnabled={selectedShop.multAuthEnabled}
          userId={selectedShop.userId}
          storedTwoFactorSecrets={orgEmployee?.twoFactorSecrets || null}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
};

export default ShopSelector;
