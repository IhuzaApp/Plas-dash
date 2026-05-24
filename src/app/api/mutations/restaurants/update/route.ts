import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { getUserContext } from '@/lib/auth-server';

export async function POST(req: Request) {
  const context = await getUserContext(req);
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!hasuraClient) throw new Error('Hasura client is not initialized');
    const { id, ...updates } = await req.json();

    const UPDATE_RESTAURANT = gql`
      mutation UpdateRestaurant($id: uuid!, $set: Restaurants_set_input!) {
        update_Restaurants_by_pk(pk_columns: { id: $id }, _set: $set) {
          id
          name
        }
      }
    `;

    const result = await hasuraClient.request(UPDATE_RESTAURANT, {
      id,
      set: updates,
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error updating restaurant:', error);
    return NextResponse.json({ error: 'Failed to update restaurant' }, { status: 500 });
  }
}
