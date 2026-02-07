import type { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { logErrorToSlack } from "../../../src/lib/slackErrorReporter";

// GraphQL query to get wallet and transaction information
const GET_WALLET_AND_TRANSACTIONS = gql`
  query GetWalletAndTransactions($shopper_id: uuid!) {
    # Get wallet information
    Wallets(where: { shopper_id: { _eq: $shopper_id } }) {
      id
      available_balance
      reserved_balance
      shopper_id
    }

    # Get wallet transactions
    Wallet_Transactions(
      where: { Wallet: { shopper_id: { _eq: $shopper_id } } }
      order_by: { created_at: desc }
    ) {
      id
      amount
      type
      status
      description
      created_at
      related_order_id
      wallet_id
      Order {
        OrderID
      }
    }
  }
`;

interface Wallet {
  id: string;
  available_balance: string;
  reserved_balance: string;
  shopper_id: string;
}

interface WalletTransaction {
  id: string;
  amount: string;
  type: string;
  status: string;
  description: string | null;
  created_at: string;
  related_order_id: string | null;
  wallet_id: string;
  Order: {
    OrderID: number | null;
  } | null;
}

interface GraphQLResponse {
  Wallets: Wallet[];
  Wallet_Transactions: WalletTransaction[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Get session to identify the shopper
  const session = await getServerSession(req, res, authOptions as any);
  const userId = (session as any)?.user?.id;

  if (!userId) {
    return res
      .status(401)
      .json({ error: "You must be logged in as a shopper" });
  }

  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const data = await hasuraClient.request<GraphQLResponse>(
      GET_WALLET_AND_TRANSACTIONS,
      {
        shopper_id: userId,
      }
    );

    // Format wallet data
    const wallet =
      data.Wallets.length > 0
        ? {
            id: data.Wallets[0].id,
            availableBalance: parseFloat(
              data.Wallets[0].available_balance || "0"
            ),
            reservedBalance: parseFloat(
              data.Wallets[0].reserved_balance || "0"
            ),
          }
        : null;

    // Format transaction history
    const transactions = data.Wallet_Transactions.map((tx) => ({
      id: tx.id,
      amount: parseFloat(tx.amount || "0"),
      type: tx.type,
      status: tx.status,
      description: tx.description || "",
      date: new Date(tx.created_at).toLocaleDateString(),
      time: new Date(tx.created_at).toLocaleTimeString(),
      orderId: tx.related_order_id,
      orderNumber: tx.Order?.OrderID || null,
    }));

    return res.status(200).json({
      success: true,
      wallet,
      transactions,
    });
  } catch (error) {
    await logErrorToSlack("shopper/walletHistory", error, {
      userId,
    });
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to fetch wallet data",
    });
  }
}
