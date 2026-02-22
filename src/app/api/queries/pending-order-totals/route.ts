import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const EXCLUDED_STATUSES = ['delivered', 'on_the_way', 'cancelled'];

const GET_PENDING_ORDER_TOTALS = gql`
  query GetPendingOrderTotals {
    Orders(where: { status: { _nin: ["delivered", "on_the_way", "cancelled"] } }) {
      total
      delivery_fee
      service_fee
    }
    reel_orders(where: { status: { _nin: ["delivered", "on_the_way", "cancelled"] } }) {
      total
      delivery_fee
      service_fee
    }
    restaurant_orders(where: { status: { _nin: ["delivered", "on_the_way", "cancelled"] } }) {
      total
      delivery_fee
    }
    businessProductOrders(where: { status: { _nin: ["delivered", "on_the_way", "cancelled"] } }) {
      total
      service_fee
      transportation_fee
    }
  }
`;

type OrderRow = Record<string, string | null>;

function sumFields(rows: OrderRow[], ...keys: string[]): number {
  return (rows ?? []).reduce(
    (acc, row) => acc + keys.reduce((s, k) => s + parseFloat(row[k] ?? '0'), 0),
    0
  );
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  let userId = (session as any)?.user?.id;

  if (!userId) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      userId = authHeader.substring(7);
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasuraClient) {
    return NextResponse.json({ error: 'Database client not initialized' }, { status: 500 });
  }

  try {
    const data = await hasuraClient.request<{
      Orders: OrderRow[];
      reel_orders: OrderRow[];
      restaurant_orders: OrderRow[];
      businessProductOrders: OrderRow[];
    }>(GET_PENDING_ORDER_TOTALS);

    const regular = sumFields(data.Orders, 'total', 'delivery_fee', 'service_fee');
    const reel = sumFields(data.reel_orders, 'total', 'delivery_fee', 'service_fee');
    const restaurant = sumFields(data.restaurant_orders, 'total', 'delivery_fee');
    const business = sumFields(data.businessProductOrders, 'total', 'service_fee', 'transportation_fee');

    const total = regular + reel + restaurant + business;

    return NextResponse.json({
      total,
      breakdown: { regular, reel, restaurant, business },
    });
  } catch (error) {
    console.error('Error fetching pending order totals:', error);
    return NextResponse.json({ error: 'Failed to fetch pending order totals' }, { status: 500 });
  }
}
