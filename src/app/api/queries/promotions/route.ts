import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_PROMOTIONS = gql`
  query GetPromotions {
    Promotions(order_by: { created_at: desc }) {
      id
      title
      description
      discount_type
      discount_value
      start_date
      end_date
      is_active
      created_at
      updated_at
      code
      max_uses
      current_uses
      min_order_amount
      applicable_to
      shop_id
    }
  }
`;

export async function GET(req: Request) {
    const session = await getServerSession(authOptions as any);
    const userId = (session as any)?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasuraClient) return NextResponse.json({ error: 'DB not initialized' }, { status: 500 });

    try {
        const data = await hasuraClient.request<{ Promotions: unknown[] }>(GET_PROMOTIONS);
        return NextResponse.json({ promotions: data.Promotions ?? [] });
    } catch (error) {
        console.error('Error fetching promotions:', error);
        return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 });
    }
}
