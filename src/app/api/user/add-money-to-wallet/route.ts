import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { logErrorToSlack } from '@/lib/slackErrorReporter';

const GET_PERSONAL_WALLET = gql`
  query GetPersonalWallet($user_id: uuid!) {
    personalWallet(where: { user_id: { _eq: $user_id } }) {
      id
      balance
      user_id
      created_at
      updated_at
    }
  }
`;

const CREATE_PERSONAL_WALLET = gql`
  mutation CreatePersonalWallet($user_id: uuid!) {
    insert_personalWallet_one(object: { user_id: $user_id, balance: "0" }) {
      id
      balance
      user_id
      created_at
      updated_at
    }
  }
`;

const UPDATE_PERSONAL_WALLET_BALANCE = gql`
  mutation UpdatePersonalWalletBalance($user_id: uuid!, $balance: String!) {
    update_personalWallet_by_pk(
      pk_columns: { user_id: $user_id }
      _set: { balance: $balance, updated_at: "now()" }
    ) {
      id
      balance
      user_id
      updated_at
    }
  }
`;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user_id = session.user.id;
  const body = await request.json();
  const { amount, description } = body;
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }
  try {
    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }
    let walletData = await hasuraClient.request<{
      personalWallet: Array<{
        id: string;
        balance: string;
        user_id: string;
        created_at: string;
        updated_at: string;
      }>;
    }>(GET_PERSONAL_WALLET, { user_id });
    let wallet = walletData.personalWallet?.[0];
    if (!wallet) {
      const newWalletData = await hasuraClient.request<{
        insert_personalWallet_one: {
          id: string;
          balance: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
      }>(CREATE_PERSONAL_WALLET, { user_id });
      wallet = newWalletData.insert_personalWallet_one;
    }
    const currentBalance = parseFloat(wallet.balance || '0');
    const newBalance = currentBalance + amount;
    const newBalanceString = newBalance.toFixed(2);
    const updatedWallet = await hasuraClient.request<{
      update_personalWallet_by_pk: {
        id: string;
        balance: string;
        user_id: string;
        updated_at: string;
      };
    }>(UPDATE_PERSONAL_WALLET_BALANCE, {
      user_id,
      balance: newBalanceString,
    });
    return NextResponse.json({
      success: true,
      wallet: updatedWallet.update_personalWallet_by_pk,
      message: `Successfully added ${amount.toFixed(2)} to your wallet`,
    });
  } catch (error) {
    await logErrorToSlack('user/add-money-to-wallet', error as Error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to add money to wallet',
      },
      { status: 500 }
    );
  }
}
