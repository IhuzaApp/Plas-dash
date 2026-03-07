import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_AI_USAGE = gql`
  query GetAiUsage {
    ai_usage {
      business_id
      id
      month
      request_count
      restaurant_id
      shop_id
      user_id
      year
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
    const data = await hasuraClient.request<{ ai_usage: any[] }>(GET_AI_USAGE);
    return NextResponse.json({ ai_usage: data.ai_usage || [] });
  } catch (error) {
    console.error('Error fetching ai_usage:', error);
    return NextResponse.json({ error: 'Failed to fetch ai_usage' }, { status: 500 });
  }
}
