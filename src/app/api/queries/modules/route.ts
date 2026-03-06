import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_MODULES = gql`
  query GetModules {
    modules {
      created_at
      group_name
      id
      name
      slug
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
        const data = await hasuraClient.request<{ modules: any[] }>(GET_MODULES);
        return NextResponse.json({ modules: data.modules || [] });
    } catch (error) {
        console.error('Error fetching modules:', error);
        return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 });
    }
}
