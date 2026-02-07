import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

// Query to get referral data
const GET_REFERRAL_DATA = gql`
  query GetReferralData($user_id: uuid!) {
    Referral_window(
      where: {
        user_id: { _eq: $user_id }
        status: { _in: ["approved", "active"] }
      }
    ) {
      id
      referralCode
      status
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

    // Get referral data for approved users
    const result = await hasuraClient.request<{
      Referral_window: Array<{
        id: string;
        referralCode: string | null;
        status: string;
        created_at: string;
      }>;
    }>(GET_REFERRAL_DATA, {
      user_id: session.user.id,
    });

    if (!result.Referral_window || result.Referral_window.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No referral data found",
      });
    }

    const referral = result.Referral_window[0];

    // For now, return the referral code
    // TODO: Add queries to get actual referral stats (total referrals, earnings, etc.)
    // when those tables/relationships are set up
    return res.status(200).json({
      success: true,
      referralCode: referral.referralCode,
      // Placeholder for future real data
      // These will be fetched from actual referral tracking tables
      totalReferrals: 0,
      totalEarnings: 0,
      activeReferrals: 0,
      referrals: [],
    });
  } catch (error) {
    console.error("Error fetching referral data:", error);
    return res.status(500).json({ error: "Failed to fetch referral data" });
  }
}
