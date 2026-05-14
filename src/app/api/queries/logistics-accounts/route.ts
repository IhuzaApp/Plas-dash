import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_LOGISTICS_ACCOUNTS = gql`
  query GetAllLogisticsAccounts {
    logisticsAccount(order_by: { created_at: desc }) {
      id
      fullname
      businessName
      type
      status
      disabled
      created_at
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
    const data = await hasuraClient.request<any>(GET_LOGISTICS_ACCOUNTS);
    return NextResponse.json({ accounts: data.logisticsAccount || [] });
  } catch (error) {
    console.error('Error fetching logistics accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch logistics accounts' }, { status: 500 });
  }
}
