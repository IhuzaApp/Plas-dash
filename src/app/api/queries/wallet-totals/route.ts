import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_WALLET_TOTALS = gql`
  query GetWalletTotals {
    Wallets {
      available_balance
    }
    business_wallet {
      amount
    }
    personalWallet {
      balance
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

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasuraClient) {
    return NextResponse.json({ error: 'Database client not initialized' }, { status: 500 });
  }

  try {
    const data = await hasuraClient.request<{
      Wallets: { available_balance: string }[];
      business_wallet: { amount: string }[];
      personalWallet: { balance: string }[];
    }>(GET_WALLET_TOTALS);

    const sumArr = (arr: { [k: string]: string }[], key: string): number =>
      (arr ?? []).reduce((acc, r) => acc + parseFloat(r[key] ?? '0'), 0);

    const personalWallet = sumArr(data.Wallets, 'available_balance');
    const personalWalletBalance = sumArr(data.personalWallet as any, 'balance');
    const businessWallet = sumArr(data.business_wallet, 'amount');

    return NextResponse.json({
      walletBalance: personalWallet + personalWalletBalance,
      businessBalance: businessWallet,
      total: personalWallet + personalWalletBalance + businessWallet,
    });
  } catch (error) {
    console.error('Error fetching wallet totals:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet totals' }, { status: 500 });
  }
}
