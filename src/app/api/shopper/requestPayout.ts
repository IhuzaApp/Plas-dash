import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { otpStore } from "../../../lib/otpStore";
import { logger } from "../../../src/utils/logger";

const WITHDRAW_OTP_KEY_PREFIX = "withdraw-";

// Get shopper id from user id
const GET_SHOPPER_BY_USER_ID = gql`
  query GetShopperByUserId($user_id: uuid!) {
    shoppers(where: { user_id: { _eq: $user_id }, active: { _eq: true } }) {
      id
    }
  }
`;

// GraphQL query to get shopper wallet
const GET_SHOPPER_WALLET = gql`
  query GetShopperWallet($shopper_id: uuid!) {
    Wallets(where: { shopper_id: { _eq: $shopper_id } }) {
      id
      available_balance
      reserved_balance
      shopper_id
    }
  }
`;

// Same withdraw request mutation as business – insert into withdrawRequests only
const REQUEST_WITHDRAW = gql`
  mutation RequestWithDraw(
    $amount: String!
    $businessWallet_id: uuid
    $business_id: uuid
    $phoneNumber: String!
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

interface Wallet {
  id: string;
  available_balance: string;
  reserved_balance: string;
  shopper_id: string;
}

interface GraphQLWalletResponse {
  Wallets: Wallet[];
}

interface ShopperResponse {
  shoppers: Array<{ id: string }>;
}

// Allow larger body for base64 verification image
export const config = {
  api: {
    bodyParser: { sizeLimit: "10mb" },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ error: `Method ${req.method} Not Allowed`, message: "" });
  }

  try {
    // Debug: log basic request info on the server
    // NOTE: verification_image can be large, so only log its length.
    // eslint-disable-next-line no-console
    console.log("[RequestPayoutAPI] Incoming request", {
      method: req.method,
      url: req.url,
      hasBody: !!req.body,
      rawAmount: (req.body as any)?.amount,
      hasVerificationImage: !!(req.body as any)?.verification_image,
      verificationImageLength: (req.body as any)?.verification_image
        ? String((req.body as any).verification_image).length
        : 0,
      hasOtp: !!(req.body as any)?.otp,
      phoneNumber: (req.body as any)?.phoneNumber,
    });

    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as any;

    if (!session?.user?.id) {
      logger.error("Unauthorized payout request", "RequestPayoutAPI", {
        hasSession: !!session,
      });
      return res
        .status(401)
        .json({ error: "Unauthorized", message: "You must be logged in." });
    }

    const userId = session.user.id;

    const {
      amount: rawAmount,
      verification_image: verificationImage = "",
      otp: otpCode,
      phoneNumber = "",
    } = req.body;

    // Validate amount
    const amount =
      typeof rawAmount === "string" ? parseFloat(rawAmount) : rawAmount;

    if (!amount || typeof amount !== "number" || isNaN(amount) || amount <= 0) {
      logger.error("Invalid payout amount", "RequestPayoutAPI", {
        rawAmount,
        parsedAmount: amount,
      });
      return res.status(400).json({
        error: "Invalid amount",
        message:
          "Amount must be a positive number. If the request failed after confirming, try again.",
      });
    }

    if (!verificationImage || typeof verificationImage !== "string") {
      // eslint-disable-next-line no-console
      console.log("[RequestPayoutAPI] Missing or invalid verification image", {
        hasVerificationImage: !!verificationImage,
        type: typeof verificationImage,
      });
      return res.status(400).json({
        error: "Verification image is required",
        message:
          "Verification image is required. If you just took a photo, the image may be too large—try again.",
      });
    }

    if (!phoneNumber || typeof phoneNumber !== "string") {
      // eslint-disable-next-line no-console
      console.log("[RequestPayoutAPI] Missing phone number", {
        phoneNumber,
        type: typeof phoneNumber,
      });
      return res.status(400).json({
        error: "Phone number is required",
        message:
          "Please enter the phone number where you want to receive the funds.",
      });
    }

    if (!otpCode || String(otpCode).length !== 6) {
      // eslint-disable-next-line no-console
      console.log("[RequestPayoutAPI] Invalid OTP format", {
        otpCode,
        length: String(otpCode || "").length,
      });
      return res.status(400).json({
        error: "Valid 6-digit OTP is required",
        message: "Please enter the 6-digit code from the popup.",
      });
    }

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // OTP verification (same store as business withdraw)
    const stored = otpStore.get(`${WITHDRAW_OTP_KEY_PREFIX}${userId}`);

    if (!stored) {
      // eslint-disable-next-line no-console
      console.log("[RequestPayoutAPI] OTP not found in store", {
        key: `${WITHDRAW_OTP_KEY_PREFIX}${userId}`,
      });
      return res.status(400).json({
        error: "OTP not found or expired. Please request a new one.",
        message:
          "OTP not found or expired. Click “Send OTP” again and enter the new code.",
      });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(`${WITHDRAW_OTP_KEY_PREFIX}${userId}`);
      // eslint-disable-next-line no-console
      console.log("[RequestPayoutAPI] OTP expired", {
        key: `${WITHDRAW_OTP_KEY_PREFIX}${userId}`,
        expiresAt: stored.expiresAt,
        now: Date.now(),
      });
      return res.status(400).json({
        error: "OTP has expired. Please request a new one.",
        message: "OTP has expired. Click “Resend OTP” and enter the new code.",
      });
    }

    if (stored.otp !== String(otpCode)) {
      // eslint-disable-next-line no-console
      console.log("[RequestPayoutAPI] OTP mismatch", {
        expected: stored.otp,
        received: String(otpCode),
      });
      return res.status(400).json({
        error: "Invalid OTP. Please try again.",
        message:
          "The code you entered is wrong. Check the popup and try again.",
      });
    }

    otpStore.delete(`${WITHDRAW_OTP_KEY_PREFIX}${userId}`);

    // Resolve shopper_id from user_id
    const shopperData = await hasuraClient.request<ShopperResponse>(
      GET_SHOPPER_BY_USER_ID,
      { user_id: userId }
    );

    if (!shopperData.shoppers?.length) {
      logger.error("Shopper not found", "RequestPayoutAPI", { userId });
      return res.status(404).json({
        error: "Shopper not found",
        message: "No active shopper account for this user",
      });
    }

    const shopperId = shopperData.shoppers[0].id;

    // Get shopper's wallet. In this schema Wallets.shopper_id stores the auth user id (Users.id), not shoppers.id.
    const walletData = await hasuraClient.request<GraphQLWalletResponse>(
      GET_SHOPPER_WALLET,
      { shopper_id: userId }
    );

    if (!walletData.Wallets || walletData.Wallets.length === 0) {
      logger.error("Wallet not found", "RequestPayoutAPI", {
        userId,
        shopperId,
      });
      return res.status(404).json({
        error: "Wallet not found",
        message:
          "No wallet found for this shopper. You may need to complete an order or contact support to have a wallet created.",
      });
    }

    const wallet = walletData.Wallets[0];
    const currentAvailableBalance = parseFloat(wallet.available_balance || "0");

    if (currentAvailableBalance < amount) {
      logger.error("Insufficient balance", "RequestPayoutAPI", {
        shopperId,
        requestedAmount: amount,
        availableBalance: currentAvailableBalance,
      });
      return res.status(400).json({
        error: "Insufficient balance",
        message: `Requested amount (${amount.toFixed(
          2
        )}) exceeds available balance (${currentAvailableBalance.toFixed(2)}).`,
      });
    }

    // Insert into withdrawRequests only (no payouts table, no immediate wallet deduction)
    await hasuraClient.request<{
      insert_withDraweRequest: { affected_rows: number };
    }>(REQUEST_WITHDRAW, {
      amount: amount.toFixed(2),
      businessWallet_id: null,
      business_id: null,
      phoneNumber: phoneNumber || "",
      shopperWallet_id: wallet.id,
      shopper_id: shopperId,
      status: "pending",
      update_at: new Date().toISOString(),
      verification_image: verificationImage,
    });

    logger.info("Withdrawal request created successfully", "RequestPayoutAPI", {
      shopperId,
      amount,
      walletId: wallet.id,
    });

    return res.status(200).json({
      success: true,
      message: "Withdrawal request submitted successfully",
      data: {
        amount,
        previousBalance: currentAvailableBalance,
        status: "pending",
        estimatedProcessingTime: "24 hours",
      },
    });
  } catch (error) {
    console.error("Error processing payout request:", error);
    logger.error("Error processing payout request", "RequestPayoutAPI", error);

    return res.status(500).json({
      error: "Internal server error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to process withdrawal request",
    });
  }
}
