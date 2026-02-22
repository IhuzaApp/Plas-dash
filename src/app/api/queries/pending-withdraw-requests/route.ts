import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_ALL_PENDING_WITHDRAW_REQUESTS = gql`
  query GetAllPendingWithdrawRequests {
    withDraweRequest(
      where: { status: { _eq: "pending" } }
      order_by: { created_at: desc }
    ) {
      amount
      businessWallet_id
      business_id
      created_at
      id
      phoneNumber
      shopperWallet_id
      shopper_id
      status
      update_at
      verification_image
      shoppers {
        full_name
        phone_number
        profile_photo
        User {
          Wallets {
            available_balance
            id
            reserved_balance
          }
        }
      }
      business_wallets {
        amount
        business_id
        created_at
        id
        query_id
        updated_at
      }
      business_accounts {
        account_type
        business_email
        business_location
        business_name
        business_phone
        face_image
        id
        status
      }
    }
  }
`;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions as any);
  let userId = (session as any)?.user?.id;

  if (!userId) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      userId = authHeader.substring(7);
    }
  }

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasuraClient) return NextResponse.json({ error: 'DB not initialized' }, { status: 500 });

  try {
    const data = await hasuraClient.request<{ withDraweRequest: unknown[] }>(
      GET_ALL_PENDING_WITHDRAW_REQUESTS
    );
    return NextResponse.json({ requests: data.withDraweRequest ?? [] });
  } catch (error) {
    console.error('Error fetching withdraw requests:', error);
    return NextResponse.json({ error: 'Failed to fetch withdraw requests' }, { status: 500 });
  }
}
