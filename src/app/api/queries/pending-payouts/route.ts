import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_ALL_PENDING_PAYOUTS = gql`
  query GetAllPendingPayouts {
    payouts(
      where: { status: { _eq: "pending" } }
      order_by: { created_at: desc }
    ) {
      amount
      created_at
      id
      status
      updated_on
      user_id
      wallet_id
      Wallets {
        id
        available_balance
        last_updated
        reserved_balance
        shopper_id
        Wallet_Transactions {
          amount
          created_at
          description
          id
          status
          type
          wallet_id
          related_reel_orderId
          related_order_id
          relate_business_order_id
        }
        User {
          email
          gender
          id
          is_guest
          is_active
          name
          phone
          profile_picture
        }
      }
    }
  }
`;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions as any);
  let userId = (session as any)?.user?.id;

  if (!userId) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      userId = authHeader.substring(7);
    }
  }

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasuraClient) return NextResponse.json({ error: 'DB not initialized' }, { status: 500 });

  try {
    const data = await hasuraClient.request<{ payouts: unknown[] }>(GET_ALL_PENDING_PAYOUTS);
    return NextResponse.json({ payouts: data.payouts ?? [] });
  } catch (error) {
    console.error('Error fetching pending payouts:', error);
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
  }
}
