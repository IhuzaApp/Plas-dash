import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_ALL_REVENUE = gql`
  query GetAllRevenue {
    Revenue(order_by: { created_at: asc }) {
      id
      amount
      type
      created_at
      Plasbusiness_id
      businessOrder_Id
      commission_percentage
      order_id
      reel_order_id
      restaurant_id
      restaurant_order_id
      shop_id
      shopper_id
    }
  }
`;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  let userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      userId = authHeader.substring(7);
    }
  }

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasuraClient) return NextResponse.json({ error: 'DB not initialized' }, { status: 500 });

  try {
    const data = await hasuraClient.request<{ Revenue: unknown[] }>(GET_ALL_REVENUE);
    return NextResponse.json({ Revenue: data.Revenue ?? [] });
  } catch (error) {
    console.error('Error fetching revenue:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue' }, { status: 500 });
  }
}
