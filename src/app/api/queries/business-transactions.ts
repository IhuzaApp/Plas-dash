import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_WALLET_BY_BUSINESS = gql`
  query GetWalletByBusiness($business_id: uuid!) {
    business_wallet(where: { business_id: { _eq: $business_id } }, limit: 1) {
      id
      amount
    }
  }
`;

const GET_TRANSACTIONS_BY_WALLET = gql`
  query GetBusinessTransactionsByWallet($wallet_id: uuid!) {
    businessTransactions(
      where: { wallet_id: { _eq: $wallet_id } }
      order_by: { created_at: desc }
    ) {
      id
      action
      type
      related_order
      status
      description
      created_at
    }
  }
`;

interface SessionUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

interface Session {
  user: SessionUser;
  expires: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as Session | null;

    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { business_id } = req.query as { business_id?: string };
    if (!business_id) {
      return res.status(400).json({ error: "business_id is required" });
    }

    // Verify the user owns this business
    const CHECK_BUSINESS = gql`
      query CheckBusiness($business_id: uuid!, $user_id: uuid!) {
        business_accounts(
          where: { id: { _eq: $business_id }, user_id: { _eq: $user_id } }
          limit: 1
        ) {
          id
        }
      }
    `;
    const check = await hasuraClient.request<{
      business_accounts: Array<{ id: string }>;
    }>(CHECK_BUSINESS, {
      business_id,
      user_id: session.user.id,
    });
    if (!check.business_accounts || check.business_accounts.length === 0) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const walletResult = await hasuraClient.request<{
      business_wallet: Array<{ id: string; amount: string }>;
    }>(GET_WALLET_BY_BUSINESS, { business_id });

    const wallet = walletResult.business_wallet?.[0] ?? null;
    if (!wallet) {
      return res.status(200).json({
        wallet: null,
        transactions: [],
      });
    }

    const txResult = await hasuraClient.request<{
      businessTransactions: Array<{
        id: string;
        action: string;
        type: string;
        related_order: string | null;
        status: string;
        description: string | null;
        created_at: string | null;
      }>;
    }>(GET_TRANSACTIONS_BY_WALLET, { wallet_id: wallet.id });

    const transactions = txResult.businessTransactions ?? [];

    return res.status(200).json({
      wallet: { id: wallet.id, amount: wallet.amount },
      transactions,
    });
  } catch (error: any) {
    console.error("Error fetching business transactions:", error);
    return res.status(500).json({
      error: "Failed to fetch business transactions",
      message: error?.message ?? "Unknown error",
    });
  }
}
