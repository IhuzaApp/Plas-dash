import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const INSERT_PLAN_MODULES = gql`
  mutation InsertPlanModules($object: plan_modules_insert_input!) {
    insert_plan_modules_one(object: $object) {
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
        const data = await hasuraClient.request(INSERT_PLAN_MODULES, { object: body });
        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error mutating plan_modules:', error);
        return NextResponse.json({ error: 'Failed to mutate plan_modules' }, { status: 500 });
    }
}

const DELETE_PLAN_MODULES = gql`
  mutation DeletePlanModules($plan_id: uuid!, $module_id: uuid!) {
    delete_plan_modules(where: { plan_id: { _eq: $plan_id }, module_id: { _eq: $module_id } }) {
      affected_rows
    }
  }
`;

export async function DELETE(req: Request) {
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
        const data = await hasuraClient.request(DELETE_PLAN_MODULES, {
            plan_id: body.plan_id,
            module_id: body.module_id
        });
        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error deleting plan_modules:', error);
        return NextResponse.json({ error: 'Failed to delete plan_modules' }, { status: 500 });
    }
}

