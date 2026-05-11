'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Menu, Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ThemeToggle from './ThemeToggle';
import { SearchCommand } from './SearchCommand';
import { usePageLoading } from '@/hooks/usePageLoading';
import { cn } from '@/lib/utils';

interface AdminHeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const AdminHeader = ({ toggleSidebar, isSidebarOpen }: AdminHeaderProps) => {
  const [open, setOpen] = React.useState(false);
  const { isLoading } = usePageLoading();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      {/* Loading Progress Bar */}
      <div className={cn(
        "absolute top-0 left-0 h-[3px] bg-primary transition-all duration-500 ease-in-out z-[60]",
        isLoading ? "w-full opacity-100" : "w-0 opacity-0"
      )} />
      
      <div className="container flex h-16 items-center px-4 md:px-8">
        <div className="flex flex-1 items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 md:flex-initial">
             <Button
                variant="ghost"
                size="icon"
                className="hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-xl"
                onClick={toggleSidebar}
              >
                <Menu className={cn("h-5 w-5 transition-transform duration-500", isSidebarOpen ? "rotate-90" : "rotate-0")} />
              </Button>
            
            <div className="relative w-full max-w-[400px]">
              <Button
                variant="outline"
                className="relative h-10 w-full justify-start text-sm text-muted-foreground bg-muted/30 border-muted/50 hover:bg-muted/50 hover:border-primary/30 transition-all duration-300 rounded-xl px-4 group"
                onClick={() => setOpen(true)}
              >
                <Search className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" />
                <span className="hidden lg:inline-flex">Search everything...</span>
                <span className="inline-flex lg:hidden">Search...</span>
                <kbd className="pointer-events-none absolute right-2 top-2.5 hidden h-5 select-none items-center gap-1 rounded-lg border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
              <SearchCommand open={open} onOpenChange={setOpen} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 mr-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/10">
               <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
               <span className="text-[10px] font-bold text-primary uppercase tracking-wider">System Live</span>
            </div>

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
            
            <div className="hidden md:flex items-center gap-3 pl-2">
               <div className="flex flex-col items-end">
                  <span className="text-xs font-bold leading-none">Admin Portal</span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-tighter">v1.2.0</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
