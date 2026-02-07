import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";
import { otpStore } from "../../../lib/otpStore";

const WITHDRAW_OTP_KEY_PREFIX = "withdraw-";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions as any);

    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = session.user.id;
    const email = (session.user as { email?: string }).email ?? "";

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(`${WITHDRAW_OTP_KEY_PREFIX}${userId}`, {
      otp,
      email: email.toLowerCase(),
      fullName: "Withdraw",
      gender: "other",
      expiresAt,
    });

    // TODO: Send OTP via email/SMS when service is configured
    console.log("=".repeat(50));
    console.log("🔐 WITHDRAW OTP");
    console.log(`User ID: ${userId}`);
    console.log(`OTP: ${otp}`);
    console.log("=".repeat(50));

    // Return OTP so the client can show it in an on-screen popup (like PaymentModal)
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp,
      devOTP: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  } catch (error: any) {
    console.error("Send withdraw OTP error:", error);
    return res.status(500).json({
      error: error.message || "Failed to send OTP",
    });
  }
}
