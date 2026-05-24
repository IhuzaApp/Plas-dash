import React from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight, Utensils, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Promotion } from './types';
import { PromotionStatusBadge } from './PromotionStatusBadge';
import { PromotionBusinessInfo } from './PromotionBusinessInfo';
import { PromotionDetails } from './PromotionDetails';
import { useSystemConfig, SystemConfig } from '@/hooks/useSystemConfig';

interface PromotionRowProps {
  promotion: Promotion;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onEdit: (promotion: Promotion) => void;
  isProjectUser: boolean;
  systemConfig?: SystemConfig;
}

const FUNDED_BY_BADGE: Record<string, string> = {
  platform: 'bg-blue-100 text-blue-700',
  merchant: 'bg-amber-100 text-amber-700',
  shared: 'bg-purple-100 text-purple-700',
};

const STACKING_BADGE: Record<string, string> = {
  exclusive: 'bg-red-100 text-red-700',
  with_referral: 'bg-yellow-100 text-yellow-700',
  stackable: 'bg-green-100 text-green-700',
};

const STACKING_LABEL: Record<string, string> = {
  exclusive: 'Exclusive',
  with_referral: 'Referral+',
  stackable: 'Stackable',
};

// Base column count = 11; +1 for project-user expand toggle = 12
const BASE_COLS = 11;

export const PromotionRow: React.FC<PromotionRowProps> = ({
  promotion,
  isExpanded,
  onToggle,
  onEdit,
  isProjectUser,
  systemConfig: providedSystemConfig,
}) => {
  const { data: fetchedSystemConfig } = useSystemConfig();
  const systemConfig = providedSystemConfig || fetchedSystemConfig;
  const colSpan = isProjectUser ? BASE_COLS + 1 : BASE_COLS;

  return (
    <React.Fragment>
      <TableRow className={cn('group transition-colors', isExpanded && 'bg-muted/50 border-b-0')}>
        {isProjectUser && (
          <TableCell>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onToggle(promotion.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </TableCell>
        )}
        <TableCell className="font-medium">{promotion.name}</TableCell>
        <TableCell className="text-xs">
          <PromotionBusinessInfo promotion={promotion} />
        </TableCell>
        <TableCell>
          <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
            {promotion.code || '-'}
          </span>
        </TableCell>
        <TableCell>
          {promotion.promotion_type === 'percentage'
            ? `${promotion.discount_value}%`
            : promotion.promotion_type === 'fixed'
              ? `${systemConfig?.currency || 'Ksh'} ${promotion.discount_value}`
              : promotion.promotion_type === 'bogo'
                ? 'BOGO'
                : promotion.discount_value || 'Special'}
        </TableCell>
        <TableCell className="text-xs">
          {format(new Date(promotion.start_date), 'MMM d')} -{' '}
          {format(new Date(promotion.end_date), 'MMM d')}
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          Limit: {promotion.usage_limit || '∞'}
        </TableCell>

        {/* Funded By */}
        <TableCell>
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize',
              FUNDED_BY_BADGE[promotion.funded_by] ?? 'bg-gray-100 text-gray-600'
            )}
          >
            {promotion.funded_by ?? '—'}
          </span>
        </TableCell>

        {/* Stacking */}
        <TableCell>
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
              STACKING_BADGE[promotion.stacking_type] ?? 'bg-gray-100 text-gray-600'
            )}
          >
            {STACKING_LABEL[promotion.stacking_type] ?? promotion.stacking_type ?? '—'}
          </span>
        </TableCell>

        {/* Free Delivery */}
        <TableCell>
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
              promotion.free_delivery ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            )}
          >
            {promotion.free_delivery ? 'Yes' : 'No'}
          </span>
        </TableCell>

        <TableCell>
          <PromotionStatusBadge status={promotion.status} />
        </TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm" onClick={() => onEdit(promotion)}>
            Edit
          </Button>
        </TableCell>
      </TableRow>

      {/* Expanded Content */}
      {isExpanded && (
        <TableRow className="bg-muted/30 border-t-0 hover:bg-muted/30">
          <TableCell colSpan={colSpan} className="p-0">
            <PromotionDetails promotion={promotion} systemConfig={systemConfig} />
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
};
