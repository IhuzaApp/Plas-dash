import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

// ─── GraphQL operations ───────────────────────────────────────────────────────

const GET_PAYOUT = gql`
  query GetPayout($id: uuid!) {
    payouts_by_pk(id: $id) {
      id
      amount
      status
      wallet_id
      user_id
      Wallets {
        id
        available_balance
        reserved_balance
      }
    }
  }
`;

const UPDATE_SHOPPER_WALLET = gql`
  mutation UpdateShopperWallet(
    $wallet_id: uuid!
    $available_balance: String!
    $reserved_balance: String!
  ) {
    update_Wallets_by_pk(
      pk_columns: { id: $wallet_id }
      _set: {
        available_balance: $available_balance
        reserved_balance: $reserved_balance
        last_updated: "now()"
      }
    ) {
      id
      available_balance
    }
  }
`;

const UPDATE_PAYOUT_STATUS = gql`
  mutation UpdatePayoutStatus($id: uuid!, $status: String!, $updated_on: timestamptz!) {
    update_payouts_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status, updated_on: $updated_on }
    ) {
      id
      status
      updated_on
    }
  }
`;

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const session = await getServerSession(authOptions as any);
  const userId = (session as any)?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasuraClient) {
    return NextResponse.json({ error: 'Database client not initialized' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { id, action } = body; // action: 'approved' | 'rejected'

    if (!id || !action) {
      return NextResponse.json({ error: 'Missing required fields: id, action' }, { status: 400 });
    }

    if (!['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'action must be approved or rejected' }, { status: 400 });
    }

    // ── Rejection: just update status ─────────────────────────────────────────
    if (action === 'rejected') {
      const result = await hasuraClient.request<{
        update_payouts_by_pk: { id: string; status: string } | null;
      }>(UPDATE_PAYOUT_STATUS, {
        id,
        status: 'rejected',
        updated_on: new Date().toISOString(),
      });

      if (!result.update_payouts_by_pk) {
        return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, action: 'rejected' });
    }

    // ── Approval flow ─────────────────────────────────────────────────────────

    // 1. Load the payout with wallet info
    const payoutData = await hasuraClient.request<{
      payouts_by_pk: {
        id: string;
        amount: string;
        status: string;
        wallet_id: string;
        user_id: string;
        Wallets: {
          id: string;
          available_balance: string;
          reserved_balance: string;
        } | null;
      } | null;
    }>(GET_PAYOUT, { id });

    const payout = payoutData.payouts_by_pk;
    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
    }
    if (payout.status !== 'pending') {
      return NextResponse.json({ error: `Payout is already ${payout.status}` }, { status: 409 });
    }

    const amount = parseFloat(payout.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid payout amount' }, { status: 400 });
    }

    // 2. Validate wallet and balance
    const wallet = payout.Wallets;
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found for this payout' }, { status: 404 });
    }

    const currentBalance = parseFloat(wallet.available_balance || '0');
    if (currentBalance < amount) {
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
    }

    const newBalance = (currentBalance - amount).toFixed(2);

    // 3. Deduct from wallet
    await hasuraClient.request(UPDATE_SHOPPER_WALLET, {
      wallet_id: wallet.id,
      available_balance: newBalance,
      reserved_balance: wallet.reserved_balance,
    });

    // 4. Set payout status to approved
    await hasuraClient.request(UPDATE_PAYOUT_STATUS, {
      id,
      status: 'approved',
      updated_on: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      action: 'approved',
      type: 'payout',
      amount,
      newWalletBalance: newBalance,
    });
  } catch (error: unknown) {
    console.error('Error approving payout:', error);
    return NextResponse.json(
      {
        error: 'Failed to process payout',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
