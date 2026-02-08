import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

const MONTHS_BACK = 12;

const GET_USERS_FOR_TREND = gql`
  query GetUsersForTrend {
    Users(order_by: { created_at: asc }) {
      created_at
      role
      is_guest
      shopper {
        active
      }
    }
  }
`;

const GET_ACTIVITY_FOR_TREND = gql`
  query GetActivityForTrend($since: timestamptz!) {
    Orders(where: { created_at: { _gte: $since } }) {
      created_at
      user_id
    }
    reel_orders(where: { created_at: { _gte: $since } }) {
      created_at
      user_id
    }
    restaurant_orders(where: { created_at: { _gte: $since } }) {
      created_at
      user_id
    }
    businessProductOrders(
      where: {
        created_at: { _gte: $since }
        ordered_by: { _is_null: false }
      }
    ) {
      created_at
      ordered_by
    }
    Invoices(where: { created_at: { _gte: $since } }) {
      created_at
      customer_id
    }
    Ratings(where: { created_at: { _gte: $since } }) {
      created_at
      customer_id
    }
  }
`;

export interface UsersTrendBucket {
  month: string;
  name: string;
  totalUsers: number;
  activeUsers: number;
  guestUsers: number;
  customers: number;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as { id?: string }).id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }

    const since = subMonths(new Date(), MONTHS_BACK);
    const sinceIso = since.toISOString();

    const [usersData, activityData] = await Promise.all([
      hasuraClient.request<{
        Users: Array<{
          created_at: string;
          role: string | null;
          is_guest: boolean | null;
          shopper: { active: boolean | null } | null;
        }>;
      }>(GET_USERS_FOR_TREND),
      hasuraClient.request<{
        Orders: Array<{ created_at: string; user_id: string }>;
        reel_orders: Array<{ created_at: string; user_id: string }>;
        restaurant_orders: Array<{ created_at: string; user_id: string }>;
        businessProductOrders: Array<{ created_at: string; ordered_by: string }>;
        Invoices: Array<{ created_at: string; customer_id: string }>;
        Ratings: Array<{ created_at: string; customer_id: string }>;
      }>(GET_ACTIVITY_FOR_TREND, { since: sinceIso }),
    ]);

    const users = usersData.Users || [];
    const buckets: UsersTrendBucket[] = [];

    for (let i = MONTHS_BACK - 1; i >= 0; i--) {
      const bucketEnd = endOfMonth(subMonths(new Date(), i));
      const bucketStart = startOfMonth(bucketEnd);
      const monthKey = format(bucketStart, 'yyyy-MM');
      const monthLabel = format(bucketStart, 'MMM yy');

      const totalUsers = users.filter(
        u => new Date(u.created_at) <= bucketEnd
      ).length;
      const guestUsers = users.filter(
        u =>
          u.is_guest &&
          new Date(u.created_at) <= bucketEnd
      ).length;
      const customers = users.filter(
        u =>
          (u.role?.toLowerCase() ?? '') === 'user' &&
          new Date(u.created_at) <= bucketEnd &&
          (u.shopper?.active !== true)
      ).length;

      const activeIds = new Set<string>();
      const addActive = (dateStr: string, id: string) => {
        const d = new Date(dateStr);
        if (d >= bucketStart && d <= bucketEnd && id) activeIds.add(id);
      };
      (activityData.Orders || []).forEach(o => addActive(o.created_at, o.user_id));
      (activityData.reel_orders || []).forEach(o => addActive(o.created_at, o.user_id));
      (activityData.restaurant_orders || []).forEach(o =>
        addActive(o.created_at, o.user_id)
      );
      (activityData.businessProductOrders || []).forEach(o =>
        addActive(o.created_at, o.ordered_by)
      );
      (activityData.Invoices || []).forEach(i =>
        addActive(i.created_at, i.customer_id)
      );
      (activityData.Ratings || []).forEach(r =>
        addActive(r.created_at, r.customer_id)
      );

      buckets.push({
        month: monthKey,
        name: monthLabel,
        totalUsers,
        activeUsers: activeIds.size,
        guestUsers,
        customers,
      });
    }

    return NextResponse.json({ buckets });
  } catch (error) {
    console.error('Error fetching users trend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users trend' },
      { status: 500 }
    );
  }
}
