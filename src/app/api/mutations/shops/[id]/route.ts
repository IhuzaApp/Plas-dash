import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { getUserContext } from '@/lib/auth-server';

const UPDATE_SHOP = gql`
  mutation UpdateShop($id: uuid!, $set: Shops_set_input!) {
    update_Shops_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
      is_active
    }
  }
`;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getUserContext(req);
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!hasuraClient) throw new Error('Hasura client is not initialized');
    const { id } = await params;
    const body = await req.json();

    const data = await hasuraClient.request(UPDATE_SHOP, {
      id,
      set: body,
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error updating shop:', error);
    return NextResponse.json({ error: 'Failed to update shop' }, { status: 500 });
  }
}
