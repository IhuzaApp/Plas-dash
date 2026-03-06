import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const INSERT_PLAN = gql`
  mutation InsertPlan($object: plans_insert_input!) {
    insert_plans_one(object: $object) {
      id
    }
  }
`;

export async function POST(req: Request) {
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
        const body = await req.json();
        const data = await hasuraClient.request(INSERT_PLAN, { object: body });
        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error mutating plans:', error);
        return NextResponse.json({ error: 'Failed to mutate plans' }, { status: 500 });
    }
}
