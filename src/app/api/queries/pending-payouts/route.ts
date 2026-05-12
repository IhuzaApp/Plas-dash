import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
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
        is_guest
        phone
        name
        profile_picture
      }
      Wallets {
        id
        available_balance
        last_updated
        reserved_balance
        shopper_id
        shoppers {
          full_name
          phone_number
          profile_photo
        }
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
    console.log('Raw Hasura Payouts:', JSON.stringify(data, null, 2));
    
    // Map plural relationships to singular for UI compatibility
    const mappedPayouts = (data.payouts ?? []).map(p => {
      const usersArr = Array.isArray(p.Users) ? p.Users : (p.Users ? [p.Users] : []);
      const walletsArr = Array.isArray(p.Wallets) ? p.Wallets : (p.Wallets ? [p.Wallets] : []);
      const wallet = walletsArr[0] || null;
      const shopperArr = wallet && Array.isArray(wallet.shoppers) ? wallet.shoppers : (wallet?.shoppers ? [wallet.shoppers] : []);
      
      const user = usersArr[0] || null;
      const shopper = shopperArr[0] || null;
      
      return {
        ...p,
        User: user,
        shopper: shopper,
        Wallets: wallet ? {
          ...wallet,
          User: user,
          shopper: shopper
        } : null
      };
    });

    return NextResponse.json({ payouts: mappedPayouts });
  } catch (error) {
    console.error('Error fetching pending payouts:', error);
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
  }
}
