import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

// Last 3 months: users with activity from orders, invoices, business orders, reel orders, restaurant orders, or ratings
const GET_ACTIVE_USER_IDS = gql`
  query GetActiveUserIds($since: timestamptz!) {
    Orders(where: { created_at: { _gte: $since } }) {
      user_id
    }
    reel_orders(where: { created_at: { _gte: $since } }) {
      user_id
    }
    restaurant_orders(where: { created_at: { _gte: $since } }) {
      user_id
    }
    businessProductOrders(
      where: { created_at: { _gte: $since }, ordered_by: { _is_null: false } }
    ) {
      ordered_by
    }
    Invoices(where: { created_at: { _gte: $since } }) {
      customer_id
    }
    Ratings(where: { created_at: { _gte: $since } }) {
      customer_id
    }
  }
`;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as { id?: string }).id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }

    const since = new Date();
    since.setMonth(since.getMonth() - 3);
    const sinceIso = since.toISOString();

    const data = await hasuraClient.request<{
      Orders: { user_id: string }[];
      reel_orders: { user_id: string }[];
      restaurant_orders: { user_id: string }[];
      businessProductOrders: { ordered_by: string }[];
      Invoices: { customer_id: string }[];
      Ratings: { customer_id: string }[];
    }>(GET_ACTIVE_USER_IDS, { since: sinceIso });

    const activeUserIds = new Set<string>();

    (data.Orders || []).forEach((o: { user_id: string }) => {
      if (o.user_id) activeUserIds.add(o.user_id);
    });
    (data.reel_orders || []).forEach((o: { user_id: string }) => {
      if (o.user_id) activeUserIds.add(o.user_id);
    });
    (data.restaurant_orders || []).forEach((o: { user_id: string }) => {
      if (o.user_id) activeUserIds.add(o.user_id);
    });
    (data.businessProductOrders || []).forEach((o: { ordered_by: string }) => {
      if (o.ordered_by) activeUserIds.add(o.ordered_by);
    });
    (data.Invoices || []).forEach((i: { customer_id: string }) => {
      if (i.customer_id) activeUserIds.add(i.customer_id);
    });
    (data.Ratings || []).forEach((r: { customer_id: string }) => {
      if (r.customer_id) activeUserIds.add(r.customer_id);
    });

    return NextResponse.json({
      activeUsers: activeUserIds.size,
      since: sinceIso,
    });
  } catch (error) {
    console.error('Error fetching active users count:', error);
    return NextResponse.json({ error: 'Failed to fetch active users count' }, { status: 500 });
  }
}
