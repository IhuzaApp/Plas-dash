import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

// GraphQL mutation to insert referral registration
const INSERT_REFERRAL_WINDOW = gql`
  mutation InsertReferralWindow(
    $user_id: uuid!
    $status: String!
    $referralCode: String!
    $phone: String!
    $phoneVerified: Boolean!
    $name: String!
    $email: String!
    $deviceFingerprint: String!
  ) {
    insert_Referral_window(
      objects: {
        user_id: $user_id
        status: $status
        referralCode: $referralCode
        phone: $phone
        phoneVerified: $phoneVerified
        name: $name
        email: $email
        deviceFingerprint: $deviceFingerprint
      }
    ) {
      affected_rows
    }
  }
`;

// Query to check for duplicates
const CHECK_DUPLICATE_REFERRAL = gql`
  query CheckDuplicateReferral(
    $user_id: uuid!
    $phone: String!
    $deviceFingerprint: String!
  ) {
    Referral_window(
      where: {
        _or: [
          { user_id: { _eq: $user_id } }
          { phone: { _eq: $phone } }
          { deviceFingerprint: { _eq: $deviceFingerprint } }
        ]
      }
    ) {
      id
      user_id
      phone
      deviceFingerprint
    }
  }
`;

// Query to check if referral code exists
const CHECK_REFERRAL_CODE = gql`
  query CheckReferralCode($referralCode: String!) {
    Referral_window(where: { referralCode: { _eq: $referralCode } }) {
      id
      referralCode
    }
  }
`;

/**
 * Generate a memorable, pronounceable referral code based on user's name
 * Format: [FirstInitial][LastInitial][PronounceableSyllable]R
 * Example: "Tony James" -> "TJABOR", "David Olin" -> "DOKALR"
 *
 * Uses consonant-vowel patterns to make it easy to remember and speak
 */
function generateReferralCodeFromName(name: string): string {
  // Split name into parts
  const nameParts = name.trim().split(/\s+/);

  // Get first letter of first name
  const firstInitial = nameParts[0]?.[0]?.toUpperCase() || "U";

  // Get first letter of last name (or second part if exists)
  let lastInitial = "U";
  if (nameParts.length > 1) {
    lastInitial = nameParts[nameParts.length - 1][0]?.toUpperCase() || "U";
  } else if (nameParts[0]?.[1]) {
    // If only one name part, use second character
    lastInitial = nameParts[0][1]?.toUpperCase() || "U";
  }

  // Generate pronounceable syllable (2-3 letters)
  // Pattern: Consonant-Vowel-Consonant (CVC) or Consonant-Vowel (CV)
  const consonants = "BCDFGHJKLMNPQSTVWXYZ"; // Removed R to avoid double R
  const vowels = "AEIOU";

  // Generate 2-3 letter pronounceable syllable
  const syllableLength = Math.floor(Math.random() * 2) + 2; // 2 or 3 characters
  let syllable = "";

  for (let i = 0; i < syllableLength; i++) {
    if (i % 2 === 0) {
      // Even positions: consonants
      syllable += consonants.charAt(
        Math.floor(Math.random() * consonants.length)
      );
    } else {
      // Odd positions: vowels
      syllable += vowels.charAt(Math.floor(Math.random() * vowels.length));
    }
  }

  // If syllable length is 3, ensure it ends with consonant for better pronunciation
  if (syllableLength === 3 && syllable.length === 2) {
    syllable += consonants.charAt(
      Math.floor(Math.random() * consonants.length)
    );
  }

  // Combine: [FirstInitial][LastInitial][PronounceableSyllable]R
  return `${firstInitial}${lastInitial}${syllable.toUpperCase()}R`;
}

/**
 * Generate a unique referral code by checking for duplicates
 */
async function generateUniqueReferralCode(
  name: string,
  maxAttempts: number = 10
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateReferralCodeFromName(name);

    // Check if code already exists
    const checkResult = await hasuraClient!.request<{
      Referral_window: Array<{ id: string; referralCode: string }>;
    }>(CHECK_REFERRAL_CODE, {
      referralCode: code,
    });

    // If code doesn't exist, return it
    if (
      !checkResult.Referral_window ||
      checkResult.Referral_window.length === 0
    ) {
      return code;
    }

    // If this is the last attempt, add more randomness
    if (attempt === maxAttempts - 1) {
      // Add timestamp-based suffix to ensure uniqueness
      const timestamp = Date.now().toString(36).substring(7).toUpperCase();
      return (
        generateReferralCodeFromName(name).slice(0, -1) +
        timestamp.slice(0, 2) +
        "R"
      );
    }
  }

  // Fallback (should never reach here)
  return generateReferralCodeFromName(name);
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

    const { name, phone, email, deviceFingerprint, phoneVerified } = req.body;

    // Validation
    if (!name || !phone || !deviceFingerprint || !phoneVerified) {
      return res.status(400).json({
        error:
          "Missing required fields: name, phone, deviceFingerprint, phoneVerified",
      });
    }

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Check for duplicates
    const duplicateCheck = await hasuraClient.request<{
      Referral_window: Array<{
        id: string;
        user_id: string;
        phone: string;
        deviceFingerprint: string;
      }>;
    }>(CHECK_DUPLICATE_REFERRAL, {
      user_id: session.user.id,
      phone: phone,
      deviceFingerprint: deviceFingerprint,
    });

    if (
      duplicateCheck.Referral_window &&
      duplicateCheck.Referral_window.length > 0
    ) {
      const duplicate = duplicateCheck.Referral_window[0];
      if (duplicate.user_id === session.user.id) {
        return res.status(400).json({
          error: "You already have a referral account",
        });
      }
      if (duplicate.phone === phone) {
        return res.status(400).json({
          error: "Phone number already registered",
        });
      }
      if (duplicate.deviceFingerprint === deviceFingerprint) {
        return res.status(400).json({
          error: "This device already has a referral account",
        });
      }
    }

    // Generate unique referral code based on user's name
    const referralCode = await generateUniqueReferralCode(name);

    // Insert referral registration
    const result = await hasuraClient.request<{
      insert_Referral_window: {
        affected_rows: number;
      };
    }>(INSERT_REFERRAL_WINDOW, {
      user_id: session.user.id,
      status: "pending",
      referralCode: referralCode,
      phone: phone,
      phoneVerified: phoneVerified,
      name: name,
      email: email || "",
      deviceFingerprint: deviceFingerprint,
    });

    if (result.insert_Referral_window.affected_rows === 0) {
      return res.status(500).json({
        error: "Failed to create referral registration",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Registration submitted successfully",
      affected_rows: result.insert_Referral_window.affected_rows,
    });
  } catch (error) {
    console.error("Error registering referral:", error);
    return res.status(500).json({
      error: "Failed to register for referral program",
    });
  }
}
