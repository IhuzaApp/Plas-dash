import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_PLATFORM_JOINERS = gql`
  query GetPlatformJoiners {
    Shops(order_by: { created_at: asc }) {
      created_at
    }
    Users(order_by: { created_at: asc }) {
      created_at
    }
    Restaurants(order_by: { created_at: asc }) {
      created_at
    }
    business_accounts(order_by: { created_at: asc }) {
      created_at
    }
    business_stores(order_by: { created_at: asc }) {
      created_at
    }
  }
`;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as { id?: string }).id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }

    const data = await hasuraClient.request<{
      Shops: { created_at: string }[];
      Users: { created_at: string }[];
      Restaurants: { created_at: string }[];
      business_accounts: { created_at: string }[];
      business_stores: { created_at: string }[];
    }>(GET_PLATFORM_JOINERS);

    return NextResponse.json({
      shops: data.Shops || [],
      users: data.Users || [],
      restaurants: data.Restaurants || [],
      businesses: data.business_accounts || [],
      stores: data.business_stores || [],
    });
  } catch (error) {
    console.error('Error fetching platform joiners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform joiners' },
      { status: 500 }
    );
  }
}
