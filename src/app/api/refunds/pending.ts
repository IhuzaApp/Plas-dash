import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { gql } from "graphql-request";
import { hasuraClient } from "../../../src/lib/hasuraClient";

// GraphQL query to get pending refunds
const GET_PENDING_REFUNDS = gql`
  query GetPendingRefunds($user_id: uuid!) {
    Refunds(
      where: {
        user_id: { _eq: $user_id }
        status: { _eq: "pending" }
        paid: { _eq: false }
      }
      order_by: { created_at: desc }
    ) {
      id
      amount
      order_id
      reason
      status
      created_at
      generated_by
      Orders {
        OrderID
        Shop {
          name
        }
      }
    }
  }
`;

// Interface for refund data
interface RefundData {
  Refunds: Array<{
    id: string;
    amount: string;
    order_id: string;
    reason: string;
    status: string;
    created_at: string;
    generated_by: string;
    Orders?: {
      OrderID: string;
      Shop?: {
        name: string;
      };
    };
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user ID from session
    const userId = session.user.id;

    if (!userId) {
      return res.status(400).json({ error: "User ID not found in session" });
    }

    // Check if hasuraClient is available
    if (!hasuraClient) {
      return res.status(500).json({ error: "Database client not available" });
    }

    // Get pending refunds for this user
    const refundResponse = await hasuraClient.request<RefundData>(
      GET_PENDING_REFUNDS,
      {
        user_id: userId,
      }
    );

    const refunds = refundResponse.Refunds || [];

    return res.status(200).json({
      success: true,
      refunds: refunds,
      count: refunds.length,
    });
  } catch (error) {
    console.error("Error fetching pending refunds:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
