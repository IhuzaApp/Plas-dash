'use client';

import React from 'react';
import { usePageLoading } from '@/hooks/usePageLoading';

interface LoadingProviderProps {
  children: React.ReactNode;
}

const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const { isLoading } = usePageLoading();

  // Custom loading overlay that only covers the main content area
  const LoadingOverlay = () => {
    if (!isLoading) return null;

    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <LoadingOverlay />
      {children}
    </div>
  );
};

export default LoadingProvider; 