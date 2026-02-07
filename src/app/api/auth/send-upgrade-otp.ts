import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";
import { otpStore } from "../../../lib/otpStore";

// Generate a 6-digit OTP
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
    // Get the session
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Check if user is actually a guest
    if (!(session.user as any).is_guest) {
      return res.status(400).json({ error: "User is already a full member" });
    }

    const { fullName, email, gender } = req.body;

    // Validation
    if (!fullName || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // TODO: Add email uniqueness check when database is ready

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore.set(session.user.id, {
      otp,
      email: email.toLowerCase(),
      fullName,
      gender: gender || "male",
      expiresAt,
    });

    // TODO: Send OTP via email when email service is configured
    // For now, just log to console
    console.log("=".repeat(60));
    console.log("🔐 OTP VERIFICATION CODE");
    console.log("=".repeat(60));
    console.log(`User ID: ${session.user.id}`);
    console.log(`Email: ${email}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`Expires in: 10 minutes`);
    console.log("=".repeat(60));

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      // For development, include OTP in response (remove in production)
      devOTP: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  } catch (error: any) {
    console.error("Send OTP error:", error);
    return res.status(500).json({
      error: error.message || "Failed to send OTP",
    });
  }
}
