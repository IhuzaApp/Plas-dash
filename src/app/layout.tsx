'use client';
import { Suspense } from 'react';

import { Inter } from 'next/font/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import '@/styles/globals.css';
import '@/styles/nprogress.css';
import { useState } from 'react';
import RootLayout from '@/components/layout/RootLayout';
import { SessionProvider } from 'next-auth/react';

const inter = Inter({ subsets: ['latin'] });

export default function AppRootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 24 * 60 * 60 * 1000, // 24 hours
          },
        },
      })
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Plas Dashboard</title>
        <link rel="icon" href="/favicon.png" />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <TooltipProvider>
                <Suspense fallback={null}>
                  <RootLayout>{children}</RootLayout>
                </Suspense>
                <Toaster />
                <Sonner />
              </TooltipProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
