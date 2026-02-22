import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

export const dynamic = 'force-dynamic';

const GET_PLASMARKET_BUSINESSES = gql`
  query GetPlasMarketBusinesses {
    business_accounts(
      order_by: { created_at: desc }
    ) {
      account_type
      business_email
      business_location
      business_name
      business_phone
      created_at
      face_image
      id
      id_image
      rdb_certificate
      status
      updated_at
      user_id
      Users {
        created_at
        email
        gender
        name
        phone
        profile_picture
      }
      business_stores {
        id
      }
    }
  }
`;

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        userId = authHeader.substring(7);
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }

    const result = await hasuraClient.request<any>(GET_PLASMARKET_BUSINESSES);

    const formattedBusinesses = (result.business_accounts || []).map((biz: any) => {
      return {
        id: biz.id,
        business_name: biz.business_name || 'Unnamed Business',
        business_email: biz.business_email,
        business_phone: biz.business_phone,
        business_location: biz.business_location,
        status: biz.status || 'in_review',
        created_at: biz.created_at,
        stores_count: biz.business_stores?.length || 0,
        rfqs_count: 0,
        contracts_count: 0,
        orders_count: 0,
        owner: biz.Users ? {
          name: biz.Users.name || 'Unknown',
          email: biz.Users.email,
          phone: biz.Users.phone
        } : null,
      };
    });

    return NextResponse.json({
      success: true,
      businesses: formattedBusinesses,
    });

  } catch (error: any) {
    console.error('Error fetching PlasMarket businesses:', error);
    return NextResponse.json({
      error: 'Failed to fetch PlasMarket businesses',
      message: error.message,
    }, { status: 500 });
  }
}
