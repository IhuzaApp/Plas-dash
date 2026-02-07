import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

// Query to get user's referral code
const GET_REFERRAL_CODE = gql`
  query GetReferralCode($user_id: uuid!) {
    referral_codes(where: { user_id: { _eq: $user_id } }) {
      id
      code
      user_id
      phone_number
      created_at
    }
  }
`;

// Query to get user by ID
const GET_USER = gql`
  query GetUser($user_id: uuid!) {
    Users_by_pk(id: $user_id) {
      id
      phone
      email
    }
  }
`;

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

    const user_id = session.user.id;

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Get user info to check phone number
    const userData = await hasuraClient.request<{
      Users_by_pk: { id: string; phone: string | null; email: string | null };
    }>(GET_USER, { user_id });

    if (!userData.Users_by_pk) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get referral code
    const referralData = await hasuraClient.request<{
      referral_codes: Array<{
        id: string;
        code: string;
        user_id: string;
        phone_number: string;
        created_at: string;
      }>;
    }>(GET_REFERRAL_CODE, { user_id });

    const referralCode = referralData.referral_codes?.[0] || null;

    return res.status(200).json({
      referralCode,
      user: {
        phone: userData.Users_by_pk.phone,
        email: userData.Users_by_pk.email,
      },
    });
  } catch (error) {
    console.error("Error fetching referral code:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch referral code",
    });
  }
}
