'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  BarChart,
  Package,
  Users,
  ShoppingCart,
  Settings,
  Store,
  User,
  Wallet,
  MessageSquare,
  Clock,
  Percent,
  ShoppingBag,
  Receipt,
  CreditCard,
  Tag,
  Coins,
  LayoutDashboard,
  Bell,
  HelpCircle,
  LogOut,
  Loader2,
  Video,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { usePrivilege } from '@/hooks/usePrivilege';
import { useAuth } from '@/components/layout/RootLayout';
import { PrivilegeKey } from '@/types/privileges';
import { menuPrivileges } from '@/lib/privileges';
import { usePageAccess } from '@/hooks/usePageAccess';
import { useShopSession } from '@/contexts/ShopSessionContext';
import ShopSelector from './ShopSelector';
import { useQueryClient } from '@tanstack/react-query';

interface AdminSidebarProps {
  isSidebarOpen: boolean;
}

const AdminSidebar = ({ isSidebarOpen }: AdminSidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  const { hasModuleAccess, hasAnyPrivilege, isSuperUser } = usePrivilege();
  const { logout } = useAuth();
  const { navigateToPage } = usePageAccess();
  const { isLoggedIntoShop, shopSession } = useShopSession();
  const queryClient = useQueryClient();

  // Handle navigation state
  useEffect(() => {
    if (!isNavigating) return;

    const timeoutId = setTimeout(() => {
      setIsNavigating(false);
      setNavigatingTo(null);
    }, 1000); // Reset after 1 second if navigation hasn't completed

    return () => clearTimeout(timeoutId);
  }, [isNavigating]);

  // Reset navigation state when pathname changes
  useEffect(() => {
    setIsNavigating(false);
    setNavigatingTo(null);
  }, [pathname]);

  // Listen for shop session changes and refetch data
  useEffect(() => {
    const handleShopSessionChange = (event: CustomEvent) => {
      // Refetch relevant queries when shop session changes
      const queriesToRefetch = [
        'branchShops',
        'allStaff',
        'productsByShop',
        'shopTransactions',
        'shopOrders',
        'shopInventory',
        'shopDashboard',
        'shopFinancial',
        'shopDiscounts',
        'shopStaff',
      ];

      // Invalidate all queries that might be affected by shop session changes
      queriesToRefetch.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });

      // Also invalidate queries with shop-specific parameters
      if (shopSession?.shopId) {
        queryClient.invalidateQueries({
          queryKey: ['branchShops', shopSession.shopName],
        });
        queryClient.invalidateQueries({
          queryKey: ['allStaff', shopSession.shopName],
        });
      }

      // If logged out of shop, also clear any shop-specific data
      if (!isLoggedIntoShop) {
        // Clear any cached shop-specific data
        queryClient.removeQueries({ queryKey: ['branchShops'] });
        queryClient.removeQueries({ queryKey: ['allStaff'] });
        queryClient.removeQueries({ queryKey: ['productsByShop'] });
      }

      // Force re-render
      setForceUpdate(prev => prev + 1);
    };

    // Add event listener
    window.addEventListener('shopSessionChanged', handleShopSessionChange as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('shopSessionChanged', handleShopSessionChange as EventListener);
    };
  }, [queryClient]);

  const handleNavigation = (path: string) => {
    if (path === pathname) return;
    setIsNavigating(true);
    setNavigatingTo(path);
    navigateToPage(path);
  };

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  // Utility function to refetch shop-related data
  const refetchShopData = () => {
    const queriesToRefetch = [
      'branchShops',
      'allStaff',
      'productsByShop',
      'shopTransactions',
      'shopOrders',
      'shopInventory',
      'shopDashboard',
      'shopFinancial',
      'shopDiscounts',
      'shopStaff',
    ];

    queriesToRefetch.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    });

    // Also refetch shop-specific queries if we have a shop session
    if (shopSession?.shopName) {
      queryClient.invalidateQueries({
        queryKey: ['branchShops', shopSession.shopName],
      });
      queryClient.invalidateQueries({
        queryKey: ['allStaff', shopSession.shopName],
      });
    }
  };

  const menuItems = [
    {
      section: 'Overview',
      icon: LayoutDashboard,
      items: [{ title: 'Dashboard', icon: BarChart, path: '/', badge: 'New' }],
    },
    {
      section: 'Operations',
      icon: ShoppingCart,
      items: [
        { title: 'Orders', icon: Package, path: '/orders', badge: '5' },
        { title: 'Plasas', icon: User, path: '/shoppers' },
        { title: 'Customers', icon: Users, path: '/users' },
        { title: 'Project Users', icon: Users, path: '/project-users' },
        { title: 'Shops', icon: Store, path: '/shops' },
        { title: 'Restaurants', icon: Store, path: '/restaurants' },
        { title: 'Reels', icon: Video, path: '/reels' },
        { title: 'Products', icon: ShoppingCart, path: '/products' },
        { title: 'PlasMarket', icon: Store, path: '/plasmarket' },
      ],
    },
    {
      section: 'Point of Sale',
      icon: CreditCard,
      items: [
        { title: 'Company Dashboard', icon: LayoutDashboard, path: '/pos/company-dashboard' },
        ...(isLoggedIntoShop
          ? [
              // Shop-specific POS items when logged into a shop
              { title: 'Shop Dashboard', icon: Store, path: '/pos/shop-dashboard' },
              { title: 'Checkout', icon: CreditCard, path: '/pos/checkout' },
              { title: 'Inventory', icon: ShoppingBag, path: '/pos/inventory' },
              { title: 'Transactions', icon: Receipt, path: '/pos/transactions' },
              { title: 'Discounts', icon: Tag, path: '/pos/discounts' },
              { title: 'Financial Overview', icon: Coins, path: '/pos/financial' },
              { title: 'Staff Management', icon: Users, path: '/pos/staff' },
            ]
          : []),
      ],
    },
    {
      section: 'Finance',
      icon: Wallet,
      items: [
        { title: 'Wallet Operations', icon: Wallet, path: '/company-wallet' },
        { title: 'Wallets', icon: Wallet, path: '/shopper-wallets' },
        { title: 'Withdraw Requests', icon: Receipt, path: '/withdraw-requests' },
        { title: 'Refund Claims', icon: Wallet, path: '/refunds', badge: '3' },
      ],
    },

    {
      section: 'Support & Help',
      icon: MessageSquare,
      items: [
        { title: 'Tickets', icon: MessageSquare, path: '/tickets', badge: '2' },
        { title: 'Help Center', icon: HelpCircle, path: '/help' },
      ],
    },
    {
      section: 'Settings',
      icon: Settings,
      items: [
        { title: 'Delivery Settings', icon: Clock, path: '/delivery-settings' },
        { title: 'Promotions', icon: Percent, path: '/promotions' },
        { title: 'Referrals', icon: Users, path: '/referrals' },
        { title: 'System Settings', icon: Settings, path: '/settings' },
      ],
    },
  ];

  // Note: menuPrivileges is now imported from @/lib/privileges

  // Filter menu items by privileges using new system
  const filteredMenuItems = isSuperUser()
    ? menuItems
    : menuItems
        .map(section => ({
          ...section,
          items: section.items.filter(item => {
            const privilege = menuPrivileges[item.title];
            if (!privilege) return true; // If no privilege defined, allow access

            // Check if user has access to the module
            return hasModuleAccess(privilege.module);
          }),
        }))
        .filter(section => section.items.length > 0);

  // Check if user has access to any module (for sidebar visibility)
  const hasAnyModuleAccess =
    isSuperUser() ||
    hasModuleAccess('checkout') ||
    hasModuleAccess('orders') ||
    hasModuleAccess('products') ||
    hasModuleAccess('users') ||
    hasModuleAccess('project_users') ||
    hasModuleAccess('shops') ||
    hasModuleAccess('restaurants') ||
    hasModuleAccess('shoppers') ||
    hasModuleAccess('company_dashboard') ||
    hasModuleAccess('shop_dashboard') ||
    hasModuleAccess('inventory') ||
    hasModuleAccess('transactions') ||
    hasModuleAccess('discounts') ||
    hasModuleAccess('financial_overview') ||
    hasModuleAccess('pos_terminal') ||
    hasModuleAccess('staff_management') ||
    hasModuleAccess('wallet') ||
    hasModuleAccess('refunds') ||
    hasModuleAccess('withdraw_requests') ||
    hasModuleAccess('tickets') ||
    hasModuleAccess('help') ||
    hasModuleAccess('settings') ||
    hasModuleAccess('promotions') ||
    hasModuleAccess('delivery_settings') ||
    hasModuleAccess('plasmarket');

  // If no module access, return empty sidebar
  if (!hasAnyModuleAccess) {
    return (
      <Sidebar
        className={cn(
          'fixed left-0 top-0 bottom-0 z-40 transition-all duration-300',
          isSidebarOpen ? 'w-64' : 'w-20',
          'border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
        )}
      >
        <SidebarHeader className="h-14 flex items-center px-4 border-b">
          <div className="flex items-center justify-center w-full">
            <div className="w-8 h-8 rounded-md bg-transparent flex items-center justify-center overflow-hidden">
              <img
                src="/Assets/logo/Plas Icon.png"
                alt="Plas Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2">
          <div className="p-4 text-center text-sm text-muted-foreground">
            No access to any modules
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  const renderMenuItem = (item: any) => {
    const isActive = pathname === item.path;
    const isLoading = isNavigating && navigatingTo === item.path;

    return (
      <TooltipProvider key={item.title} delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    'flex items-center w-full',
                    isSidebarOpen ? 'px-3' : 'justify-center',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-primary/5 text-muted-foreground hover:text-primary',
                    'rounded-md py-2 transition-all duration-200 group'
                  )}
                >
                  {isLoading ? (
                    <Loader2 className={cn('h-5 w-5 animate-spin', isSidebarOpen ? 'mr-2' : '')} />
                  ) : (
                    <item.icon
                      className={cn(
                        'h-5 w-5',
                        isSidebarOpen ? 'mr-2' : '',
                        isActive ? 'text-primary' : 'group-hover:text-primary'
                      )}
                    />
                  )}
                  {isSidebarOpen && (
                    <div className="flex items-center justify-between w-full">
                      <span>{item.title}</span>
                      {item.badge && !isLoading && (
                        <Badge
                          variant={item.badge === 'New' ? 'default' : 'secondary'}
                          className="ml-2 px-2 py-0.5 text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  )}
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className={cn('bg-primary text-primary-foreground', isSidebarOpen ? 'hidden' : 'block')}
          >
            <div className="flex items-center">
              <span>{item.title}</span>
              {item.badge && !isLoading && (
                <Badge
                  variant={item.badge === 'New' ? 'default' : 'secondary'}
                  className="ml-2 px-2 py-0.5 text-xs"
                >
                  {item.badge}
                </Badge>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Sidebar
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40 transition-all duration-300',
        isSidebarOpen ? 'w-64' : 'w-20',
        'border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
      )}
    >
      <SidebarHeader className="h-14 flex items-center px-4 border-b">
        <div
          className={cn(
            'flex items-center w-full',
            isSidebarOpen ? 'justify-start' : 'justify-center'
          )}
        >
          {isSidebarOpen ? (
            <div className="flex items-center">
              <img
                src="/Assets/logo/PlasLogoPNG.png"
                alt="Plas Dashboard"
                className="h-8 object-contain"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-md bg-transparent flex items-center justify-center overflow-hidden">
              <img
                src="/Assets/logo/Plas Icon.png"
                alt="Plas Logo"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Shop Selector for POS users */}
        {hasModuleAccess('pos_terminal') && (
          <SidebarGroup>
            <ShopSelector isSidebarOpen={isSidebarOpen} />
          </SidebarGroup>
        )}

        {filteredMenuItems.map(section => (
          <SidebarGroup key={section.section}>
            {isSidebarOpen && (
              <SidebarGroupLabel className="flex items-center text-xs font-medium text-muted-foreground/70">
                <section.icon className="h-4 w-4 mr-2" />
                {section.section}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>{section.items.map(renderMenuItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        {isSidebarOpen ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                <p className="font-medium">Plas Dashboard</p>
                <p className="text-xs">v1.2.0</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-destructive/10 hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
              <Bell className="h-4 w-4" />
              <span>3 new notifications</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
