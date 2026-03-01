import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_RATINGS = gql`
  query GetRatings {
    Ratings(order_by: { created_at: desc }) {
      businessProduct_id
      created_at
      customer_id
      delivery_experience
      id
      order_id
      packaging_quality
      professionalism
      rating
      reel_order_id
      review
      reviewed_at
      shopper_id
      updated_at
      User {
        gender
        email
        phone
        name
      }
      Order {
        OrderID
        Shop {
          address
          description
          image
          logo
          name
          longitude
        }
        delivery_notes
        delivery_fee
        delivery_time
        delivery_photo_url
        discount
        pin
        orderedBy {
          created_at
          email
          gender
          name
          id
          is_active
          phone
          profile_picture
        }
      }
    }
  }
`;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
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
    const data = await hasuraClient.request<{ Ratings: any[] }>(GET_RATINGS);
    return NextResponse.json({ ratings: data.Ratings || [] });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 });
  }
}
