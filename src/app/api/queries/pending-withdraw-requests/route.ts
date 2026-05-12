import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_ALL_PENDING_WITHDRAW_REQUESTS = gql`
  query GetAllPendingWithdrawRequests {
    withDraweRequest(where: { status: { _eq: "pending" } }, order_by: { created_at: desc }) {
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
      }
      Wallets {
        available_balance
        id
        reserved_balance
        shoppers {
          full_name
          phone_number
          profile_photo
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
    const data = await hasuraClient.request<{ withDraweRequest: any[] }>(
      GET_ALL_PENDING_WITHDRAW_REQUESTS
    );

    // Map plural/singular relationships to a consistent format
    const mappedRequests = (data.withDraweRequest ?? []).map(req => {
      const rawShoppers = req.shopper || req.shoppers;
      const shopper = Array.isArray(rawShoppers) ? rawShoppers[0] : rawShoppers;
      
      const rawWallets = req.Wallet || req.Wallets;
      const wallet = Array.isArray(rawWallets) ? rawWallets[0] : rawWallets;
      
      const walletShoppers = wallet?.shopper || wallet?.shoppers;
      const finalShopper = shopper || (Array.isArray(walletShoppers) ? walletShoppers[0] : walletShoppers);

      const businessAccount = Array.isArray(req.business_accounts) ? req.business_accounts[0] : req.business_accounts;
      const businessWallet = Array.isArray(req.business_wallets) ? req.business_wallets[0] : req.business_wallets;

      return {
        ...req,
        shoppers: finalShopper || null,
        Wallets: wallet || null,
        business_accounts: businessAccount || null,
        business_wallets: businessWallet || null
      };
    });

    return NextResponse.json({ requests: mappedRequests });
  } catch (error) {
    console.error('Error fetching withdraw requests:', error);
    return NextResponse.json({ error: 'Failed to fetch withdraw requests' }, { status: 500 });
  }
}
