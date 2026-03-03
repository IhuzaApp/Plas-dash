import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon } from 'lucide-react';

interface Stat {
  title: string;
  value: number;
  /** When set, this is shown instead of the raw `value` */
  formattedValue?: string;
  /** Optional sub-line below the value */
  subtitle?: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

interface StatsCardsProps {
  stats: Stat[];
  isLoading: boolean;
  /** Override skeleton count (defaults to 4) */
  skeletonCount?: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, isLoading, skeletonCount = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {isLoading
        ? Array(skeletonCount)
            .fill(0)
            .map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        : stats.map((stat, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <h3 className="text-2xl font-bold mt-1 truncate">
                      {stat.formattedValue ?? stat.value}
                    </h3>
                    {stat.subtitle && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {stat.subtitle}
                      </p>
                    )}
                  </div>
                  <div className={`p-3 rounded-full ${stat.bg} ml-2 shrink-0`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
    </div>
  );
};
