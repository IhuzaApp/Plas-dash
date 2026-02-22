import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

// ─── GraphQL operations ───────────────────────────────────────────────────────

const GET_WITHDRAW_REQUEST = gql`
  query GetWithdrawRequest($id: uuid!) {
    withDraweRequest_by_pk(id: $id) {
      id
      amount
      status
      phoneNumber
      shopper_id
      shopperWallet_id
      business_id
      businessWallet_id
    }
  }
`;

const GET_SYSTEM_CONFIG = gql`
  query GetSystemConfig {
    System_configuratioins(limit: 1) {
      withDrawCharges
      currency
    }
  }
`;

const GET_SHOPPER_WALLET = gql`
  query GetShopperWallet($wallet_id: uuid!) {
    Wallets_by_pk(id: $wallet_id) {
      id
      available_balance
      reserved_balance
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

const GET_BUSINESS_WALLET = gql`
  query GetBusinessWallet($business_id: uuid!) {
    business_wallet(where: { business_id: { _eq: $business_id } }, limit: 1) {
      id
      amount
      business_id
    }
  }
`;

const UPDATE_BUSINESS_WALLET = gql`
  mutation UpdateBusinessWallet(
    $amount: String!
    $updated_at: timestamptz!
    $business_id: uuid!
  ) {
    update_business_wallet(
      _set: { amount: $amount, updated_at: $updated_at }
      where: { business_id: { _eq: $business_id } }
    ) {
      affected_rows
    }
  }
`;

const INSERT_REVENUE = gql`
  mutation InsertRevenue(
    $amount: String!
    $type: String!
    $Plasbusiness_id: uuid
    $shopper_id: uuid
    $commission_percentage: String
  ) {
    insert_Revenue(
      objects: {
        amount: $amount
        type: $type
        Plasbusiness_id: $Plasbusiness_id
        shopper_id: $shopper_id
        commission_percentage: $commission_percentage
        businessOrder_Id: null
        restaurant_id: null
      }
    ) {
      affected_rows
    }
  }
`;

const UPDATE_WITHDRAW_STATUS = gql`
  mutation UpdateWithdrawStatus($id: uuid!, $status: String!, $update_at: timestamptz!) {
    update_withDraweRequest_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status, update_at: $update_at }
    ) {
      id
      status
    }
  }
