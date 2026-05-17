import { useQuery } from '@tanstack/react-query';
import { hasuraRequest } from '@/lib/hasura';
import { useAuth } from '@/contexts/AuthContext';

interface OrgEmployee {
  id: string;
  employeeID: string;
  fullnames: string;
  email: string;
  phone: string;
  Address: string;
  Position: string;
  roleType: string;
  active: boolean;
  shop_id: string;
  restaurant_id: string | null;
  multAuthEnabled: boolean;
  twoFactorSecrets?: string | null;
  Shops: {
    id: string;
    name: string;
    address: string;
    phone: string;
    is_active: boolean;
  } | null;
  Restaurants: {
    id: string;
    name: string;
    location: string;
    phone: string;
    is_active: boolean;
  } | null;
}

export function useCurrentOrgEmployee() {
  const { session } = useAuth();

  const GET_CURRENT_ORG_EMPLOYEE = `
    query GetCurrentOrgEmployee($email: String!) {
      orgEmployees(where: { email: { _eq: $email }, active: { _eq: true } }) {
        id
        employeeID
        fullnames
        email
        phone
        Address
        Position
        roleType
        active
        shop_id
        restaurant_id
        multAuthEnabled
        twoFactorSecrets
        Shops {
          id
          name
          address
          phone
          is_active
        }
        Restaurants {
          id
          name
          location
          phone
          is_active
        }
      }
    }
  `;

  const { data, isLoading, error } = useQuery({
    queryKey: ['currentOrgEmployee', session?.email],
    queryFn: () => hasuraRequest(GET_CURRENT_ORG_EMPLOYEE, { email: session?.email }),
    enabled: !!session?.email,
  });

  const orgEmployee =
    data &&
    typeof data === 'object' &&
    'orgEmployees' in data &&
    Array.isArray((data as any).orgEmployees)
      ? ((data as any).orgEmployees[0] as OrgEmployee)
      : undefined;

  return {
    orgEmployee,
    isLoading,
    error,
  };
}
