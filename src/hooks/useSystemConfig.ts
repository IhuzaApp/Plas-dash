import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

export interface SystemConfig {
    baseDeliveryFee: string;
    serviceFee: string;
    shoppingTime: string;
    unitsSurcharge: string;
    extraUnits: string;
    cappedDistanceFee: string;
    distanceSurcharge: string;
    currency: string;
    discounts: any;
    deliveryCommissionPercentage: string;
    productCommissionPercentage: string;
    withDrawCharges: string;
}

export function useSystemConfig() {
    return useQuery({
        queryKey: ['system-config'],
        queryFn: async () => {
            const response = (await apiGet('/api/system-config')) as any;
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch system config');
            }
            return response.config as SystemConfig;
        },
        // Cache for a long time as these settings rarely change
        staleTime: 1000 * 60 * 60, // 1 hour
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
}
