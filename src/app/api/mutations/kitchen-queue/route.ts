import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const INSERT_KITCHEN_QUEUE = gql`
  mutation InsertKitchenQueue(
    $dishesOrdered: jsonb = "",
    $restaurant_id: uuid = "",
    $restaurant_order_id: uuid = "",
    $status: String = "",
    $table_number: String = "",
    $token_number: String = "",
    $updated_at: timestamptz = "",
    $waiter_id: uuid = "",
    $paid: Boolean = false
  ) {
    insert_kitchenQueue(objects: {
      dishesOrdered: $dishesOrdered,
      restaurant_id: $restaurant_id,
      restaurant_order_id: $restaurant_order_id,
      status: $status,
      table_number: $table_number,
      token_number: $token_number,
      updated_at: $updated_at,
      waiter_id: $waiter_id,
      paid: $paid
    }) {
      affected_rows
    }
  }
`;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  let userId = (session as any)?.user?.id;

  if (!userId) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      userId = authHeader.substring(7);
    }
  }

  if (!userId) {
    console.warn('[Kitchen Queue] Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      dishesOrdered,
      restaurant_id,
      restaurant_order_id,
      status,
      table_number,
      token_number,
      updated_at,
      waiter_id,
      paid,
    } = body;

    if (!restaurant_id || !token_number) {
      return NextResponse.json({ error: 'Missing required fields: restaurant_id and token_number' }, { status: 400 });
    }

    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }

    const data = await hasuraClient.request(INSERT_KITCHEN_QUEUE, {
      dishesOrdered: dishesOrdered || [],
      restaurant_id,
      restaurant_order_id: restaurant_order_id || null,
      status: status || 'Pending',
      table_number: table_number || '',
      token_number,
      updated_at: updated_at || new Date().toISOString(),
      waiter_id: waiter_id || null,
      paid: paid || false,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[Kitchen Queue] Error inserting kitchen queue entry:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to insert kitchen queue entry' },
      { status: 500 }
    );
  }
}
