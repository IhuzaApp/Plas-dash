import React from 'react';
import { format } from 'date-fns';
import { Utensils, Store, Info, RefreshCw, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Promotion } from './types';
import { useSystemConfig, SystemConfig } from '@/hooks/useSystemConfig';

interface PromotionDetailsProps {
  promotion: Promotion;
  systemConfig?: SystemConfig;
}

export const PromotionDetails: React.FC<PromotionDetailsProps> = ({
  promotion,
  systemConfig: providedSystemConfig,
}) => {
  const { data: fetchedSystemConfig } = useSystemConfig();
  const systemConfig = providedSystemConfig || fetchedSystemConfig;

  return (
    <div className="px-12 py-6 border-l-2 border-primary/20 ml-6 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Business Details - Only show if linked to a business */}
        {(promotion.restaurant_id || promotion.shop_id) && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              {promotion.Restaurant ? (
                <Utensils className="h-4 w-4" />
              ) : (
                <Store className="h-4 w-4" />
              )}
              {promotion.Restaurant ? 'Restaurant Details' : 'Shop Details'}
            </div>
            <div className="space-y-3 bg-background rounded-lg p-4 border shadow-sm">
              {promotion.Shop?.logo && (
                <img
                  src={promotion.Shop.logo}
                  alt="Logo"
                  className="h-12 w-12 rounded-lg object-cover mb-2 border"
                />
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {promotion.Restaurant?.name || promotion.Shop?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {promotion.Shop?.description || 'No description available'}
                </p>
              </div>
              <div className="pt-2 space-y-2 border-t text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span>{promotion.Restaurant?.phone || promotion.Shop?.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TIN:</span>
                  <span>{promotion.Restaurant?.tin || promotion.Shop?.tin || 'N/A'}</span>
                </div>
                {promotion.Shop?.ssd && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SSD:</span>
                    <span>{promotion.Shop.ssd}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span
                    className={cn(
                      'capitalize',
                      (promotion.Restaurant?.is_active ?? true) ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {(promotion.Restaurant?.is_active ?? true) ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Promotion Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Info className="h-4 w-4" />
            Promotion Config
          </div>
          <div className="space-y-3 bg-background rounded-lg p-4 border shadow-sm text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="capitalize">{promotion.promotion_type.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Applies To:</span>
              <span className="capitalize">{promotion.applies_to_type.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min. Purchase:</span>
              <span>
                {systemConfig?.currency || 'Ksh'} {promotion.min_purchase_amount || '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priority:</span>
              <span>{promotion.priority}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stackable:</span>
              <span>{promotion.is_stackable ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-muted-foreground">Created:</span>
              <span>{format(new Date(promotion.created_at), 'MMM d, yyyy HH:mm')}</span>
            </div>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <RefreshCw className="h-4 w-4" />
            Usage Limits
          </div>
          <div className="space-y-4 bg-background rounded-lg p-4 border shadow-sm">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs text-muted-foreground font-medium">
                  Customer Usage Limit
                </span>
                <span className="text-sm font-bold">{promotion.usage_per_customer || '10'}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-full" style={{ width: '40%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs text-muted-foreground font-medium">
                  Total Promotion Limit
                </span>
                <span className="text-sm font-bold">{promotion.usage_limit || '10'}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div className="bg-orange-500 h-full" style={{ width: '15%' }}></div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              * Real-time usage tracking is currently being processed.
            </p>
          </div>
        </div>

        {/* Influencer Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <User className="h-4 w-4" />
            Influencer Information
          </div>
          <div className="space-y-3 bg-background rounded-lg p-4 border shadow-sm text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Assigned Influencer:</span>
              <span className="font-medium text-primary">
                {promotion.Influencer?.name ||
                  (promotion.influencer_id === 'none' ? 'Generic' : 'Not assigned')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Influencer Code:</span>
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                {promotion.influencer_code || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Extra Customer Disc:</span>
              <span className="font-semibold">
                {promotion.customer_discount_percent
                  ? `${promotion.customer_discount_percent}%`
                  : '0%'}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-muted-foreground">Influencer Earning:</span>
              <span className="font-bold text-green-600">
                {systemConfig?.currency || 'Ksh'} {promotion.earning_per_order || '0'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
