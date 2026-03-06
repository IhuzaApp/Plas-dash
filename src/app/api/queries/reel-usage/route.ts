import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_REEL_USAGE = gql`
  query GetReelUsage {
    reel_usage {
      business_id
      id
      month
      restaurant_id
      shop_id
      upload_count
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
        const data = await hasuraClient.request<{ reel_usage: any[] }>(GET_REEL_USAGE);
        return NextResponse.json({ reel_usage: data.reel_usage || [] });
    } catch (error) {
        console.error('Error fetching reel_usage:', error);
        return NextResponse.json({ error: 'Failed to fetch reel_usage' }, { status: 500 });
    }
}
