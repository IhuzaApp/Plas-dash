import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { getUserContext } from '@/lib/auth-server';

const UPSERT_PLAN = gql`
  mutation UpsertPlan($object: plans_insert_input!) {
    insert_plans_one(
      object: $object
      on_conflict: {
        constraint: plans_pkey
        update_columns: [
          name
          description
          price_monthly
          price_yearly
          ai_request_limit
          reel_limit
        ]
      }
    ) {
      id
      name
      description
      price_monthly
      price_yearly
      ai_request_limit
      reel_limit
    }
  }
`;

const DELETE_PLAN = gql`
  mutation DeletePlan($id: uuid!) {
    delete_plans_by_pk(id: $id) {
      id
    }
  }
`;

export async function POST(req: Request) {
  const context = await getUserContext(req);
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!hasuraClient) throw new Error('Hasura client is not initialized');
    const body = await req.json();
    const data = await hasuraClient.request(UPSERT_PLAN, { object: body });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error upserting plan:', error);
    return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const context = await getUserContext(req);
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!hasuraClient) throw new Error('Hasura client is not initialized');
    const body = await req.json();
    const data = await hasuraClient.request(DELETE_PLAN, { id: body.id });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}
