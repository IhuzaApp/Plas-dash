import { NextApiRequest, NextApiResponse } from "next";
import { GraphQLClient } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

const HASURA_URL = process.env.HASURA_GRAPHQL_URL!;
const HASURA_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;

const hasuraClient = new GraphQLClient(HASURA_URL, {
  headers: { "x-hasura-admin-secret": HASURA_SECRET },
});

interface VerifyResponse {
  paymentCards_by_pk: {
    user_id: string;
  } | null;
}

interface UpdateResponse {
  update_paymentCards_by_pk: {
    id: string;
    number: string;
    name: string;
    expiry_date: string;
    image: string | null;
    created_at: string;
  } | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify user is authenticated
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { variables } = req.body;

    // Verify the card belongs to the user
    const verifyResponse = await hasuraClient.request<VerifyResponse>(
      `
      query VerifyCardOwnership($card_id: uuid!) {
        paymentCards_by_pk(id: $card_id) {
          user_id
        }
      }
    `,
      {
        card_id: variables.card_id,
      }
    );

    if (
      !verifyResponse.paymentCards_by_pk ||
      verifyResponse.paymentCards_by_pk.user_id !== session.user.id
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this card" });
    }

    // Update the payment card
    const response = await hasuraClient.request<UpdateResponse>(
      `
      mutation UpdatePaymentCard(
        $card_id: uuid!,
        $number: String!,
        $name: String!,
        $expiry_date: String!,
        $image: String
      ) {
        update_paymentCards_by_pk(
          pk_columns: { id: $card_id },
          _set: {
            number: $number,
            name: $name,
            expiry_date: $expiry_date,
            image: $image
          }
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
        card_id: variables.card_id,
        number: variables.number,
        name: variables.name,
        expiry_date: variables.expiry_date,
        image: variables.image,
      }
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error updating payment card:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
