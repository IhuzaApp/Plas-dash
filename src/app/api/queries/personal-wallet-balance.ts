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

const GET_PERSONAL_WALLET = gql`
  query GetPersonalWallet($user_id: uuid!) {
    personalWallet(where: { user_id: { _eq: $user_id } }) {
      id
      balance
      user_id
      created_at
      updated_at
    }
  }
`;

interface PersonalWalletResponse {
  personalWallet: Array<{
    id: string;
    balance: string;
    user_id: string;
    created_at: string;
    updated_at: string;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let userId: string | null = null;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user_id = session.user.id;
    userId = user_id;

    const response = await hasuraClient.request<PersonalWalletResponse>(
      GET_PERSONAL_WALLET,
      {
        user_id,
      }
    );

    const wallet = response.personalWallet?.[0] || null;

    return res.status(200).json({ wallet });
  } catch (error) {
    console.error("Error fetching personal wallet balance:", error);
    await logErrorToSlack("PersonalWalletBalanceAPI", error, {
      userId,
      method: req.method,
    });
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
