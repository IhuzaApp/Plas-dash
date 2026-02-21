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
      if (NProgress.isStarted()) {
        NProgress.set(0.1);
      } else {
        NProgress.start();
      }
    };

    const handleComplete = () => {
      setIsLoading(false);
      NProgress.done();
    };

    // Fast click interception for <a> tags
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (
        anchor &&
        anchor instanceof HTMLAnchorElement &&
        anchor.href &&
        anchor.target !== '_blank' &&
        !e.defaultPrevented &&
        e.button === 0 && // left click only
        !e.metaKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        const url = new URL(anchor.href);
        const isInternal = url.origin === window.location.origin;
        const isSamePath =
          url.pathname === window.location.pathname && url.search === window.location.search;

        if (isInternal && !isSamePath) {
          handleStart();
        }
      }
    };

    // Handle browser back/forward buttons
    const handlePopState = () => {
      handleStart();
    };

    // Patch history API for programmatic navigation (router.push/replace)
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      handleStart();
      return originalPushState.apply(this, args);
    };

    window.history.replaceState = function (...args) {
      const url = args[2];
      // Only trigger if the path or search actually changes (ignore state-only updates if possible)
      // For simplicity, we trigger it, and handleComplete will hide it quickly if fast.
      handleStart();
      return originalReplaceState.apply(this, args);
    };

    window.addEventListener('click', handleAnchorClick);
    window.addEventListener('popstate', handlePopState);

    // This effect runs on route changes (pathname/searchParams change)
    // We stop the progress bar here if it was started by a click or pushState
    handleComplete();

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('click', handleAnchorClick);
      window.removeEventListener('popstate', handlePopState);
      handleComplete();
    };
  }, [pathname, searchParams]);

  return { isLoading };
};
