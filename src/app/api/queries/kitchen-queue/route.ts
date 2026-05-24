import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_KITCHEN_QUEUE = gql`
  query GetKitchenQueue($restaurant_id: uuid!) {
    kitchenQueue(where: { restaurant_id: { _eq: $restaurant_id } }, order_by: { updated_at: asc }) {
      id
      dishesOrdered
      restaurant_id
      restaurant_order_id
      status
      table_number
      token_number
      updated_at
      waiter_id
    }
  }
`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurant_id = searchParams.get('restaurantId');

    if (!restaurant_id) {
      return NextResponse.json({ error: 'Missing restaurantId parameter' }, { status: 400 });
    }

    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }

    const data = await hasuraClient.request(GET_KITCHEN_QUEUE, {
      restaurant_id,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[Kitchen Queue] Error fetching kitchen queue:', error);
    // fallback if `id` or something doesn't exist
    return NextResponse.json(
      { error: error.message || 'Failed to fetch kitchen queue' },
      { status: 500 }
    );
  }
}
