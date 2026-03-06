import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { getUserContext } from '@/lib/auth-server';

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
    const context = await getUserContext(req);
    if (!context) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        if (!hasuraClient) throw new Error('Hasura client is not initialized');
        const data = await hasuraClient.request<{ modules: any[] }>(GET_MODULES);
        return NextResponse.json({ modules: data.modules || [] });
    } catch (error) {
        console.error('Error fetching modules:', error);
        return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 });
    }
}
