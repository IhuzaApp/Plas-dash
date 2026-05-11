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
      <div className="absolute inset-0 z-[100] bg-background/60 backdrop-blur-md flex items-center justify-center transition-all duration-500">
        <div className="relative flex flex-col items-center">
          {/* Outer Ring */}
          <div className="w-24 h-24 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
          
          {/* Inner Logo */}
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-12 h-12 rounded-2xl bg-primary/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
                <img
                  src="/Assets/logo/Plas Icon.png"
                  alt="Plas"
                  className="w-8 h-8 object-contain"
                />
             </div>
          </div>
          
          <div className="mt-8 text-center">
            <h2 className="text-xl font-black tracking-tighter text-primary uppercase animate-pulse">
              PLAS
            </h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">
              Initializing Experience
            </p>
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
