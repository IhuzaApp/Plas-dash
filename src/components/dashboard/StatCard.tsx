import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatCard = ({ title, value, description, icon, trend, className }: StatCardProps) => {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {trend && (
          <div
            className={`flex items-center text-xs mt-1 ${
              trend.isPositive ? 'text-green-500' : 'text-red-500'
            }`}
          >
            <span>
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
            <span className="ml-1">from last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
