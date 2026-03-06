import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_PLAN_MODULES = gql`
  query GetPlanModules($plan_id: uuid) {
    plan_modules(where: { plan_id: { _eq: $plan_id } }) {
      id
      module_id
      plan_id
    }
  }
`;

const GET_ALL_PLAN_MODULES = gql`
  query GetAllPlanModules {
    plan_modules {
      id
      module_id
      plan_id
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
        const { searchParams } = new URL(req.url);
        const planId = searchParams.get('plan_id');

        let data;
        if (planId) {
            data = await hasuraClient.request<{ plan_modules: any[] }>(GET_PLAN_MODULES, { plan_id: planId });
        } else {
            data = await hasuraClient.request<{ plan_modules: any[] }>(GET_ALL_PLAN_MODULES);
        }

        return NextResponse.json({ plan_modules: data.plan_modules || [] });
    } catch (error) {
        console.error('Error fetching plan_modules:', error);
        return NextResponse.json({ error: 'Failed to fetch plan_modules' }, { status: 500 });
    }
}
