import { NextApiRequest, NextApiResponse } from "next";
import { GraphQLClient } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

const HASURA_URL = process.env.HASURA_GRAPHQL_URL!;
const HASURA_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;

const hasuraClient = new GraphQLClient(HASURA_URL, {
  headers: { "x-hasura-admin-secret": HASURA_SECRET },
});

interface PaymentCard {
  id: string;
  number: string;
  name: string;
  expiry_date: string;
  image: string | null;
  created_at: string;
}

interface PaymentCardsResponse {
  paymentCards: PaymentCard[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify user is authenticated
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch payment cards for the user
    const response = await hasuraClient.request<PaymentCardsResponse>(
      `
      query GetPaymentCards($user_id: uuid!) {
        paymentCards(
          where: { user_id: { _eq: $user_id } }
          order_by: { created_at: desc }
        ) {
          id
          number
          name
          expiry_date
          image
          created_at
        }
      }
    `,
      {
        user_id: session.user.id,
      }
    );

    return res.status(200).json({ paymentCards: response.paymentCards });
  } catch (error) {
    console.error("Error fetching payment cards:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