`;

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
    const session = await getServerSession(authOptions as any);
    const userId = (session?.user as { id?: string } | null)?.id;
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

        // ── Rejection is simple: just update the status ──────────────────────────
        if (action === 'rejected') {
            await hasuraClient.request(UPDATE_WITHDRAW_STATUS, {
                id,
                status: 'rejected',
                update_at: new Date().toISOString(),
            });
            return NextResponse.json({ success: true, action: 'rejected' });
        }

        // ── Approval flow ─────────────────────────────────────────────────────────

        // 1. Load the withdraw request
        const reqData = await hasuraClient.request<{
            withDraweRequest_by_pk: {
                id: string;
                amount: string;
                status: string;
                phoneNumber: string;
                shopper_id?: string;
                shopperWallet_id?: string;
                business_id?: string;
                businessWallet_id?: string;
            } | null;
        }>(GET_WITHDRAW_REQUEST, { id });

        const req = reqData.withDraweRequest_by_pk;
        if (!req) {
            return NextResponse.json({ error: 'Withdraw request not found' }, { status: 404 });
        }
        if (req.status !== 'pending') {
            return NextResponse.json({ error: `Request is already ${req.status}` }, { status: 409 });
        }

        const amount = parseFloat(req.amount);
        if (isNaN(amount) || amount <= 0) {
            return NextResponse.json({ error: 'Invalid withdraw amount' }, { status: 400 });
        }

        // 2. Load system config for withDrawCharges
        const configData = await hasuraClient.request<{
            System_configuratioins: { withDrawCharges?: string | number; currency?: string }[];
        }>(GET_SYSTEM_CONFIG);
        const config = configData.System_configuratioins[0] ?? {};
        const withdrawChargesPct = parseFloat(String(config.withDrawCharges ?? '0'));

        const isBusiness = !!req.business_id;

        if (isBusiness) {
            // ── Business withdrawal ────────────────────────────────────────────────
            // Deduct full amount from business wallet, keep withdrawCharges% as revenue, pay out the rest
            const fee = (amount * withdrawChargesPct) / 100;
            const netPayout = amount - fee;

            // Fetch current business wallet balance
            const walletData = await hasuraClient.request<{
                business_wallet: { id: string; amount: string; business_id: string }[];
            }>(GET_BUSINESS_WALLET, { business_id: req.business_id });

            const bWallet = walletData.business_wallet[0];
            if (!bWallet) {
                return NextResponse.json({ error: 'Business wallet not found' }, { status: 404 });
            }

            const currentBalance = parseFloat(bWallet.amount || '0');
            if (currentBalance < amount) {
                return NextResponse.json({ error: 'Insufficient business wallet balance' }, { status: 400 });
            }

            const newBalance = (currentBalance - amount).toFixed(2);

            // Deduct from business wallet
            await hasuraClient.request(UPDATE_BUSINESS_WALLET, {
                amount: newBalance,
                updated_at: new Date().toISOString(),
                business_id: req.business_id,
            });

            // Record revenue for the fee
            if (fee > 0) {
                await hasuraClient.request(INSERT_REVENUE, {
                    amount: fee.toFixed(2),
                    type: 'withdraw_charges',
                    Plasbusiness_id: req.business_id,
                    shopper_id: null,
                    commission_percentage: withdrawChargesPct.toString(),
                });
            }

            // Approve the request
            await hasuraClient.request(UPDATE_WITHDRAW_STATUS, {
                id,
                status: 'approved',
                update_at: new Date().toISOString(),
            });

            return NextResponse.json({
                success: true,
                action: 'approved',
                type: 'business',
                amount,
                fee: fee.toFixed(2),
                netPayout: netPayout.toFixed(2),
                newWalletBalance: newBalance,
            });
        } else {
            // ── Shopper withdrawal ─────────────────────────────────────────────────
            // Deduct full amount from shopper's Wallets (no fee for shoppers)
            const walletId = req.shopperWallet_id;
            if (!walletId) {
                return NextResponse.json({ error: 'Shopper wallet ID missing on request' }, { status: 400 });
            }

            const walletData = await hasuraClient.request<{
                Wallets_by_pk: { id: string; available_balance: string; reserved_balance: string } | null;
            }>(GET_SHOPPER_WALLET, { wallet_id: walletId });

            const sWallet = walletData.Wallets_by_pk;
            if (!sWallet) {
                return NextResponse.json({ error: 'Shopper wallet not found' }, { status: 404 });
            }

            const currentBalance = parseFloat(sWallet.available_balance || '0');
            if (currentBalance < amount) {
                return NextResponse.json({ error: 'Insufficient shopper wallet balance' }, { status: 400 });
            }

            const newBalance = (currentBalance - amount).toFixed(2);

            // Deduct from shopper wallet
            await hasuraClient.request(UPDATE_SHOPPER_WALLET, {
                wallet_id: walletId,
                available_balance: newBalance,
                reserved_balance: sWallet.reserved_balance,
            });

            // Approve the request
            await hasuraClient.request(UPDATE_WITHDRAW_STATUS, {
                id,
                status: 'approved',
                update_at: new Date().toISOString(),
            });

            return NextResponse.json({
                success: true,
                action: 'approved',
                type: 'shopper',
                amount,
                newWalletBalance: newBalance,
            });
        }
    } catch (error: unknown) {
        console.error('Error approving withdraw request:', error);
        return NextResponse.json(
            {
                error: 'Failed to process withdraw request',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
