import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_ALL_ORDERS_FOR_CUSTOMERS = gql`
  query GetAllOrdersForCustomers($start: timestamptz!, $end: timestamptz!) {
    Orders(where: { status: { _eq: "delivered" }, created_at: { _gte: $start, _lte: $end } }) {
      user_id
      total
      delivery_fee
      service_fee
    }
    reel_orders(where: { status: { _eq: "delivered" }, created_at: { _gte: $start, _lte: $end } }) {
      user_id
      total
      delivery_fee
      service_fee
    }
    restaurant_orders(
      where: { status: { _eq: "delivered" }, created_at: { _gte: $start, _lte: $end } }
    ) {
      user_id
      total
      delivery_fee
    }
    businessProductOrders(
      where: { status: { _eq: "delivered" }, created_at: { _gte: $start, _lte: $end } }
    ) {
      ordered_by
      total
      transportation_fee
      service_fee
    }
    package_delivery(
      where: { status: { _eq: "delivered" }, created_at: { _gte: $start, _lte: $end } }
    ) {
      user_id
      delivery_fee
    }
  }
`;

const GET_USERS_BY_IDS = gql`
  query GetUsersByIds($ids: [uuid!]!) {
    Users(where: { id: { _in: $ids } }) {
      id
      name
      email
      profile_picture
      phone_number
    }
  }
`;

type OrderRow = {
  user_id?: string;
  ordered_by?: string;
  total?: string | number | null;
  delivery_fee?: string | number | null;
  service_fee?: string | number | null;
  transportation_fee?: string | number | null;
};

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  let userId = (session as any)?.user?.id;

  if (!userId) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      userId = authHeader.substring(7);
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start') || new Date(0).toISOString();
  const end = searchParams.get('end') || new Date().toISOString();

  try {
    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }

    const data = await hasuraClient.request<{
      Orders: OrderRow[];
      reel_orders: OrderRow[];
      restaurant_orders: OrderRow[];
      businessProductOrders: OrderRow[];
      package_delivery: OrderRow[];
    }>(GET_ALL_ORDERS_FOR_CUSTOMERS, { start, end });

    const byCustomer: Record<string, { orders: number; spend: number }> = {};

    const processOrders = (rows: OrderRow[], type: string) => {
      rows.forEach(row => {
        const uid = row.user_id || row.ordered_by;
        if (!uid) return;
        if (!byCustomer[uid]) {
          byCustomer[uid] = { orders: 0, spend: 0 };
        }
        const c = byCustomer[uid];
        c.orders += 1;

        const total = parseFloat(String(row.total || '0'));
        const delivery = parseFloat(String(row.delivery_fee || row.transportation_fee || '0'));
        const service = parseFloat(String(row.service_fee || '0'));

        c.spend += total + delivery + service;
      });
    };

    processOrders(data.Orders || [], 'regular');
    processOrders(data.reel_orders || [], 'reel');
    processOrders(data.restaurant_orders || [], 'restaurant');
    processOrders(data.businessProductOrders || [], 'business');
    processOrders(data.package_delivery || [], 'package');

    const customerIds = Object.keys(byCustomer);
    if (customerIds.length === 0) {
      return NextResponse.json({ customers: [] });
    }

    // Sort and take top 50 to avoid huge subsequent query
    const sortedIds = customerIds
      .sort((a, b) => byCustomer[b].orders - byCustomer[a].orders)
      .slice(0, 50);

    const usersData = await hasuraClient.request<{
      Users: Array<{
        id: string;
        name: string | null;
        email: string | null;
        profile_picture: string | null;
        phone_number: string | null;
      }>;
    }>(GET_USERS_BY_IDS, { ids: sortedIds });

    const userMap = new Map((usersData.Users || []).map(u => [u.id, u]));

    const result = sortedIds
      .map(id => {
        const stats = byCustomer[id];
        const user = userMap.get(id);
        return {
          user_id: id,
          name: user?.name || 'Unknown Customer',
          email: user?.email,
          profile_picture: user?.profile_picture,
          phone_number: user?.phone_number,
          totalOrders: stats.orders,
          totalSpend: stats.spend,
        };
      })
      .filter(c => c.totalOrders > 0);

    return NextResponse.json({ customers: result });
  } catch (error) {
    console.error('Error fetching top customers stats:', error);
    return NextResponse.json({ error: 'Failed to fetch top customers stats' }, { status: 500 });
  }
}
