import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

// Query to validate referral code
const VALIDATE_REFERRAL_CODE = gql`
  query ValidateReferralCode($referralCode: String!) {
    Referral_window(
      where: {
        referralCode: { _eq: $referralCode }
        status: { _in: ["approved", "active"] }
      }
    ) {
      id
      referralCode
      status
      user_id
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
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { referralCode } = req.body;

    if (!referralCode || typeof referralCode !== "string") {
      return res.status(400).json({ error: "Referral code is required" });
    }

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Validate referral code
    const result = await hasuraClient.request<{
      Referral_window: Array<{
        id: string;
        referralCode: string;
        status: string;
        user_id: string;
      }>;
    }>(VALIDATE_REFERRAL_CODE, {
      referralCode: referralCode.trim().toUpperCase(),
    });

    if (!result.Referral_window || result.Referral_window.length === 0) {
      return res.status(200).json({
        valid: false,
        message: "Invalid referral code",
      });
    }

    const referral = result.Referral_window[0];

    // Check if user is trying to use their own referral code
    if (referral.user_id === session.user.id) {
      return res.status(200).json({
        valid: false,
        message: "You cannot use your own referral code",
      });
    }

    return res.status(200).json({
      valid: true,
      referralId: referral.id,
      referralCode: referral.referralCode,
    });
  } catch (error) {
    console.error("Error validating referral code:", error);
    return res.status(500).json({ error: "Failed to validate referral code" });
  }
}
