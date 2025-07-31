import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/layout/RootLayout';
import { usePrivilege } from '@/hooks/usePrivilege';
import { GET_SHOP_BY_ID_FOR_SETTINGS } from '@/lib/graphql/queries';
import { hasuraRequest } from '@/lib/hasura';

interface ShopSettings {
  id: string;
  name: string;
  description: string;
  category_id: string;
  image: string | null;
  address: string;
  latitude: number;
  longitude: number;
  operating_hours: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  phone: string;
  tin: string | null;
  ssd: string | null;
  Category: {
    id: string;
    name: string;
  };
}

interface ShopSettingsResponse {
  Shops: ShopSettings[];
}

export const useShopSettings = () => {
  const { session } = useAuth();
  const { hasModuleAccess } = usePrivilege();

  return useQuery<ShopSettingsResponse>({
    queryKey: ['shopSettings', session?.shop_id],
    queryFn: async () => {
      if (!session?.shop_id) {
        throw new Error('No shop ID available');
      }
      
      return hasuraRequest(GET_SHOP_BY_ID_FOR_SETTINGS, { shop_id: session.shop_id });
    },
    enabled: !!session?.shop_id && hasModuleAccess('settings'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}; 