import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_CURRENT_USER = gql`
  query GetCurrentUser($id: uuid!) {
    Users_by_pk(id: $id) {
      id
      name
      email
      phone
      profile_picture
      created_at
    }
  }
`;

const GET_ORDER_COUNT = gql`
  query GetOrderCount($user_id: uuid!) {
    Orders_aggregate(where: { user_id: { _eq: $user_id } }) {
      aggregate {
        count
      }
    }
  }
`;

const GET_SHOPPER_BY_USER_ID = gql`
  query GetShopperByUserId($user_id: uuid!) {
    shoppers(where: { user_id: { _eq: $user_id } }) {
      id
    }
  }
`;

const GET_SHOPPER_WALLET = gql`
  query GetShopperWallet($shopper_id: uuid!) {
    Wallets(where: { shopper_id: { _eq: $shopper_id } }) {
      id
      available_balance
    }
  }
`;

const CREATE_SHOPPER_WALLET = gql`
  mutation CreateShopperWallet($shopper_id: uuid!) {
    insert_Wallets_one(
      object: { shopper_id: $shopper_id, available_balance: "0", reserved_balance: "0" }
    ) {
      id
      available_balance
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
  const user_id = ((session as any)?.user as { id?: string }).id as string;
  try {
    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }
    const userData = await hasuraClient.request<{ Users_by_pk: any }>(GET_CURRENT_USER, {
      id: user_id,
    });
    const user = userData.Users_by_pk;
    const orderData = await hasuraClient.request<{
      Orders_aggregate: { aggregate: { count: number } };
    }>(GET_ORDER_COUNT, { user_id });
    const orderCount = orderData.Orders_aggregate.aggregate.count;
    let walletBalance = 0;
    try {
      const shopperData = await hasuraClient.request<{
        shoppers: Array<{ id: string }>;
      }>(GET_SHOPPER_BY_USER_ID, { user_id });
      if (shopperData.shoppers?.length > 0) {
        let walletData = await hasuraClient.request<{
          Wallets: Array<{ available_balance: string }>;
        }>(GET_SHOPPER_WALLET, { shopper_id: user_id });
        if (!walletData.Wallets?.length) {
          try {
            const newWallet = await hasuraClient.request<{
              insert_Wallets_one: { available_balance: string };
            }>(CREATE_SHOPPER_WALLET, { shopper_id: user_id });
            if (newWallet.insert_Wallets_one) {
              walletData = { Wallets: [newWallet.insert_Wallets_one] };
            }
          } catch {
            // continue with default balance
          }
        }
        if (walletData.Wallets?.length > 0) {
          walletBalance = parseFloat(walletData.Wallets[0].available_balance || '0');
        }
      }
    } catch {
      walletBalance = 0;
    }
    return NextResponse.json({ user, orderCount, walletBalance });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json({ error: 'Failed to fetch current user info' }, { status: 500 });
  }
}
