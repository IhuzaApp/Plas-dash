import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { getUserContext } from '@/lib/auth-server';

const UPSERT_MODULE = gql`
  mutation UpsertModule($object: modules_insert_input!) {
    insert_modules_one(
      object: $object
      on_conflict: { constraint: modules_pkey, update_columns: [name, slug, group_name] }
    ) {
      id
      name
      slug
      group_name
    }
  }
`;

const DELETE_MODULE = gql`
  mutation DeleteModule($id: uuid!) {
    delete_modules_by_pk(id: $id) {
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
    const data = await hasuraClient.request(UPSERT_MODULE, { object: body });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error upserting module:', error);
    return NextResponse.json({ error: 'Failed to save module' }, { status: 500 });
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
    const data = await hasuraClient.request(DELETE_MODULE, { id: body.id });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error deleting module:', error);
    return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 });
  }
}
