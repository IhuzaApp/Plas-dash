import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const UPDATE_KITCHEN_QUEUE = gql`
  mutation UpdateKitchenQueue(
    $token_number: String!
    $restaurant_id: uuid!
    $set: kitchenQueue_set_input!
  ) {
    update_kitchenQueue(
      where: { token_number: { _eq: $token_number }, restaurant_id: { _eq: $restaurant_id } }
      _set: $set
    ) {
      affected_rows
    }
  }
`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token_number, restaurant_id, status, paid } = body;

    if (!token_number || !restaurant_id) {
      return NextResponse.json({ error: 'Missing token_number or restaurant_id' }, { status: 400 });
    }

    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }

    const setObj: any = {
      updated_at: new Date().toISOString(),
    };
    if (status !== undefined) setObj.status = status;
    if (paid !== undefined) setObj.paid = paid;

    const data = await hasuraClient.request(UPDATE_KITCHEN_QUEUE, {
      token_number,
      restaurant_id,
      set: setObj,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[Kitchen Queue] Error updating kitchen queue:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update kitchen queue' },
      { status: 500 }
    );
  }
}
