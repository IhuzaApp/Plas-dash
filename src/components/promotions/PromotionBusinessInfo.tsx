import React from 'react';
import { Utensils, Store } from 'lucide-react';
import { Promotion } from './types';

interface PromotionBusinessInfoProps {
    promotion: Promotion;
    className?: string;
}

export const PromotionBusinessInfo: React.FC<PromotionBusinessInfoProps> = ({ promotion, className }) => {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {promotion.Restaurant ? (
                <Utensils className="h-3 w-3 text-orange-500" />
            ) : promotion.Shop ? (
                <Store className="h-3 w-3 text-blue-500" />
            ) : null}
            {promotion.Restaurant?.name || promotion.Shop?.name || 'Multi-store'}
        </div>
    );
};
