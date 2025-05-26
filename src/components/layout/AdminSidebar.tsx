"use client";

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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface AdminSidebarProps {
  isSidebarOpen: boolean;
}

const AdminSidebar = ({ isSidebarOpen }: AdminSidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

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

  const handleNavigation = (path: string) => {
    if (path === pathname) return;
    setIsNavigating(true);
    setNavigatingTo(path);
    router.push(path);
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
        { title: 'Shoppers', icon: User, path: '/shoppers' },
        { title: 'Customers', icon: Users, path: '/users' },
        { title: 'Shops', icon: Store, path: '/shops' },
        { title: 'Products', icon: ShoppingCart, path: '/products' },
      ],
    },
    {
      section: 'Point of Sale',
      icon: CreditCard,
      items: [
        { title: 'Company Dashboard', icon: LayoutDashboard, path: '/pos/company-dashboard' },
        { title: 'Shop Dashboard', icon: Store, path: '/pos/shop-dashboard' },
        { title: 'Checkout', icon: CreditCard, path: '/pos/checkout' },
        { title: 'Inventory', icon: ShoppingBag, path: '/pos/inventory' },
        { title: 'Transactions', icon: Receipt, path: '/pos/transactions' },
        { title: 'Discounts', icon: Tag, path: '/pos/discounts' },
        { title: 'Financial Overview', icon: Coins, path: '/pos/financial' },
        { title: 'Staff Management', icon: Users, path: '/pos/staff' },
      ],
    },
    {
      section: 'Finance',
      icon: Wallet,
      items: [
        { title: 'Company Wallet', icon: Wallet, path: '/company-wallet' },
        { title: 'Shopper Wallets', icon: Wallet, path: '/shopper-wallets' },
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
        { title: 'System Settings', icon: Settings, path: '/settings' },
      ],
    },
  ];

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
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold mr-2">
                P
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Plas Dashboard
              </h1>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
              P
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {menuItems.map(section => (
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
