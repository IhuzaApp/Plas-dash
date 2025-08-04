import { useState, useEffect } from 'react';
import { useAuth } from '@/components/layout/RootLayout';
import { useQuery } from '@tanstack/react-query';
import { hasuraRequest } from '@/lib/hasura';

interface Shop {
  id: string;
  name: string;
  address: string;
  phone: string;
  is_active: boolean;
  logo?: string;
}

interface UserShop {
  shop: Shop;
  position: string;
  roleType: string;
  multAuthEnabled: boolean;
  employeeId: string;
  employeeName: string;
  userId: string; // UUID from orgEmployees table
}

export function useUserShops() {
  const { session } = useAuth();
  const [userShops, setUserShops] = useState<UserShop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If we have session data with shop_id, create a shop entry directly
  useEffect(() => {
    if (session && session.shop_id) {
      console.log('Creating shop from session data:', session);
      const shopFromSession: UserShop = {
        shop: {
          id: session.shop_id,
          name: 'Current Shop', // We'll need to get the actual shop name
          address: '',
          phone: '',
          is_active: true,
        },
        position: 'Employee', // Default position
        roleType: 'employee', // Default role
        multAuthEnabled: false, // We'll need to get this from the database
        employeeId: session.id,
        employeeName: session.fullName,
        userId: session.id, // Use the session ID as the UUID
      };
      
      console.log('Shop from session:', shopFromSession);
      setUserShops([shopFromSession]);
      setIsLoading(false);
    }
  }, [session]);

  // Query to get user's shops
  const GET_USER_SHOPS = `
    query GetUserShops($userId: uuid!) {
      orgEmployees(where: { id: { _eq: $userId }, active: { _eq: true } }) {
        id
        shop_id
        Position
        roleType
        multAuthEnabled
        fullnames
        employeeID
        Shops {
          id
          name
          address
          phone
          is_active
          logo
        }
      }
    }
  `;

  const { data, isLoading: queryLoading, error: queryError } = useQuery({
    queryKey: ['userShops', session?.id],
    queryFn: () => hasuraRequest(GET_USER_SHOPS, { userId: session?.id }),
    enabled: !!session?.id,
  });

  console.log('useUserShops Debug:', {
    sessionId: session?.id,
    sessionData: session,
    queryLoading,
    queryError,
    data,
  });

  useEffect(() => {
    if (queryLoading) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsLoading(false);
    }

    if (queryError) {
      setError(queryError.message);
    }

    if (data && typeof data === 'object' && 'orgEmployees' in data && Array.isArray((data as any).orgEmployees)) {
      console.log('Raw orgEmployees data:', (data as any).orgEmployees);
      
      const shops = (data as any).orgEmployees
        .filter((employee: any) => employee.Shops && employee.Shops.is_active)
        .map((employee: any) => {
          console.log('Processing employee:', employee);
          return {
            shop: employee.Shops,
            position: employee.Position,
            roleType: employee.roleType,
            multAuthEnabled: employee.multAuthEnabled || false,
            employeeId: employee.employeeID,
            employeeName: employee.fullnames,
            userId: employee.id, // UUID from orgEmployees table
          };
        });
      
      console.log('Processed shops:', shops);
      setUserShops(shops);
    }
  }, [data, queryLoading, queryError]);

  return {
    userShops,
    isLoading,
    error,
  };
} 