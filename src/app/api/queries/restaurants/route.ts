import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { getUserContext } from '@/lib/auth-server';

const GET_RESTAURANTS = gql`
  query GetRestaurants {
    Restaurants(order_by: { name: asc }) {
      id
      name
      email
      phone
      is_active
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
    const data = await hasuraClient.request<{ Restaurants: any[] }>(GET_RESTAURANTS);
    return NextResponse.json({ restaurants: data.Restaurants || [] });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 500 });
  }
}
