import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const MAX_DELIVERY_TIME_MINUTES = 90;

const GET_DELIVERED_ORDERS = gql`
  query GetDeliveredOrders($start: timestamptz!, $end: timestamptz!) {
    Orders(
      where: {
        status: { _eq: "delivered" }
        created_at: { _gte: $start, _lte: $end }
        shopper_id: { _is_null: false }
      }
    ) {
      shopper_id
      created_at
      updated_at
      delivery_fee
      service_fee
    }
  }
`;

const GET_DELIVERED_REEL_ORDERS = gql`
  query GetDeliveredReelOrders($start: timestamptz!, $end: timestamptz!) {
    reel_orders(
      where: {
        status: { _eq: "delivered" }
        created_at: { _gte: $start, _lte: $end }
        shopper_id: { _is_null: false }
      }
    ) {
      shopper_id
      created_at
      updated_at
      delivery_fee
      service_fee
    }
  }
`;

const GET_DELIVERED_RESTAURANT_ORDERS = gql`
  query GetDeliveredRestaurantOrders($start: timestamptz!, $end: timestamptz!) {
    restaurant_orders(
      where: {
        status: { _eq: "delivered" }
        created_at: { _gte: $start, _lte: $end }
        shopper_id: { _is_null: false }
      }
    ) {
      shopper_id
      created_at
      updated_at
      delivery_fee
    }
  }
`;

const GET_DELIVERED_BUSINESS_ORDERS = gql`
  query GetDeliveredBusinessOrders($start: timestamptz!, $end: timestamptz!) {
    businessProductOrders(
      where: {
        status: { _eq: "delivered" }
        created_at: { _gte: $start, _lte: $end }
        shopper_id: { _is_null: false }
      }
    ) {
      shopper_id
      created_at
      delivered_time
      transportation_fee
      service_fee
    }
  }
`;

const GET_SHOPPERS_WITH_USER = gql`
  query GetShoppersWithUser($ids: [uuid!]!) {
    shoppers(where: { id: { _in: $ids }, active: { _eq: true } }) {
      id
      user_id
      full_name
      User {
        id
        name
        profile_picture
      }
    }
  }
`;

type OrderRow = {
  shopper_id: string;
  created_at: string;
  updated_at: string;
  delivery_fee?: string | number | null;
  service_fee?: string | number | null;
};

function deliveryMinutes(created: string, updated: string): number {
  const c = new Date(created).getTime();
  const u = new Date(updated).getTime();
  return (u - c) / (60 * 1000);
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  let userId = (session?.user as { id?: string } | undefined)?.id;

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
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  if (!start || !end) {
    return NextResponse.json(
      { error: 'Query params start and end (ISO date) required' },
      { status: 400 }
    );
  }

  try {
    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }

    const vars = { start, end };

    const [ordersRes, reelRes, restaurantRes, businessRes] = await Promise.all([
      hasuraClient.request<{ Orders: OrderRow[] }>(GET_DELIVERED_ORDERS, vars),
      hasuraClient.request<{ reel_orders: OrderRow[] }>(GET_DELIVERED_REEL_ORDERS, vars),
      hasuraClient.request<{ restaurant_orders: OrderRow[] }>(
        GET_DELIVERED_RESTAURANT_ORDERS,
        vars
      ),
      hasuraClient.request<{ businessProductOrders: OrderRow[] }>(
        GET_DELIVERED_BUSINESS_ORDERS,
        vars
      ),
    ]);

    const orders = ordersRes.Orders || [];
    const reelOrders = reelRes.reel_orders || [];
    const restaurantOrders = restaurantRes.restaurant_orders || [];
    const businessOrdersRaw = businessRes.businessProductOrders || [];
    const businessOrders = businessOrdersRaw.map(
      (
        o: OrderRow & {
          transportation_fee?: string | number | null;
          delivered_time?: string | null;
        }
      ) => ({
        ...o,
        delivery_fee: o.transportation_fee ?? o.delivery_fee,
        updated_at: o.delivered_time || o.created_at,
      })
    );

    const byShopper: Record<string, { orders: number; earnings: number; onTime: number }> = {};

    const add = (rows: OrderRow[]) => {
      rows.forEach(row => {
        const sid = row.shopper_id;
        if (!sid) return;
        if (!byShopper[sid]) {
          byShopper[sid] = { orders: 0, earnings: 0, onTime: 0 };
        }
        const d = byShopper[sid];
        d.orders += 1;
        const deliveryFee = parseFloat(String(row.delivery_fee || '0'));
        const serviceFee = parseFloat(String(row.service_fee || '0'));
        d.earnings += deliveryFee + serviceFee;
        const mins = deliveryMinutes(row.created_at, row.updated_at);
        if (mins <= MAX_DELIVERY_TIME_MINUTES) d.onTime += 1;
      });
    };

    add(orders);
    add(reelOrders);
    add(restaurantOrders);
    add(businessOrders);

    const shopperIds = Object.keys(byShopper);
    if (shopperIds.length === 0) {
      return NextResponse.json({ shoppers: [] });
    }

    const shoppersData = await hasuraClient.request<{
      shoppers: Array<{
        id: string;
        user_id: string;
        full_name: string | null;
        User: { id: string; name: string | null; profile_picture: string | null } | null;
      }>;
    }>(GET_SHOPPERS_WITH_USER, { ids: shopperIds });

    const shopperMap = new Map(
      (shoppersData.shoppers || []).map(s => [
        s.id,
        {
          user_id: s.user_id,
          name: s.User?.name || s.full_name || 'Shopper',
          profile_picture: s.User?.profile_picture || null,
        },
      ])
    );

    const result = shopperIds
      .map(id => {
        const stats = byShopper[id];
        const info = shopperMap.get(id);
        const onTimePct = stats.orders > 0 ? (stats.onTime / stats.orders) * 100 : 0;
        return {
          shopper_id: id,
          user_id: info?.user_id,
          name: info?.name ?? 'Shopper',
          profile_picture: info?.profile_picture ?? null,
          totalOrders: stats.orders,
          totalEarnings: stats.earnings,
          onTimeDeliveryPercentage: onTimePct,
          onTimeCount: stats.onTime,
        };
      })
      .filter(s => s.totalOrders > 0)
      .sort((a, b) => {
        if (b.onTimeDeliveryPercentage !== a.onTimeDeliveryPercentage) {
          return b.onTimeDeliveryPercentage - a.onTimeDeliveryPercentage;
        }
        if (b.totalOrders !== a.totalOrders) return b.totalOrders - a.totalOrders;
        return 0;
      })
      .slice(0, 10);

    return NextResponse.json({ shoppers: result });
  } catch (error) {
    console.error('Error fetching top shoppers stats:', error);
    return NextResponse.json({ error: 'Failed to fetch top shoppers stats' }, { status: 500 });
  }
}
