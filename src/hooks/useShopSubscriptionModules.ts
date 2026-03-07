import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { PrivilegeKey } from '@/types/privileges';

interface SubscriptionModule {
    id: string;
    module_id: string;
    plan_id: string;
    module: {
        id: string;
        name: string;
        slug: string;
        group_name: string | null;
    };
}

interface ShopSubscription {
    id: string;
    plan_id: string;
    status: string;
    plan: {
        id: string;
        name: string;
        plan_modules: SubscriptionModule[];
    };
}

export function useShopSubscriptionModules(shopId?: string, restaurantId?: string) {
    const { data, isLoading, error } = useQuery<{ shop_subscriptions: ShopSubscription[] }>({
        queryKey: ['shop-subscription-modules', shopId, restaurantId],
        queryFn: () => {
            let url = '/api/queries/shop-subscriptions';
            const params = new URLSearchParams();
            if (shopId) params.append('shop_id', shopId);
            if (restaurantId) params.append('restaurant_id', restaurantId);

            const queryString = params.toString();
            return apiGet(`${url}${queryString ? `?${queryString}` : ''}`);
        },
        enabled: !!(shopId || restaurantId),
    });

    const subscriptions = data?.shop_subscriptions ?? [];

    // Prefer the active subscription; fall back to most recent if none tagged 'active'
    const activeSubscription =
        subscriptions.find(sub => sub.status?.toLowerCase() === 'active') ??
        subscriptions[0] ?? null;

    const availableModules: PrivilegeKey[] = activeSubscription?.plan?.plan_modules
        ? activeSubscription.plan.plan_modules
            .map(pm => pm.module?.slug?.toLowerCase() as PrivilegeKey)
            .filter(Boolean)
        : [];

    return {
        availableModules,
        isLoading,
        error,
        hasSubscription: !!activeSubscription,
        planName: activeSubscription?.plan?.name,
    };
}
