import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import {
  format,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  subDays,
  subWeeks,
  subMonths,
  subYears,
} from 'date-fns';

const MAX_DELIVERY_TIME_MINUTES = 90;

const GET_DELIVERED_ORDERS = gql`
  query GetDeliveredOrdersTrend($start: timestamptz!, $end: timestamptz!) {
    Orders(
      where: {
        status: { _eq: "delivered" }
        created_at: { _gte: $start, _lte: $end }
        shopper_id: { _is_null: false }
      }
    ) {
      created_at
      updated_at
    }
  }
`;

const GET_DELIVERED_REEL_ORDERS = gql`
  query GetDeliveredReelOrdersTrend($start: timestamptz!, $end: timestamptz!) {
    reel_orders(
      where: {
        status: { _eq: "delivered" }
        created_at: { _gte: $start, _lte: $end }
        shopper_id: { _is_null: false }
      }
    ) {
      created_at
      updated_at
    }
  }
`;

const GET_DELIVERED_RESTAURANT_ORDERS = gql`
  query GetDeliveredRestaurantOrdersTrend($start: timestamptz!, $end: timestamptz!) {
    restaurant_orders(
      where: {
        status: { _eq: "delivered" }
        created_at: { _gte: $start, _lte: $end }
        shopper_id: { _is_null: false }
      }
    ) {
      created_at
      updated_at
    }
  }
`;

const GET_DELIVERED_BUSINESS_ORDERS = gql`
  query GetDeliveredBusinessOrdersTrend($start: timestamptz!, $end: timestamptz!) {
    businessProductOrders(
      where: {
        status: { _eq: "delivered" }
        created_at: { _gte: $start, _lte: $end }
        shopper_id: { _is_null: false }
      }
    ) {
      created_at
      delivered_time
    }
  }
`;

type OrderRow = { created_at: string; updated_at?: string; delivered_time?: string | null };

function deliveryMinutes(created: string, updated: string): number {
  const c = new Date(created).getTime();
  const u = new Date(updated).getTime();
  return (u - c) / (60 * 1000);
}

type GroupBy = 'day' | 'week' | 'month' | 'year';

function getPeriodKey(d: Date, groupBy: GroupBy): string {
  switch (groupBy) {
    case 'day':
      return format(startOfDay(d), 'yyyy-MM-dd');
    case 'week':
      return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    case 'month':
      return format(startOfMonth(d), 'yyyy-MM');
    case 'year':
      return format(startOfYear(d), 'yyyy');
    default:
      return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  }
}

function getPeriodLabel(key: string, groupBy: GroupBy): string {
  if (groupBy === 'year') return key;
  if (groupBy === 'month') return format(new Date(key + '-01'), 'MMM yy');
  return format(new Date(key), 'MMM d');
}

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
  const groupBy = (searchParams.get('groupBy') || 'week') as GroupBy;
  const validGroupBy: GroupBy[] = ['day', 'week', 'month', 'year'];
  const period = validGroupBy.includes(groupBy) ? groupBy : 'week';

  const now = new Date();
  const range = period === 'day' ? 14 : period === 'week' ? 12 : period === 'month' ? 12 : 5;
  const start =
    period === 'day'
      ? subDays(now, range)
      : period === 'week'
        ? subWeeks(now, range)
        : period === 'month'
          ? subMonths(now, range)
          : subYears(now, range);
  const startISO = start.toISOString();
  const endISO = now.toISOString();

  try {
    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }

    const vars = { start: startISO, end: endISO };

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
    const businessOrders: OrderRow[] = businessOrdersRaw.map(
      (o: OrderRow & { delivered_time?: string | null }) => ({
        created_at: o.created_at,
        updated_at: o.delivered_time || o.created_at,
      })
    );

    const buckets: Record<string, { on_time: number; late: number }> = {};

    const add = (rows: OrderRow[]) => {
      rows.forEach(row => {
        const key = getPeriodKey(new Date(row.created_at), period);
        if (!buckets[key]) {
          buckets[key] = { on_time: 0, late: 0 };
        }
        const b = buckets[key];
        const updated = row.updated_at || row.created_at;
        const mins = deliveryMinutes(row.created_at, updated);
        if (mins <= MAX_DELIVERY_TIME_MINUTES) b.on_time += 1;
        else b.late += 1;
      });
    };

    add(orders);
    add(reelOrders);
    add(restaurantOrders);
    add(businessOrders);

    const sortedKeys = Object.keys(buckets).sort();
    const data = sortedKeys.map(key => ({
      period: key,
      name: getPeriodLabel(key, period),
      on_time: buckets[key].on_time,
      late: buckets[key].late,
    }));

    return NextResponse.json({ data, groupBy: period });
  } catch (error) {
    console.error('Error fetching orders on-time trend:', error);
    return NextResponse.json({ error: 'Failed to fetch orders on-time trend' }, { status: 500 });
  }
}
