import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

// GraphQL query to get refunds and wallet balance
const GET_USER_BALANCES = gql`
  query GetUserBalances($userId: uuid!) {
    Refunds(where: { user_id: { _eq: $userId }, paid: { _eq: false } }) {
      amount
      status
    }
    Wallets(where: { shopper_id: { _eq: $userId } }) {
      available_balance
      reserved_balance
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!hasuraClient) {
      return res
        .status(500)
        .json({ error: "GraphQL client is not initialized" });
    }

    const response = await hasuraClient.request(GET_USER_BALANCES, {
      userId,
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching user balances:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
