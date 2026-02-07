import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

// Query to check for duplicates
const CHECK_DUPLICATE_REFERRAL = gql`
  query CheckDuplicateReferral(
    $user_id: uuid!
    $phone: String!
    $email: String!
    $deviceFingerprint: String!
  ) {
    Referral_window(
      where: {
        _or: [
          { user_id: { _eq: $user_id } }
          { phone: { _eq: $phone } }
          { deviceFingerprint: { _eq: $deviceFingerprint } }
          { email: { _eq: $email, _is_null: false } }
        ]
      }
    ) {
      id
      user_id
      phone
      email
      deviceFingerprint
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

    const { phone, email, deviceFingerprint } = req.body;

    if (!phone || !deviceFingerprint) {
      return res
        .status(400)
        .json({ error: "Phone and device fingerprint are required" });
    }

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Check for duplicates in database
    const duplicateCheck = await hasuraClient.request<{
      Referral_window: Array<{
        id: string;
        user_id: string;
        phone: string;
        email: string | null;
        deviceFingerprint: string;
      }>;
    }>(CHECK_DUPLICATE_REFERRAL, {
      user_id: session.user.id,
      phone: phone,
      email: email || "",
      deviceFingerprint: deviceFingerprint,
    });

    if (
      duplicateCheck.Referral_window &&
      duplicateCheck.Referral_window.length > 0
    ) {
      const duplicate = duplicateCheck.Referral_window[0];

      if (duplicate.user_id === session.user.id) {
        return res.status(200).json({
          isDuplicate: true,
          reason: "You already have a referral account",
        });
      }

      if (duplicate.phone === phone) {
        return res.status(200).json({
          isDuplicate: true,
          reason: "Phone number already registered for referral program",
        });
      }

      if (email && duplicate.email === email) {
        return res.status(200).json({
          isDuplicate: true,
          reason: "Email already registered for referral program",
        });
      }

      if (duplicate.deviceFingerprint === deviceFingerprint) {
        return res.status(200).json({
          isDuplicate: true,
          reason: "This device already has a referral account",
        });
      }
    }

    return res.status(200).json({
      isDuplicate: false,
      needsReview: false,
    });
  } catch (error) {
    console.error("Error checking duplicate:", error);
    return res.status(500).json({ error: "Failed to check duplicates" });
  }
}
