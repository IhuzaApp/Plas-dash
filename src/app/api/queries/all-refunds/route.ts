import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

// Admin dashboard: fetches all refunds (no filter).
const GET_ALL_REFUNDS = gql`
  query getAllREfunds {
    Refunds(order_by: { created_at: desc }) {
      created_at
      generated_by
      id
      order_id
      paid
      reason
      amount
      status
      update_on
      user_id
      Order {
        assigned_at
        combined_order_id
        delivery_photo_url
        delivery_time
        discount
        created_at
        delivery_address_id
        delivery_fee
        delivery_notes
        id
        pin
        service_fee
        shop_id
        shopper_id
        status
        total
        updated_at
        user_id
        voucher_code
        orderedBy {
          gender
          email
          created_at
          id
          is_active
          is_guest
          name
          phone
          profile_picture
        }
      }
      User {
        gender
        email
        name
        phone
      }
    }
  }
`;

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

  try {
    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }

    const data = await hasuraClient.request<{ Refunds: any[] }>(GET_ALL_REFUNDS);
    return NextResponse.json({ refunds: data.Refunds || [] });
  } catch (error) {
    console.error('Error fetching refunds:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch refunds',
      },
      { status: 500 }
    );
  }
}
