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
      <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-center h-full w-full">
          <div className="text-center">
            <div className="text-6xl font-bold text-primary animate-pulse mb-4">Plas</div>
            <p className="text-lg text-muted-foreground font-medium">Wait...</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full">
      <LoadingOverlay />
      {children}
    </div>
  );
};

export default LoadingProvider;
