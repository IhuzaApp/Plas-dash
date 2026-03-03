'use client';

import React, { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import LoadingProvider from './LoadingProvider';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar isSidebarOpen={isSidebarOpen} />
        <div
          className={`flex flex-col flex-1 transition-all ${isSidebarOpen ? 'md:ml-4' : 'md:-ml-36'}`}
        >
          <AdminHeader toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
          <LoadingProvider>
            <main className="flex-1 p-4 md:p-6 overflow-auto min-h-0">{children}</main>
          </LoadingProvider>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
