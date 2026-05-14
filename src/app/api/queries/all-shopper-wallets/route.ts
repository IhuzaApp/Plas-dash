import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasuraClient } from '@/lib/hasuraClient';
import { GET_ALL_WALLETS_WITH_TRANSACTIONS } from '@/lib/graphql/queries';

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
    const data = await hasuraClient.request<any>(GET_ALL_WALLETS_WITH_TRANSACTIONS);
    const mappedWallets = (data.Wallets || []).map((w: any) => {
      const shopperArr = w.shoppers || [];
      const shopper = Array.isArray(shopperArr) ? shopperArr[0] : shopperArr;
      const user = shopper?.User || null;
      return {
        ...w,
        User: user,
        shopper: shopper,
      };
    });
    return NextResponse.json({ Wallets: mappedWallets });
  } catch (error) {
    console.error('Error fetching shopper wallets:', error);
    return NextResponse.json({ error: 'Failed to fetch shopper wallets' }, { status: 500 });
  }
}
