import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import crypto from "crypto";

// Query to check if phone number already has a referral code
const CHECK_PHONE_REFERRAL = gql`
  query CheckPhoneReferral($phone_number: String!) {
    referral_codes(where: { phone_number: { _eq: $phone_number } }) {
      id
      code
      user_id
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

// Mutation to create referral code
const CREATE_REFERRAL_CODE = gql`
  mutation CreateReferralCode($referral_code: referral_codes_insert_input!) {
    insert_referral_codes_one(object: $referral_code) {
      id
      code
      user_id
      phone_number
      created_at
    }
  }
`;

// Generate unique referral code
function generateReferralCode(userId: string, phone: string): string {
  // Create a hash from user ID and phone
  const hash = crypto
    .createHash("sha256")
    .update(`${userId}-${phone}-${Date.now()}`)
    .digest("hex");

  // Take first 8 characters and convert to uppercase
  const code = hash.substring(0, 8).toUpperCase();

  // Add a prefix to make it more recognizable
  return `REF${code}`;
}

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

    const user_id = session.user.id;

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Get user info
    const userData = await hasuraClient.request<{
      Users_by_pk: { id: string; phone: string | null; email: string | null };
    }>(GET_USER, { user_id });

    if (!userData.Users_by_pk) {
      return res.status(404).json({ error: "User not found" });
    }

    const phone = userData.Users_by_pk.phone;
    if (!phone) {
      return res.status(400).json({
        error: "Phone number is required to create a referral code",
      });
    }

    // SECURITY CHECK: Check if this phone number already has a referral code
    const existingCode = await hasuraClient.request<{
      referral_codes: Array<{
        id: string;
        code: string;
        user_id: string;
      }>;
    }>(CHECK_PHONE_REFERRAL, { phone_number: phone });

    if (existingCode.referral_codes && existingCode.referral_codes.length > 0) {
      return res.status(400).json({
        error:
          "A referral code already exists for this phone number. Each phone number can only have one referral code.",
        existingCode: existingCode.referral_codes[0].code,
      });
    }

    // Check if user already has a referral code (by user_id)
    const userCodeCheck = await hasuraClient.request<{
      referral_codes: Array<{ id: string; code: string }>;
    }>(
      gql`
        query CheckUserReferral($user_id: uuid!) {
          referral_codes(where: { user_id: { _eq: $user_id } }) {
            id
            code
          }
        }
      `,
      { user_id }
    );

    if (
      userCodeCheck.referral_codes &&
      userCodeCheck.referral_codes.length > 0
    ) {
      return res.status(200).json({
        referralCode: userCodeCheck.referral_codes[0],
        message: "Referral code already exists",
      });
    }

    // Generate unique referral code
    let code = generateReferralCode(user_id, phone);
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure code is unique
    while (attempts < maxAttempts) {
      const codeCheck = await hasuraClient.request<{
        referral_codes: Array<{ id: string }>;
      }>(
        gql`
          query CheckCodeExists($code: String!) {
            referral_codes(where: { code: { _eq: $code } }) {
              id
            }
          }
        `,
        { code }
      );

      if (!codeCheck.referral_codes || codeCheck.referral_codes.length === 0) {
        break; // Code is unique
      }

      // Regenerate if code exists
      code = generateReferralCode(user_id, phone + attempts);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return res.status(500).json({
        error: "Failed to generate unique referral code. Please try again.",
      });
    }

    // Create referral code
    const result = await hasuraClient.request<{
      insert_referral_codes_one: {
        id: string;
        code: string;
        user_id: string;
        phone_number: string;
        created_at: string;
      };
    }>(CREATE_REFERRAL_CODE, {
      referral_code: {
        code,
        user_id,
        phone_number: phone,
      },
    });

    return res.status(200).json({
      success: true,
      referralCode: result.insert_referral_codes_one,
      message: "Referral code created successfully",
    });
  } catch (error) {
    console.error("Error creating referral code:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to create referral code",
    });
  }
}
