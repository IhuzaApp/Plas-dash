import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hasuraRequest } from '@/lib/hasura';
import { useShopSession } from '@/hooks/useShopSession';

interface StaffMember {
  id: string;
  employeeID: string;
  fullnames: string;
  email: string;
  phone: string;
  Address: string;
  active: boolean;
  Position: string;
  roleType: string;
  shop_id: string;
  created_on: string;
  updated_on: string;
  Shops: {
    id: string;
    name: string;
  };
}

interface StaffDistribution {
  storeName: string;
  storeId: string;
  manager: number;
  cashier: number;
  stockClerk: number;
  other: number;
  total: number;
}

interface RecentActivity {
  id: string;
  employeeName: string;
  storeName: string;
  action: string;
  timestamp: string;
  timeAgo: string;
}

interface UseStaffManagementReturn {
  staffMembers: StaffMember[];
  staffDistribution: StaffDistribution[];
  recentActivity: RecentActivity[];
  totalStaff: number;
  activeStaff: number;
  isLoading: boolean;
  error: string | null;
}

// GraphQL query to get all staff members
const GET_ALL_STAFF = `
  query GetAllStaff($parentShopName: String!) {
    orgEmployees(
      where: { 
        active: { _eq: true }
        Shops: { 
          _or: [
            { name: { _eq: $parentShopName } }
            { relatedTo: { _eq: $parentShopName } }
          ]
        }
      }
    ) {
      id
      employeeID
      fullnames
      email
      phone
      Address
      active
      Position
      roleType
      shop_id
      created_on
      updated_on
      Shops {
        id
        name
      }
    }
  }
`;

export function useStaffManagement(): UseStaffManagementReturn {
  const { shopSession } = useShopSession();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [staffDistribution, setStaffDistribution] = useState<StaffDistribution[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the current shop name from shop session
  const currentShopName = shopSession?.shopName;

  const { data, isLoading: queryLoading, error: queryError } = useQuery({
    queryKey: ['allStaff', currentShopName],
    queryFn: () => hasuraRequest(GET_ALL_STAFF, { parentShopName: currentShopName }),
    enabled: !!currentShopName,
  }) as { data: { orgEmployees: StaffMember[] } | undefined; isLoading: boolean; error: any };

  console.log('=== STAFF MANAGEMENT HOOK DEBUG ===');
  console.log('Current shop name:', currentShopName);
  console.log('Query loading:', queryLoading);
  console.log('Query error:', queryError);
  console.log('Query data:', data);

  useEffect(() => {
    if (queryLoading) {
      setIsLoading(true);
      return;
    }

    if (queryError) {
      setError(queryError.message || 'Failed to fetch staff data');
      setIsLoading(false);
      return;
    }

    if (data?.orgEmployees) {
      const staff = data.orgEmployees;
      setStaffMembers(staff);

      // Calculate staff distribution by store and position
      const distributionMap = new Map<string, StaffDistribution>();

             staff.forEach((member: StaffMember) => {
        const storeName = member.Shops?.name || 'Unknown Store';
        const storeId = member.Shops?.id || 'unknown';
        
        if (!distributionMap.has(storeId)) {
          distributionMap.set(storeId, {
            storeName,
            storeId,
            manager: 0,
            cashier: 0,
            stockClerk: 0,
            other: 0,
            total: 0,
          });
        }

        const store = distributionMap.get(storeId)!;
        store.total++;

        // Categorize by position
        const position = member.Position?.toLowerCase() || '';
        if (position.includes('manager') || position.includes('supervisor')) {
          store.manager++;
        } else if (position.includes('cashier') || position.includes('cash')) {
          store.cashier++;
        } else if (position.includes('stock') || position.includes('inventory') || position.includes('clerk')) {
          store.stockClerk++;
        } else {
          store.other++;
        }
      });

      setStaffDistribution(Array.from(distributionMap.values()));

      // Generate recent activity (last 24 hours)
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
             const recentStaff = staff.filter((member: StaffMember) => {
        const updatedOn = new Date(member.updated_on);
        return updatedOn >= twentyFourHoursAgo;
      });

             const activity: RecentActivity[] = recentStaff.map((member: StaffMember) => {
        const updatedOn = new Date(member.updated_on);
        const timeDiff = now.getTime() - updatedOn.getTime();
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutesAgo = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        let timeAgo = '';
        if (hoursAgo > 0) {
          timeAgo = `${hoursAgo}h ${minutesAgo}m ago`;
        } else {
          timeAgo = `${minutesAgo}m ago`;
        }

        return {
          id: member.id,
          employeeName: member.fullnames,
          storeName: member.Shops?.name || 'Unknown Store',
          action: 'Updated profile',
          timestamp: member.updated_on,
          timeAgo,
        };
      });

      // Sort by most recent first
      activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setRecentActivity(activity.slice(0, 10)); // Show only last 10 activities
      setIsLoading(false);
    }
  }, [data, queryLoading, queryError]);

  const totalStaff = staffMembers.length;
  const activeStaff = staffMembers.filter(member => member.active).length;

  return {
    staffMembers,
    staffDistribution,
    recentActivity,
    totalStaff,
    activeStaff,
    isLoading,
    error,
  };
} 