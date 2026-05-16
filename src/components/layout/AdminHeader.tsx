'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Menu, Search, User as UserIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ThemeToggle from './ThemeToggle';
import { SearchCommand } from './SearchCommand';
import { usePageLoading } from '@/hooks/usePageLoading';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/contexts/AuthContext';
import { useShopSession } from '@/contexts/ShopSessionContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Store } from 'lucide-react';
import Link from 'next/link';

interface AdminHeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const AdminHeader = ({ toggleSidebar, isSidebarOpen }: AdminHeaderProps) => {
  const [open, setOpen] = React.useState(false);
  const { isLoading } = usePageLoading();
  const { data: nextSession } = useSession();
  const { session: customSession } = useAuth();
  const { isLoggedIntoShop, shopSession, logoutFromShop } = useShopSession();

  const displayUser = customSession || nextSession?.user;
  const userImage =
    (displayUser as any)?.image ||
    (displayUser as any)?.profile_picture ||
    (displayUser as any)?.profile ||
    (displayUser as any)?.display_image;
  const userName =
    (displayUser as any)?.name || (displayUser as any)?.username || (displayUser as any)?.fullName || 'User';
  const userRole =
    (displayUser as any)?.role ||
    (displayUser as any)?.roleType ||
    (displayUser as any)?.display_role ||
    'Admin';

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      {/* Loading Progress Bar */}
      <div
        className={cn(
          'absolute top-0 left-0 h-[3px] bg-primary transition-all duration-500 ease-in-out z-[60]',
          isLoading ? 'w-full opacity-100' : 'w-0 opacity-0'
        )}
      />

      <div className="container flex h-16 items-center px-4 md:px-8">
        <div className="flex flex-1 items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 md:flex-initial">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-xl"
              onClick={toggleSidebar}
            >
              <Menu
                className={cn(
                  'h-5 w-5 transition-transform duration-500',
                  isSidebarOpen ? 'rotate-90' : 'rotate-0'
                )}
              />
            </Button>

            <div className="relative w-full max-w-[400px]">
              <Button
                variant="outline"
                className="relative h-11 w-full justify-start text-sm text-muted-foreground bg-zinc-100/80 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 hover:border-primary/50 hover:text-primary transition-all duration-300 rounded-2xl px-4 group shadow-sm"
                onClick={() => setOpen(true)}
              >
                <Search className="h-4 w-4 mr-2 group-hover:scale-110 transition-all duration-300" />
                <span className="hidden lg:inline-flex">Search users, orders, shops...</span>
                <span className="inline-flex lg:hidden">Search...</span>
                <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden h-6 select-none items-center gap-1 rounded-lg border bg-white dark:bg-zinc-900 px-2 font-mono text-[10px] font-medium opacity-100 sm:flex border-zinc-200 dark:border-zinc-700 group-hover:border-primary/30 transition-colors">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
              <SearchCommand open={open} onOpenChange={setOpen} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIntoShop && shopSession ? (
              <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-green-500/10 border border-green-500/20 shadow-sm animate-in fade-in zoom-in duration-500">
                <div className="flex items-center gap-2 pr-3 border-r border-green-500/20">
                  <Store className="h-3 w-3 text-green-600 dark:text-green-400" />
                  <span className="text-[10px] font-black uppercase tracking-tight text-green-700 dark:text-green-300">
                    {shopSession.shopName}
                  </span>
                </div>
                <div className="flex items-center gap-2 pr-2 border-r border-green-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                    POS Session Active
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={logoutFromShop}
                  className="h-6 px-2 text-[9px] font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1 mr-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/10">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  System Live
                </span>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
              onClick={() => {
                /* Handle notifications */
              }}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background" />
            </Button>

            <div className="w-[1px] h-6 bg-border mx-1" />

            <ThemeToggle />

            <div className="flex items-center gap-3 pl-2">
              {displayUser ? (
                <Link href="/settings">
                  <Button
                    variant="ghost"
                    className="p-1 pr-3 rounded-2xl border bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-primary/10 hover:border-primary/20 transition-all"
                  >
                    <Avatar className="h-8 w-8 rounded-xl mr-2 shadow-sm border border-border">
                      <AvatarImage src={userImage} />
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                        {userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start mr-1">
                      <span className="text-[11px] font-bold leading-tight">
                        {userName.split(' ')[0]}
                      </span>
                      <span className="text-[9px] text-muted-foreground uppercase tracking-tighter font-medium">
                        {userRole}
                      </span>
                    </div>
                  </Button>
                </Link>
              ) : (
                <div className="flex flex-col items-end px-2">
                  <span className="text-xs font-bold leading-none">Admin Portal</span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-tighter">
                    v1.2.0
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
