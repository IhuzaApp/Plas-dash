import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

// GraphQL mutation to create a wallet
const CREATE_WALLET = gql`
  mutation CreateWallet($shopper_id: uuid!) {
    insert_Wallets_one(
      object: {
        shopper_id: $shopper_id
        available_balance: "0"
        reserved_balance: "0"
      }
    ) {
      id
      shopper_id
      available_balance
      reserved_balance
      last_updated
    }
  }
`;

// GraphQL query to check if wallet exists
const CHECK_WALLET = gql`
  query CheckWallet($shopper_id: uuid!) {
    Wallets(where: { shopper_id: { _eq: $shopper_id } }) {
      id
    }
  }
`;

// Define interface for session user
interface SessionUser {
  user?: {
    id?: string;
  };
}

// Define interface for wallet response
interface WalletResponse {
  insert_Wallets_one: {
    id: string;
    shopper_id: string;
    available_balance: number;
    reserved_balance: number;
    last_updated: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Authenticate the shopper
  const session = (await getServerSession(
    req,
    res,
    authOptions as any
  )) as SessionUser;
  const userId = session?.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Check if wallet already exists
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const checkResult = await hasuraClient.request<{
      Wallets: Array<{ id: string }>;
    }>(CHECK_WALLET, {
      shopper_id: userId,
    });

    // If wallet already exists, return it
    if (checkResult.Wallets && checkResult.Wallets.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Wallet already exists",
        walletId: checkResult.Wallets[0].id,
      });
    }

    // Create new wallet
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const data = await hasuraClient.request<WalletResponse>(CREATE_WALLET, {
      shopper_id: userId,
    });

    return res.status(200).json({
      success: true,
      message: "Wallet created successfully",
      wallet: data.insert_Wallets_one,
    });
  } catch (error) {
    console.error("Error creating wallet:", error);
    return res.status(500).json({ error: "Failed to create wallet" });
  }
}
