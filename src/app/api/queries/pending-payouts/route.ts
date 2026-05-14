import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_ALL_PENDING_PAYOUTS = gql`
  query GetAllPendingPayouts {
    payouts(where: { status: { _eq: "pending" } }, order_by: { created_at: desc }) {
      amount
      created_at
      id
      status
      updated_on
      user_id
      wallet_id
      Users {
        email
        id
        name
        phone
        profile_picture
      }
      Wallets {
        id
        available_balance
        reserved_balance
        shopper_id
        shoppers {
          full_name
          phone_number
          profile_photo
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
    const data = await hasuraClient.request<{ payouts: any[] }>(GET_ALL_PENDING_PAYOUTS);

    // Map plural/singular relationships to a consistent format
    const mappedPayouts = (data.payouts ?? []).map(p => {
      const rawUser = p.Users;
      const user = Array.isArray(rawUser) ? rawUser[0] : rawUser;

      const rawWallet = p.Wallets;
      const wallet = Array.isArray(rawWallet) ? rawWallet[0] : rawWallet;

      const rawShopper = wallet?.shoppers;
      const shopper = Array.isArray(rawShopper) ? rawShopper[0] : rawShopper;

      return {
        ...p,
        User: user || null,
        shopper: shopper || null,
        Wallets: wallet
          ? {
              ...wallet,
              User: user || null,
              shopper: shopper || null,
            }
          : null,
      };
    });

    return NextResponse.json({ payouts: mappedPayouts });
  } catch (error) {
    console.error('Error fetching pending payouts:', error);
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
  }
}
