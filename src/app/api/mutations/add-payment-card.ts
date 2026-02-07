import { NextApiRequest, NextApiResponse } from "next";
import { GraphQLClient } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

const HASURA_URL = process.env.HASURA_GRAPHQL_URL!;
const HASURA_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;

const hasuraClient = new GraphQLClient(HASURA_URL, {
  headers: { "x-hasura-admin-secret": HASURA_SECRET },
});

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

    // Verify the user_id matches the authenticated user
    if (variables.user_id !== session.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Execute the mutation
    const response = await hasuraClient.request(
      `
      mutation AddPaymentCard(
        $user_id: uuid!
        $number: String!
        $name: String!
        $expiry_date: String!
        $cvv: String!
        $image: String
      ) {
        insert_paymentCards_one(
          object: {
            user_id: $user_id
            number: $number
            name: $name
            expiry_date: $expiry_date
            CVV: $cvv
            image: $image
          }
        ) {
          id
        }
      }
    `,
      variables
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error adding payment card:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
