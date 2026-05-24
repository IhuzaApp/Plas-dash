'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Store,
  Utensils,
  Clock,
  Shield,
  LogOut,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useCurrentOrgEmployee } from '@/hooks/useCurrentOrgEmployee';
import { useShopSession } from '@/contexts/ShopSessionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import ShopAuthModal from '@/components/modals/ShopAuthModal';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ShopSelectorProps {
  isSidebarOpen: boolean;
  variant?: 'sidebar' | 'inline' | 'header';
}

const ShopSelector: React.FC<ShopSelectorProps> = ({ isSidebarOpen, variant = 'sidebar' }) => {
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
    isRestaurant?: boolean;
    employeeImage?: string;
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
      isRestaurant: shop.isRestaurant || false,
      employeeImage: shop.employeeImage || '',
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

  const activeBusinessObj = orgEmployee?.Shops || orgEmployee?.Restaurants;
  const isRestaurant = !!orgEmployee?.Restaurants;
  const BusinessIcon = isRestaurant ? Utensils : Store;

  if (!orgEmployee || !activeBusinessObj) {
    // Fallback: use session data if available
    if (session && (session.shop_id || session.restaurant_id)) {
      const fallbackShopData = {
        shop: {
          id: session.shop_id || session.restaurant_id,
          name: session.shop_name || session.restaurant_name || 'Current Business',
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
          <div
            className={cn(
              variant === 'sidebar'
                ? 'flex items-center gap-2'
                : 'flex flex-col items-center gap-2 mb-4'
            )}
          >
            <BusinessIcon
              className={cn(variant === 'sidebar' ? 'h-4 w-4' : 'h-8 w-8 text-primary')}
            />
            <h3
              className={cn(
                'font-medium',
                isSidebarOpen || variant === 'inline' ? 'text-sm' : 'sr-only'
              )}
            >
              {variant === 'sidebar'
                ? `Select ${session.restaurant_id ? 'Restaurant' : 'Shop'} for POS`
                : `Available ${session.restaurant_id ? 'Restaurants' : 'Shops'}`}
            </h3>
          </div>

          <div className="space-y-2">
            <Card
              key={fallbackShopData.shop.id}
              className="cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={() => {
                handleShopSelect({ ...fallbackShopData, isRestaurant: !!session?.restaurant_id });
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
          <p>No business assigned</p>
        </div>
      </div>
    );
  }

  if (isLoggedIntoShop && shopSession) {
    return (
      <div className={cn('p-4 space-y-3', !isSidebarOpen && 'p-2')}>
        {isSidebarOpen ? (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Active {isRestaurant ? 'Restaurant' : 'Shop'}</h3>
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
                  <BusinessIcon className="h-4 w-4 text-primary" />
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
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-full h-12 rounded-xl bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                  onClick={handleLogout}
                >
                  <BusinessIcon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="text-xs">
                  <p className="font-bold">{shopSession.shopName}</p>
                  <p className="opacity-70">Click to logout</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-2 h-8 mr-2 border-primary/20 hover:bg-primary/10 transition-colors"
          onClick={() => {
            const shopData = {
              shop: activeBusinessObj,
              position: orgEmployee.Position,
              roleType: orgEmployee.roleType,
              multAuthEnabled: orgEmployee.multAuthEnabled,
              employeeId: orgEmployee.employeeID,
              employeeName: orgEmployee.fullnames,
              userId: orgEmployee.id,
              isRestaurant: isRestaurant,
              employeeImage: orgEmployee.profile_image || orgEmployee.display_image || orgEmployee.image || '',
            };
            handleShopSelect(shopData);
          }}
        >
          <BusinessIcon className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold">{activeBusinessObj.name}</span>
        </Button>
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
            isRestaurant={selectedShop.isRestaurant}
            employeeImage={selectedShop.employeeImage}
          />
        )}
      </>
    );
  }

  return (
    <div
      className={cn(
        variant === 'sidebar' ? (isSidebarOpen ? 'p-4 space-y-3' : 'p-2 space-y-2') : 'space-y-4'
      )}
    >
      {isSidebarOpen ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BusinessIcon
              className={cn(variant === 'sidebar' ? 'h-4 w-4' : 'h-6 w-6 text-primary')}
            />
            <h3 className="font-medium text-sm">
              {variant === 'sidebar'
                ? `Select ${isRestaurant ? 'Restaurant' : 'Shop'}`
                : `Choose a ${isRestaurant ? 'restaurant' : 'shop'} to associate with your session`}
            </h3>
          </div>
          <Button variant="ghost" size="sm" onClick={handleManualRefresh} className="h-6 w-6 p-0">
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      ) : null}

      <div className="space-y-2">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card
                key={activeBusinessObj.id}
                className={cn(
                  'cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors',
                  !isSidebarOpen &&
                    'p-0 flex items-center justify-center h-12 rounded-xl border-dashed'
                )}
                onClick={() => {
                  const shopData = {
                    shop: activeBusinessObj,
                    position: orgEmployee.Position,
                    roleType: orgEmployee.roleType,
                    multAuthEnabled: orgEmployee.multAuthEnabled,
                    employeeId: orgEmployee.employeeID,
                    employeeName: orgEmployee.fullnames,
                    userId: orgEmployee.id,
                    isRestaurant: isRestaurant,
                    employeeImage: orgEmployee.profile_image || orgEmployee.display_image || orgEmployee.image || '',
                  };
                  handleShopSelect(shopData);
                }}
              >
                <CardContent
                  className={cn('p-3', !isSidebarOpen && 'p-0 flex items-center justify-center')}
                >
                  {isSidebarOpen ? (
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">{activeBusinessObj.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {orgEmployee.Position}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {orgEmployee.multAuthEnabled ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </div>
                  ) : (
                    <BusinessIcon className="h-5 w-5 text-sidebar-foreground/40" />
                  )}
                </CardContent>
              </Card>
            </TooltipTrigger>
            {!isSidebarOpen && (
              <TooltipContent side="right">
                <p className="text-xs font-medium">{activeBusinessObj.name}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
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
          isRestaurant={selectedShop.isRestaurant}
          employeeImage={selectedShop.employeeImage}
        />
      )}
    </div>
  );
};

export default ShopSelector;
