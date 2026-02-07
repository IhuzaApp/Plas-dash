import { NextApiRequest, NextApiResponse } from "next";
import { GraphQLClient, gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { logErrorToSlack } from "../../../src/lib/slackErrorReporter";

const HASURA_URL = process.env.HASURA_GRAPHQL_URL!;
const HASURA_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;
const hasuraClient = new GraphQLClient(HASURA_URL, {
  headers: { "x-hasura-admin-secret": HASURA_SECRET },
});

const GET_WALLET_BALANCE = gql`
  query GetWalletBalance($shopper_id: uuid!) {
    Wallets(where: { shopper_id: { _eq: $shopper_id } }) {
      id
      available_balance
      reserved_balance
      last_updated
    }
  }
`;

// Find shopper by user ID
const GET_SHOPPER_BY_USER_ID = gql`
  query GetShopperByUserId($user_id: uuid!) {
    shoppers(where: { user_id: { _eq: $user_id }, active: { _eq: true } }) {
      id
    }
  }
`;

interface WalletResponse {
  Wallets: Array<{
    id: string;
    available_balance: string;
    reserved_balance: string;
    last_updated: string;
  }>;
}

interface ShopperResponse {
  shoppers: Array<{
    id: string;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let shopper_id: string;

    if (req.method === "GET") {
      // Check for shopper_id in query parameters
      const { shopper_id: query_shopper_id } = req.query;

      if (query_shopper_id) {
        // If shopper_id is provided in query, use it
        shopper_id = query_shopper_id as string;
      } else {
        // Otherwise, use the authenticated user from the session
        const session = await getServerSession(req, res, authOptions);
        if (!session?.user?.id) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        // Find the shopper ID for this user
        const shopperData = await hasuraClient.request<ShopperResponse>(
          GET_SHOPPER_BY_USER_ID,
          {
            user_id: session.user.id,
          }
        );

        if (shopperData.shoppers.length === 0) {
          return res.status(200).json({ wallet: null, error: "Not a shopper" });
        }

        shopper_id = shopperData.shoppers[0].id;
      }
    } else {
      // For POST, use the shopper_id from request body
      const { shopper_id: id } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Shopper ID is required" });
      }
      shopper_id = id;
    }

    const response = await hasuraClient.request<WalletResponse>(
      GET_WALLET_BALANCE,
      {
        shopper_id,
      }
    );

    const wallet = response.Wallets?.[0] || null;

    return res.status(200).json({ wallet });
  } catch (error) {
    await logErrorToSlack("queries/wallet-balance", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
