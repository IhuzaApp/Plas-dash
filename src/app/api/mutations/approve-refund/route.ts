import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_REFUND_AND_WALLET = gql`
  query GetRefundAndWallet($refund_id: uuid!, $user_id: uuid!) {
    Refunds_by_pk(id: $refund_id) {
      id
      amount
      user_id
      status
    }
    personalWallet(where: {user_id: {_eq: $user_id}}) {
      id
      balance
    }
  }
`;

const APPROVE_REFUND_AND_UPDATE_WALLET = gql`
  mutation ApproveRefundAndUpdateWallet(
    $refund_id: uuid!,
    $wallet_id: uuid!,
    $new_balance: String!,
    $transaction_amount: String!,
    $transaction_action: String!,
    $transaction_status: String!,
    $updated_at: timestamptz!,
    $update_on: timestamptz!,
    $doneBy: uuid!,
    $received_wallet: uuid!
  ) {
    update_Refunds_by_pk(
      pk_columns: { id: $refund_id },
      _set: { status: "approved", paid: true, update_on: $update_on }
    ) {
      id
    }
    update_personalWallet(
      where: {id: {_eq: $wallet_id}},
      _set: {balance: $new_balance, updated_at: $updated_at}
    ) {
      affected_rows
    }
    insert_personalWalletTransactions(objects: {
      action: $transaction_action,
      amount: $transaction_amount,
      status: $transaction_status,
      wallet_id: $wallet_id,
      received_wallet: $received_wallet,
      doneBy: $doneBy
    }) {
      affected_rows
    }
  }
`;


export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  let userIdFromAuth = (session?.user as { id?: string } | undefined)?.id;

  if (!userIdFromAuth) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      userIdFromAuth = authHeader.substring(7);
    }
  }

  if (!userIdFromAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }


  try {
    const { refund_id, user_id } = await req.json();

    if (!refund_id || !user_id) {
      return NextResponse.json({ error: 'Missing refund_id or user_id' }, { status: 400 });
    }

    if (!hasuraClient) {
      throw new Error('Hasura client is not initialized');
    }

    // 1. Fetch refund and wallet details
    const { Refunds_by_pk: refund, personalWallet } = await hasuraClient.request<{
      Refunds_by_pk: any;
      personalWallet: any[];
    }>(GET_REFUND_AND_WALLET, { refund_id, user_id });

    if (!refund) {
      return NextResponse.json({ error: 'Refund not found' }, { status: 404 });
    }

    if (refund.status === 'approved') {
      return NextResponse.json({ error: 'Refund already approved' }, { status: 400 });
    }

    if (personalWallet.length === 0) {
      return NextResponse.json({ error: 'Personal wallet not found for user' }, { status: 404 });
    }

    const wallet = personalWallet[0];
    const currentBalance = parseFloat(wallet.balance || '0');
    const refundAmount = parseFloat(refund.amount || '0');
    const newBalance = (currentBalance + refundAmount).toString();

    const now = new Date().toISOString();

    // 2. Perform updates in a single mutation
    // For Hasura, multiple mutations in one string are executed in a transaction.
    await hasuraClient.request(APPROVE_REFUND_AND_UPDATE_WALLET, {
      refund_id,
      wallet_id: wallet.id,
      new_balance: newBalance,
      transaction_amount: refund.amount,
      transaction_action: 'Refund Credit',
      transaction_status: 'completed',
      updated_at: now,
      update_on: now,
      // Use the shopper's user_id for doneBy to satisfy the FK constraint to the Users table.
      // Admin IDs (Org Employees) might not exist in the Users table.
      doneBy: refund.user_id,
      received_wallet: wallet.id,
    });



    return NextResponse.json({ success: true, newBalance });
  } catch (error) {
    console.error('Error approving refund:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to approve refund' },
      { status: 500 }
    );
  }
}
