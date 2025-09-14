import type { AppProps } from 'next/app';
import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import NProgress from 'nprogress';
// Import NProgress styles first, then globals
import 'nprogress/nprogress.css';
import '@/styles/nprogress.css';
import '@/styles/globals.css';

// Configure NProgress outside of component to prevent reconfiguration
NProgress.configure({
  minimum: 0.3,
  easing: 'ease',
  speed: 500,
  showSpinner: false,
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Memoize handlers to prevent recreating functions on each render
  const handleStart = useCallback(() => {
    NProgress.start();
  }, []);

  const handleComplete = useCallback(() => {
    NProgress.done();
  }, []);

  const handleError = useCallback(() => {
    NProgress.done();
  }, []);

  useEffect(() => {
    // Bind the events
    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleError);

    return () => {
      // Cleanup event listeners
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleError);
    };
  }, [router, handleStart, handleComplete, handleError]);

  return <Component {...pageProps} />;
}
