import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { getUserContext } from '@/lib/auth-server';

const INSERT_SHOP_MODULE = gql`
  mutation InsertShopModule($shop_id: uuid!, $module_id: uuid!) {
    insert_shop_modules_one(
      object: { shop_id: $shop_id, module_id: $module_id }
      on_conflict: { constraint: shop_modules_shop_id_module_id_key, update_columns: [] }
    ) {
      id
      shop_id
      module_id
    }
  }
`;

const DELETE_SHOP_MODULE = gql`
  mutation DeleteShopModule($id: uuid!) {
    delete_shop_modules_by_pk(id: $id) {
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
    const { shop_id, module_id } = body;

    if (!shop_id || !module_id) {
      return NextResponse.json({ error: 'Shop ID and Module ID are required' }, { status: 400 });
    }

    const data = await hasuraClient.request(INSERT_SHOP_MODULE, {
      shop_id,
      module_id,
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error assigning shop module:', error);
    return NextResponse.json({ error: 'Failed to assign module to shop' }, { status: 500 });
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
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const data = await hasuraClient.request(DELETE_SHOP_MODULE, { id });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error removing shop module:', error);
    return NextResponse.json({ error: 'Failed to remove module override' }, { status: 500 });
  }
}
