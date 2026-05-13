'use client';

import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import LoadingProvider from './LoadingProvider';
import { cn } from '@/lib/utils';

import { PageSkeleton } from '@/components/ui/PageSkeleton';

interface AdminLayoutProps {
  children: React.ReactNode;
  isLoading?: boolean;
}

const AdminLayout = ({ children, isLoading }: AdminLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AdminSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex flex-col flex-1 transition-all duration-500 ease-in-out min-h-0">
        <AdminHeader toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <LoadingProvider>
          <main className="flex-1 p-4 md:p-8 overflow-auto min-h-0 bg-muted/5">
             <div className="max-w-[1600px] mx-auto w-full">
                {isLoading ? <PageSkeleton /> : children}
             </div>
          </main>
        </LoadingProvider>
      </div>
    </div>
  );
};

export default AdminLayout;
