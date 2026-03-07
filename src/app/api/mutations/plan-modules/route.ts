import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { getUserContext } from '@/lib/auth-server';

const INSERT_PLAN_MODULE = gql`
  mutation InsertPlanModule($plan_id: uuid!, $module_id: uuid!) {
    insert_plan_modules_one(
      object: { plan_id: $plan_id, module_id: $module_id },
      on_conflict: {
        constraint: plan_modules_plan_id_module_id_key,
        update_columns: []
      }
    ) {
      id
      plan_id
      module_id
    }
  }
`;

const DELETE_PLAN_MODULE = gql`
  mutation DeletePlanModule($plan_id: uuid!, $module_id: uuid!) {
    delete_plan_modules(
      where: { plan_id: { _eq: $plan_id }, module_id: { _eq: $module_id } }
    ) {
      affected_rows
    }
  }
`;

const BATCH_UPDATE_PLAN_MODULES = gql`
  mutation BatchUpdatePlanModules($plan_id: uuid!, $objects: [plan_modules_insert_input!]!) {
    delete_plan_modules(where: { plan_id: { _eq: $plan_id } }) {
      affected_rows
    }
    insert_plan_modules(objects: $objects) {
      affected_rows
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
    const data = await hasuraClient.request(INSERT_PLAN_MODULE, {
      plan_id: body.plan_id,
      module_id: body.module_id,
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error assigning plan module:', error);
    return NextResponse.json({ error: 'Failed to assign module to plan' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const context = await getUserContext(req);
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!hasuraClient) throw new Error('Hasura client is not initialized');
    const body = await req.json();
    const { plan_id, module_ids } = body;

    if (!plan_id || !Array.isArray(module_ids)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const objects = module_ids.map((modId: string) => ({
      plan_id,
      module_id: modId,
    }));

    const data = await hasuraClient.request(BATCH_UPDATE_PLAN_MODULES, {
      plan_id,
      objects,
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error batch updating plan modules:', error);
    return NextResponse.json({ error: 'Failed to update plan modules' }, { status: 500 });
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
    const data = await hasuraClient.request(DELETE_PLAN_MODULE, {
      plan_id: body.plan_id,
      module_id: body.module_id,
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error removing plan module:', error);
    return NextResponse.json({ error: 'Failed to remove module from plan' }, { status: 500 });
  }
}
