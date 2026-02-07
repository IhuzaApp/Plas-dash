import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { otpStore } from "../../../lib/otpStore";

const WITHDRAW_OTP_KEY_PREFIX = "withdraw-";

const REQUEST_WITHDRAW = gql`
  mutation RequestWithDraw(
    $amount: String!
    $businessWallet_id: uuid!
    $business_id: uuid!
    $phoneNumber: String
    $shopperWallet_id: uuid
    $shopper_id: uuid
    $status: String!
    $update_at: timestamptz!
    $verification_image: String!
  ) {
    insert_withDraweRequest(
      objects: {
        amount: $amount
        businessWallet_id: $businessWallet_id
        business_id: $business_id
        phoneNumber: $phoneNumber
        shopperWallet_id: $shopperWallet_id
        shopper_id: $shopper_id
        status: $status
        update_at: $update_at
        verification_image: $verification_image
      }
    ) {
      affected_rows
    }
  }
`;

interface SessionUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

interface Session {
  user: SessionUser;
  expires: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as Session | null;

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const {
      amount,
      business_id,
      businessWallet_id,
      phoneNumber = "",
      verification_image = "",
      otp: otpCode,
    } = req.body;

    if (!amount || amount === "" || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    if (!business_id) {
      return res.status(400).json({ error: "Business ID is required" });
    }

    if (!businessWallet_id) {
      return res.status(400).json({
        error: "Business wallet ID is required",
      });
    }

    if (!verification_image || typeof verification_image !== "string") {
      return res.status(400).json({
        error: "Verification image is required",
      });
    }

    if (!otpCode || String(otpCode).length !== 6) {
      return res.status(400).json({
        error: "Valid 6-digit OTP is required",
      });
    }

    const userId = session.user.id;
    const stored = otpStore.get(`${WITHDRAW_OTP_KEY_PREFIX}${userId}`);

    if (!stored) {
      return res.status(400).json({
        error: "OTP not found or expired. Please request a new one.",
      });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(`${WITHDRAW_OTP_KEY_PREFIX}${userId}`);
      return res.status(400).json({
        error: "OTP has expired. Please request a new one.",
      });
    }

    if (stored.otp !== String(otpCode)) {
      return res.status(400).json({
        error: "Invalid OTP. Please try again.",
      });
    }

    otpStore.delete(`${WITHDRAW_OTP_KEY_PREFIX}${userId}`);

    const result = await hasuraClient.request<{
      insert_withDraweRequest: { affected_rows: number };
    }>(REQUEST_WITHDRAW, {
      amount: String(amount),
      businessWallet_id,
      business_id,
      phoneNumber: phoneNumber || "",
      shopperWallet_id: null,
      shopper_id: null,
      status: "pending",
      update_at: new Date().toISOString(),
      verification_image: verification_image || "",
    });

    if (
      !result.insert_withDraweRequest ||
      result.insert_withDraweRequest.affected_rows === 0
    ) {
      throw new Error("Failed to create withdrawal request");
    }

    return res.status(200).json({
      success: true,
      message: "Withdrawal request submitted successfully",
    });
  } catch (error: any) {
    console.error("Error creating withdrawal request:", error);
    return res.status(500).json({
      error: "Failed to submit withdrawal request",
      message: error.message,
    });
  }
}
