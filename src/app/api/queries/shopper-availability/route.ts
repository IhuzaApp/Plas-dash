import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

// GetShopperAvailability from Shopper_Availability.graphql
// Optional user_id: return all or filter by user
const GET_SHOPPER_AVAILABILITY = gql`
  query GetShopperAvailability($user_id: uuid) {
    Shopper_Availability(where: { user_id: { _eq: $user_id } }, order_by: { day_of_week: asc }) {
      id
      user_id
      day_of_week
      start_time
      end_time
      is_available
      created_at
      updated_at
    }
  }
`;

const GET_ALL_SHOPPER_AVAILABILITY = gql`
  query GetShopperAvailability {
    Shopper_Availability(order_by: { day_of_week: asc }) {
      id
      user_id
      day_of_week
      start_time
      end_time
      is_available
      created_at
      updated_at
    }
  }
`;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  let userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    const authHeader = request.headers.get('authorization');
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
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const data = user_id
      ? await hasuraClient.request<{ Shopper_Availability: any[] }>(GET_SHOPPER_AVAILABILITY, {
          user_id,
        })
      : await hasuraClient.request<{ Shopper_Availability: any[] }>(GET_ALL_SHOPPER_AVAILABILITY);
    return NextResponse.json({
      Shopper_Availability: data.Shopper_Availability ?? [],
    });
  } catch (error) {
    console.error('Error fetching shopper availability:', error);
    return NextResponse.json({ error: 'Failed to fetch shopper availability' }, { status: 500 });
  }
}
