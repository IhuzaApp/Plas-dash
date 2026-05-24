import React from 'react';
import { cn } from '@/lib/utils';
import { Promotion } from './types';

interface PromotionStatusBadgeProps {
  status: Promotion['status'];
  className?: string;
}

export const PromotionStatusBadge: React.FC<PromotionStatusBadgeProps> = ({
  status,
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        status === 'active'
          ? 'bg-green-100 text-green-800'
          : status === 'scheduled'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800',
        className
      )}
    >
      {status}
    </span>
  );
};
