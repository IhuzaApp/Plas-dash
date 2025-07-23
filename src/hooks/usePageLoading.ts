'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Import NProgress dynamically to avoid SSR issues
let NProgress: any = null;

if (typeof window !== 'undefined') {
  NProgress = require('nprogress');

  // Configure NProgress
  NProgress.configure({
    showSpinner: true,
    minimum: 0.1,
    easing: 'ease',
    speed: 500,
    trickleSpeed: 200,
  });
}

export const usePageLoading = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!NProgress) return;

    const handleStart = () => {
      setIsLoading(true);
      NProgress.start();
    };

    const handleComplete = () => {
      setIsLoading(false);
      NProgress.done();
    };

    // Start loading immediately when route changes
    handleStart();

    // Complete loading after a short delay to allow for page transition
    const timer = setTimeout(() => {
      handleComplete();
    }, 500);

    return () => {
      clearTimeout(timer);
      handleComplete();
    };
  }, [pathname, searchParams]);

  return { isLoading };
};
