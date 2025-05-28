'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Menu, Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ThemeToggle from './ThemeToggle';
import { SearchCommand } from './SearchCommand';

interface AdminHeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const AdminHeader = ({ toggleSidebar, isSidebarOpen }: AdminHeaderProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Button
              variant="outline"
              className="relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
              onClick={() => setOpen(true)}
            >
              <span className="hidden lg:inline-flex">Search everything...</span>
              <span className="inline-flex lg:hidden">Search...</span>
              <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
            <SearchCommand open={open} onOpenChange={setOpen} />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => {
                /* Handle notifications */
              }}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                3
              </span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
