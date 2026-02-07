import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

// Query to check referral status
const GET_REFERRAL_STATUS = gql`
  query GetReferralStatus($user_id: uuid!) {
    Referral_window(where: { user_id: { _eq: $user_id } }) {
      id
      status
      referralCode
      created_at
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

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Find user's registration
    const result = await hasuraClient.request<{
      Referral_window: Array<{
        id: string;
        status: string;
        referralCode: string | null;
        created_at: string;
      }>;
    }>(GET_REFERRAL_STATUS, {
      user_id: session.user.id,
    });

    if (!result.Referral_window || result.Referral_window.length === 0) {
      return res.status(200).json({
        registered: false,
        approved: false,
      });
    }

    const registration = result.Referral_window[0];

    // Treat "active" or "approved" status as approved
    const isApproved =
      registration.status === "approved" || registration.status === "active";

    return res.status(200).json({
      registered: true,
      approved: isApproved,
      status: registration.status,
      referralCode: registration.referralCode,
    });
  } catch (error) {
    console.error("Error checking referral status:", error);
    return res.status(500).json({ error: "Failed to check status" });
  }
}
