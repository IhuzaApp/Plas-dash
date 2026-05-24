import React from 'react';
import { Card } from '@/components/ui/card';

export const PageSkeleton = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-3">
          <div className="h-10 w-64 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
          <div className="h-4 w-48 bg-zinc-100 dark:bg-zinc-800/50 animate-pulse rounded-lg" />
        </div>
        <div className="h-12 w-32 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <Card
            key={i}
            className="p-6 border-none shadow-sm bg-zinc-50/50 dark:bg-zinc-900/50 rounded-3xl space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="h-12 w-12 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-2xl" />
              <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
              <div className="h-8 w-full bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-8 border-none shadow-lg rounded-3xl space-y-6">
          <div className="h-6 w-1/3 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/4 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
                  <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800/50 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-8 border-none shadow-lg rounded-3xl space-y-6">
          <div className="h-6 w-1/3 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
          <div className="h-[300px] w-full bg-zinc-50 dark:bg-zinc-900 animate-pulse rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800" />
        </Card>
      </div>
    </div>
  );
};
