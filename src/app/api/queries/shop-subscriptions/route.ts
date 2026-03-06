import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_SHOP_SUBSCRIPTIONS = gql`
  query GetShopSubscriptions {
    shop_subscriptions {
      billing_cycle
      business_id
      created_at
      end_date
      id
      plan_id
      restaurant_id
      shop_id
      start_date
      status
      updated_at
      plan {
        name
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

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        if (!hasuraClient) {
            throw new Error('Hasura client is not initialized');
        }
        const data = await hasuraClient.request<{ shop_subscriptions: any[] }>(GET_SHOP_SUBSCRIPTIONS);
        return NextResponse.json({ shop_subscriptions: data.shop_subscriptions || [] });
    } catch (error) {
        console.error('Error fetching shop_subscriptions:', error);
        return NextResponse.json({ error: 'Failed to fetch shop_subscriptions' }, { status: 500 });
    }
}
