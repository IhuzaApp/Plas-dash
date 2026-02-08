import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

// Admin dashboard: fetches all refunds (no filter).
const GET_ALL_REFUNDS = gql`
  query GetAllRefunds {
    Refunds(order_by: { created_at: desc }) {
      id
      amount
      order_id
      user_id
      reason
      status
      paid
      created_at
    }
  }
`;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
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
