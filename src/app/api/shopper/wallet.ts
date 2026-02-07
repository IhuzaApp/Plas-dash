import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { gql } from "graphql-request";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { logErrorToSlack } from "../../../src/lib/slackErrorReporter";

// GraphQL query to get wallet information
const GET_WALLET_BY_SHOPPER_ID = gql`
  query GetWalletByShopperId($shopper_id: uuid!) {
    Wallets(where: { shopper_id: { _eq: $shopper_id } }) {
      id
      available_balance
      reserved_balance
      shopper_id
    }
  }
`;

// Type definition for wallet data
interface WalletData {
  Wallets: Array<{
    id: string;
    available_balance: string;
    reserved_balance: string;
    shopper_id: string;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET method
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { shopperId } = req.query;

    // Validate required fields
    if (!shopperId) {
      return res
        .status(400)
        .json({ error: "Missing required field: shopperId" });
    }

    // Verify the authenticated user matches the shopperId
    if (session.user.id !== shopperId) {
      return res
        .status(403)
        .json({ error: "Not authorized to access this wallet" });
    }

    // Check if hasuraClient is available (it should be on server side)
    if (!hasuraClient) {
      return res.status(500).json({ error: "Database client not available" });
    }

    // Get wallet information
    const walletResponse = await hasuraClient.request<WalletData>(
      GET_WALLET_BY_SHOPPER_ID,
      {
        shopper_id: shopperId,
      }
    );

    if (!walletResponse.Wallets || walletResponse.Wallets.length === 0) {
      return res
        .status(404)
        .json({ error: "Wallet not found for this shopper" });
    }

    const wallet = walletResponse.Wallets[0];

    return res.status(200).json({
      success: true,
      wallet: wallet,
    });
  } catch (error) {
    await logErrorToSlack("shopper/wallet", error, {
      shopperId: req.query.shopperId,
    });
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
