import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_PLANS = gql`
  query GetPlans {
    plans {
      ai_request_limit
      created_at
      description
      id
      name
      price_monthly
      price_yearly
      reel_limit
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
        const data = await hasuraClient.request<{ plans: any[] }>(GET_PLANS);
        return NextResponse.json({ plans: data.plans || [] });
    } catch (error) {
        console.error('Error fetching plans:', error);
        return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }
}
