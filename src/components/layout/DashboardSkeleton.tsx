'use client';

import React from 'react';

/* ─────────────────────────────────────────────
   DashboardSkeleton
   Mirrors the real AdminSidebar + AdminHeader + main content
   layout so the user sees a coherent shimmer while the
   privilege-based redirect is being computed.
───────────────────────────────────────────── */
const DashboardSkeleton: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[60] flex bg-background animate-in fade-in duration-300">
      {/* ── Sidebar skeleton ── */}
      <aside className="w-20 h-screen border-r border-border/40 bg-sidebar flex flex-col shrink-0">
        {/* Logo area */}
        <div className="h-20 flex items-center justify-center border-b border-sidebar-border/40 px-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 animate-pulse" />
        </div>

        {/* Nav items */}
        <div className="flex-1 px-3 py-6 space-y-3 overflow-hidden">
          {/* Section label placeholder */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-center py-3"
              style={{ opacity: 1 - i * 0.08 }}
            >
              <div className="w-8 h-8 rounded-xl bg-white/8 animate-pulse" />
            </div>
          ))}
        </div>

        {/* User area */}
        <div className="border-t border-sidebar-border/40 p-4 flex justify-center">
          <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header skeleton */}
        <header className="sticky top-0 z-50 h-16 border-b border-border/40 bg-background/80 backdrop-blur-xl flex items-center px-6 gap-4 shrink-0">
          {/* Hamburger */}
          <div className="w-9 h-9 rounded-xl bg-muted animate-pulse shrink-0" />

          {/* Search bar */}
          <div className="flex-1 max-w-[400px] h-11 rounded-2xl bg-muted/60 animate-pulse" />

          {/* Right section */}
          <div className="ml-auto flex items-center gap-3">
            <div className="w-28 h-7 rounded-full bg-muted/60 animate-pulse hidden lg:block" />
            <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
            <div className="w-px h-6 bg-border" />
            <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
            <div className="w-28 h-9 rounded-2xl bg-muted animate-pulse" />
          </div>
        </header>

        {/* Content skeleton */}
        <main className="flex-1 p-8 overflow-hidden bg-muted/5">
          <div className="max-w-[1600px] mx-auto w-full space-y-8">
            {/* Page title row */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-8 w-52 rounded-xl bg-muted animate-pulse" />
                <div className="h-4 w-36 rounded-lg bg-muted/60 animate-pulse" />
              </div>
              <div className="h-10 w-32 rounded-2xl bg-muted animate-pulse" />
            </div>

            {/* Stat cards row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-3xl bg-card border border-border/40 p-5 space-y-4"
                  style={{ opacity: 1 - i * 0.06 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-muted animate-pulse" />
                    <div className="w-16 h-6 rounded-full bg-muted/60 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-2/3 rounded bg-muted/60 animate-pulse" />
                    <div className="h-7 w-full rounded-xl bg-muted animate-pulse" />
                  </div>
                </div>
              ))}
            </div>

            {/* Two-column content area */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left: list / activity */}
              <div className="lg:col-span-3 rounded-3xl bg-card border border-border/40 p-6 space-y-5">
                <div className="flex items-center justify-between mb-1">
                  <div className="h-5 w-32 rounded bg-muted animate-pulse" />
                  <div className="h-7 w-20 rounded-xl bg-muted/60 animate-pulse" />
                </div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div
                        className="h-3 rounded bg-muted animate-pulse"
                        style={{ width: `${65 + i * 5}%` }}
                      />
                      <div className="h-2.5 w-1/3 rounded bg-muted/50 animate-pulse" />
                    </div>
                    <div className="w-16 h-6 rounded-full bg-muted/60 animate-pulse shrink-0" />
                  </div>
                ))}
              </div>

              {/* Right: chart placeholder */}
              <div className="lg:col-span-2 rounded-3xl bg-card border border-border/40 p-6 space-y-4">
                <div className="h-5 w-28 rounded bg-muted animate-pulse" />
                <div className="h-[220px] w-full rounded-2xl bg-muted/40 animate-pulse border-2 border-dashed border-border/40" />
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-8 rounded-xl bg-muted/60 animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Subtle "redirecting" hint at the bottom */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-2.5 rounded-full bg-background/90 border border-border/50 shadow-lg backdrop-blur-md z-[70]">
        <div className="w-3.5 h-3.5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <span className="text-[11px] font-semibold text-muted-foreground tracking-wide">
          Loading your workspace…
        </span>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
