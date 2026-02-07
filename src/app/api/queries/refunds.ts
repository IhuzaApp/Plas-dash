import { NextApiRequest, NextApiResponse } from "next";
import { GraphQLClient, gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

const HASURA_URL = process.env.HASURA_GRAPHQL_URL!;
const HASURA_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;
const hasuraClient = new GraphQLClient(HASURA_URL, {
  headers: { "x-hasura-admin-secret": HASURA_SECRET },
});

const GET_REFUNDS = gql`
  query GetRefunds($user_id: uuid!) {
    Refunds(where: { user_id: { _eq: $user_id }, status: { _eq: "pending" } }) {
      id
      amount
      status
      created_at
    }
  }
`;

interface RefundResponse {
  Refunds: Array<{
    id: string;
    amount: string;
    status: string;
    created_at: string;
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
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = session.user.id;

    const response = await hasuraClient.request<RefundResponse>(GET_REFUNDS, {
      user_id: userId,
    });

    // Calculate total refund amount
    const totalRefundAmount = response.Refunds.reduce(
      (sum, refund) => sum + parseFloat(refund.amount),
      0
    );

    return res.status(200).json({
      refunds: response.Refunds,
      totalAmount: totalRefundAmount.toString(),
    });
  } catch (error) {
    console.error("Error fetching refunds:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
