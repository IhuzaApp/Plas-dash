'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  FileText,
  Truck,
  ClipboardList,
  Building2,
  TrendingUp,
  Upload,
  ChefHat,
  FlaskConical,
  Activity,
  DollarSign,
  ChevronLeft,
  ShieldCheck,
  Dog,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback } from 'react';
import { usePrivilege } from '@/hooks/usePrivilege';
import { useAuth } from '@/components/layout/RootLayout';
import { menuPrivileges } from '@/lib/privileges';
import { usePageAccess } from '@/hooks/usePageAccess';
import { useShopSession } from '@/contexts/ShopSessionContext';
import ShopSelector from './ShopSelector';
import { usePageLoading } from '@/hooks/usePageLoading';
import { useQueryClient } from '@tanstack/react-query';

interface AdminSidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar?: () => void;
}

const AdminSidebar = ({ isSidebarOpen, toggleSidebar }: AdminSidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  const { hasModuleAccess, hasAnyPrivilege, isSuperUser, session } = usePrivilege();
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

  // Utility function to refetch shop-related data
  const refetchShopData = useCallback(() => {
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
    if (shopSession?.shopId && shopSession.shopName) {
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
  }, [queryClient, shopSession?.shopId, shopSession?.shopName, isLoggedIntoShop]);

  useEffect(() => {
    const handleShopSessionChange = (event: CustomEvent) => {
      refetchShopData();

      // Force re-render
      setForceUpdate(prev => prev + 1);
    };

    // Add event listener
    window.addEventListener('shopSessionChanged', handleShopSessionChange as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('shopSessionChanged', handleShopSessionChange as EventListener);
    };
  }, [refetchShopData]);

  const handleNavigation = (path: string) => {
    if (path === pathname) return;
    setIsNavigating(true);
    setNavigatingTo(path);
    navigateToPage(path);
  };

  const { startLoading } = usePageLoading();
  const handleLogout = () => {
    startLoading();
    logout();
    window.location.reload();
  };

  const showShopGuardedItems = isLoggedIntoShop || !session?.shop_id;

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
        { title: 'Logistics', icon: Truck, path: '/logistics' },
        { title: 'Pet Vendors', icon: Dog, path: '/pets' },
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
        ...(showShopGuardedItems
          ? [
              { title: 'Company Dashboard', icon: LayoutDashboard, path: '/pos/company-dashboard' },
              { title: 'Recipes', icon: ChefHat, path: '/pos/inventory/production/recipes' },
              {
                title: 'Production Orders',
                icon: ClipboardList,
                path: '/pos/inventory/production/orders',
              },
              { title: 'Production Dashboard', icon: Activity, path: '/pos/inventory/production' },
              {
                title: 'Cost & Profit',
                icon: DollarSign,
                path: '/pos/inventory/production/cost-profit',
              },
              {
                title: 'Simulate Stock',
                icon: FlaskConical,
                path: '/pos/inventory/production/simulate',
              },
            ]
          : []),
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
      section: 'Procurement',
      icon: Truck,
      items: [
        ...(showShopGuardedItems
          ? [
              { title: 'Procurement Dashboard', icon: LayoutDashboard, path: '/pos/procurement' },
              { title: 'Suppliers', icon: Building2, path: '/pos/procurement/suppliers' },
              { title: 'Quotations', icon: FileText, path: '/pos/procurement/quotations' },
              {
                title: 'Purchase Orders',
                icon: ClipboardList,
                path: '/pos/procurement/purchase-orders',
              },
              { title: 'Goods Received', icon: Truck, path: '/pos/procurement/goods-received' },
              { title: 'Procurement Reports', icon: BarChart, path: '/pos/procurement/reports' },
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
      section: 'Tax & Compliance',
      icon: FileText,
      items: [
        ...(showShopGuardedItems
          ? [
              { title: 'Tax Dashboard', icon: LayoutDashboard, path: '/tax' },
              { title: 'Tax Declaration', icon: FileText, path: '/tax/declaration' },
              { title: 'Forecasting', icon: TrendingUp, path: '/tax/forecasting' },
              { title: 'Smart Import', icon: Upload, path: '/tax/import' },
              { title: 'Tax Summary', icon: LayoutDashboard, path: '/tax/summary' },
              { title: 'Optimization', icon: Tag, path: '/tax/optimization' },
              { title: 'Reports', icon: BarChart, path: '/tax/reports' },
              { title: 'Settings', icon: Settings, path: '/tax/settings' },
            ]
          : []),
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
      section: 'Marketing',
      icon: TrendingUp,
      items: [
        { title: 'Referrals', icon: Users, path: '/referrals' },
        { title: 'Influencers', icon: Users, path: '/influencers' },
      ],
    },
    {
      section: 'Subscriptions',
      icon: Store,
      items: [
        { title: 'Manage Plans', icon: FileText, path: '/admin/subscriptions/plans' },
        { title: 'Modules', icon: Package, path: '/admin/subscriptions/modules' },
        { title: 'Plan Assignments', icon: Settings, path: '/admin/subscriptions/plan-modules' },
        { title: 'Subscriptions & Billing', icon: Store, path: '/admin/subscriptions/shops' },
      ],
    },
    {
      section: 'Settings',
      icon: Settings,
      items: [
        { title: 'Delivery Settings', icon: Clock, path: '/delivery-settings' },
        { title: 'Promotions', icon: Percent, path: '/promotions' },
        { title: 'System Settings', icon: Settings, path: '/settings' },
      ],
    },
  ];

  const filteredMenuItems = menuItems
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        const privilege = menuPrivileges[item.title];
        if (!privilege) return true; // If no privilege defined, allow access

        const pages = session?.privileges?.pages as any;
        const pageAllowed = pages ? pages[`access_${privilege.module}`] === true : false;
        const moduleAllowed = hasModuleAccess(privilege.module);

        // Resilient Logic: Allow if either page access OR module access is granted
        // This handles cases where 'pages' exists but is out of sync/uninitialized
        if (!pageAllowed && !moduleAllowed) {
          return false;
        }

        // Check if project user requirement is met
        if (privilege.isProjectUser && !session?.isProjectUser) {
          return false;
        }

        // Check if org employee requirement is met
        if (privilege.isOrgEmployeeOnly && session?.isProjectUser) {
          return false;
        }

        return true;
      }),
    }))
    .filter(section => section.items.length > 0);

  const hasAnyModuleAccess = (() => {
    const pages = session?.privileges?.pages as any;
    const pagesHasAccess = pages?.access === true;

    const moduleHasAccess =
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
      hasModuleAccess('plasmarket') ||
      hasModuleAccess('procurement') ||
      hasModuleAccess('subscriptions') ||
      hasModuleAccess('influencers');

    return pagesHasAccess || moduleHasAccess || pathname?.startsWith('/tax');
  })();

  if (!hasAnyModuleAccess) {
    return (
      <aside
        className={cn(
          'sticky top-0 h-screen z-40 transition-all duration-500 ease-in-out flex flex-col',
          isSidebarOpen ? 'w-64' : 'w-20',
          'border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-2xl shadow-black/50'
        )}
      >
        <div className="h-20 flex items-center px-6 border-b border-sidebar-border/50 bg-black/10 backdrop-blur-md">
          <div className="flex items-center justify-center w-full">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center overflow-hidden">
              <img
                src="/Assets/logo/Plas Icon.png"
                alt="Plas Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
          </div>
        </div>
        <div className="flex-1 p-8 text-center flex flex-col items-center justify-center space-y-4">
          <div className="p-4 rounded-full bg-destructive/10 text-destructive">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">Access Denied</p>
            <p className="text-xs text-sidebar-foreground/50">
              No modules assigned to your account.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const renderMenuItem = (item: any) => {
    const isActive = pathname === item.path;
    const isLoading = isNavigating && navigatingTo === item.path;

    return (
      <TooltipProvider key={item.path} delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="px-1">
              <button
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  'flex items-center w-full relative group transition-all duration-300 ease-out',
                  isSidebarOpen ? 'px-4 py-2.5' : 'justify-center py-3',
                  isActive
                    ? 'bg-primary text-white font-semibold shadow-lg shadow-primary/20'
                    : 'text-white/60 hover:text-white hover:bg-white/10',
                  'rounded-xl'
                )}
              >
                {/* Active Indicator Dot */}
                {isActive && isSidebarOpen && (
                  <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                )}

                {isLoading ? (
                  <Loader2 className={cn('h-5 w-5 animate-spin text-primary', isSidebarOpen ? 'mr-3' : '')} />
                ) : (
                  <item.icon
                    className={cn(
                      'h-5 w-5 transition-transform duration-300 group-hover:scale-110',
                      isSidebarOpen ? 'mr-3' : '',
                      isActive ? 'text-white' : 'group-hover:text-primary'
                    )}
                  />
                )}
                {isSidebarOpen && (
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate">{item.title}</span>
                    {item.badge && !isLoading && (
                      <span className={cn(
                        "ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full",
                        item.badge === 'New' 
                          ? "bg-primary text-white shadow-[0_0_8px_rgba(34,197,94,0.3)]" 
                          : "bg-white/10 text-white/70"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Subtle hover effect for collapsed mode */}
                {!isSidebarOpen && isActive && (
                  <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />
                )}
              </button>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className={cn('bg-sidebar-accent text-white border-sidebar-border shadow-xl backdrop-blur-md', isSidebarOpen ? 'hidden' : 'block')}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.title}</span>
              {item.badge && !isLoading && (
                <Badge
                  variant={item.badge === 'New' ? 'default' : 'secondary'}
                  className="px-1.5 py-0 text-[9px] h-4"
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
    <aside
      className={cn(
        'sticky top-0 h-screen z-40 transition-all duration-500 ease-in-out flex flex-col',
        isSidebarOpen ? 'w-64' : 'w-20',
        'border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-2xl shadow-black/50'
      )}
    >
      {/* Header */}
      <div className="h-20 flex items-center px-6 border-b border-sidebar-border/50 bg-black/10 backdrop-blur-md relative group/header">
        <div
          className={cn(
            'flex items-center w-full transition-all duration-300',
            isSidebarOpen ? 'justify-between' : 'justify-center'
          )}
        >
          {isSidebarOpen ? (
            <>
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="p-2 rounded-xl bg-primary/20 backdrop-blur-sm group-hover:bg-primary/30 transition-all duration-300">
                  <img
                    src="/Assets/logo/Plas Icon.png"
                    alt="Plas Icon"
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-lg font-bold tracking-tight text-white leading-none">PLAS</span>
                  <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Dashboard</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8 rounded-lg hover:bg-white/10 text-white opacity-0 group-hover/header:opacity-100 transition-opacity duration-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div 
              onClick={toggleSidebar}
              className="w-12 h-12 rounded-xl bg-primary/20 backdrop-blur-sm flex items-center justify-center overflow-hidden hover:bg-primary/30 transition-all duration-300 cursor-pointer"
            >
              <img
                src="/Assets/logo/Plas Icon.png"
                alt="Plas Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-none">
        {/* Shop Selector for POS and shop-related users */}
        {!session?.isProjectUser && (hasModuleAccess('pos_terminal') ||
          hasModuleAccess('checkout') ||
          hasModuleAccess('inventory') ||
          hasModuleAccess('transactions') ||
          hasModuleAccess('orders') ||
          hasModuleAccess('discounts') ||
          hasModuleAccess('shop_dashboard')) && (
          <div className="mb-6 px-1">
            <ShopSelector isSidebarOpen={isSidebarOpen} />
          </div>
        )}

        {filteredMenuItems.map((section, idx) => (
          <div key={section.section} className="mb-6">
            {isSidebarOpen && (
              <h3 className="px-4 mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                {section.section}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map(renderMenuItem)}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-sidebar-border/50 p-4 bg-black/5 backdrop-blur-sm">
        {isSidebarOpen ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/20 group-hover:scale-105 transition-transform duration-300">
                   {session?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-white truncate max-w-[100px]">{session?.username || 'User'}</p>
                  <p className="text-[10px] text-sidebar-foreground/50">{session?.role || 'Admin'}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-destructive/20 hover:text-destructive text-sidebar-foreground/50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-2">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl hover:bg-destructive/20 hover:text-destructive text-sidebar-foreground/50"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-destructive text-destructive-foreground">
                  Logout
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;
