import React from 'react';
import { Loader2, Tag } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Promotion } from './types';
import { PromotionRow } from './PromotionRow';
import { SystemConfig } from '@/hooks/useSystemConfig';

interface PromotionTableProps {
  promotions: Promotion[];
  isLoading: boolean;
  expandedRows: Set<string>;
  onToggleRow: (id: string) => void;
  onEdit: (promotion: Promotion) => void;
  isProjectUser: boolean;
  systemConfig?: SystemConfig;
}

// Base column count: Promotion, Shop/Restaurant, Code, Benefit, Period, Limits, Funded By, Stacking, Free Delivery, Status, Actions = 11
// + 1 expand toggle column for project users = 12
const BASE_COLS = 11;

export const PromotionTable: React.FC<PromotionTableProps> = ({
  promotions,
  isLoading,
  expandedRows,
  onToggleRow,
  onEdit,
  isProjectUser,
  systemConfig,
}) => {
  const colSpan = isProjectUser ? BASE_COLS + 1 : BASE_COLS;

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            {isProjectUser && <TableHead className="w-[40px]"></TableHead>}
            <TableHead>Promotion</TableHead>
            <TableHead>Shop/Restaurant</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Benefit</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Limits</TableHead>
            <TableHead>Funded By</TableHead>
            <TableHead>Stacking</TableHead>
            <TableHead>Free Del.</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="text-center py-8">
                <div className="flex justify-center items-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              </TableCell>
            </TableRow>
          ) : promotions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="text-center py-8">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Tag className="h-8 w-8 text-muted-foreground/50" />
                  <p>No promotions found</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            promotions.map(promotion => (
              <PromotionRow
                key={promotion.id}
                promotion={promotion}
                isExpanded={expandedRows.has(promotion.id)}
                onToggle={onToggleRow}
                onEdit={onEdit}
                isProjectUser={isProjectUser}
                systemConfig={systemConfig}
              />
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
};
