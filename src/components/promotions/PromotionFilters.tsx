import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface PromotionFilterState {
  searchQuery: string;
  fundedBy: string; // 'all' | 'platform' | 'merchant' | 'shared'
  freeDelivery: string; // 'all' | 'yes' | 'no'
  promoType: string; // 'all' | 'standard' | 'influencer'
}

interface PromotionFiltersProps {
  filters: PromotionFilterState;
  onFiltersChange: (filters: PromotionFilterState) => void;
}

export const PromotionFilters: React.FC<PromotionFiltersProps> = ({ filters, onFiltersChange }) => {
  const set = (key: keyof PromotionFilterState, value: string) =>
    onFiltersChange({ ...filters, [key]: value });

  const hasActiveFilters =
    filters.searchQuery ||
    filters.fundedBy !== 'all' ||
    filters.freeDelivery !== 'all' ||
    filters.promoType !== 'all';

  const clearAll = () =>
    onFiltersChange({ searchQuery: '', fundedBy: 'all', freeDelivery: 'all', promoType: 'all' });

  return (
    <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search promotions by name, code, status, or discount..."
          className="pl-8"
          value={filters.searchQuery}
          onChange={e => set('searchQuery', e.target.value)}
        />
        {filters.searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-5 w-5 p-0"
            onClick={() => set('searchQuery', '')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Funded By */}
      <Select value={filters.fundedBy} onValueChange={v => set('fundedBy', v)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Funded By" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Funders</SelectItem>
          <SelectItem value="platform">Platform</SelectItem>
          <SelectItem value="merchant">Merchant</SelectItem>
          <SelectItem value="shared">Shared</SelectItem>
        </SelectContent>
      </Select>

      {/* Free Delivery */}
      <Select value={filters.freeDelivery} onValueChange={v => set('freeDelivery', v)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Free Delivery" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any Delivery</SelectItem>
          <SelectItem value="yes">Free Delivery</SelectItem>
          <SelectItem value="no">Paid Delivery</SelectItem>
        </SelectContent>
      </Select>

      {/* Promotion Type */}
      <Select value={filters.promoType} onValueChange={v => set('promoType', v)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="standard">Standard</SelectItem>
          <SelectItem value="influencer">Influencer</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear All */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1.5 text-muted-foreground">
          <X className="h-4 w-4" /> Clear
        </Button>
      )}
    </div>
  );
};
