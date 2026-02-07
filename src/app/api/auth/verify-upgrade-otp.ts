import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";
import { otpStore } from "../../../lib/otpStore";

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

    const { otp, password } = req.body;

    // Validation
    if (!otp || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
    }

    // Get stored OTP data
    const storedData = otpStore.get(session.user.id);

    if (!storedData) {
      return res.status(400).json({
        error: "OTP not found or expired. Please request a new one.",
      });
    }

    // Check if OTP is expired
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(session.user.id);
      return res.status(400).json({
        error: "OTP has expired. Please request a new one.",
      });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      return res.status(400).json({
        error: "Invalid OTP. Please try again.",
      });
    }

    // OTP is valid!
    // Clear OTP from store
    otpStore.delete(session.user.id);

    console.log("=".repeat(60));
    console.log("✅ OTP VERIFIED SUCCESSFULLY");
    console.log("=".repeat(60));
    console.log(`User ID: ${session.user.id}`);
    console.log(`Email: ${storedData.email}`);
    console.log(`Name: ${storedData.fullName}`);
    console.log(`Gender: ${storedData.gender}`);
    console.log(`Password: ${password}`);
    console.log("=".repeat(60));
    console.log("TODO: Update user in database when ready");
    console.log("=".repeat(60));

    return res.status(200).json({
      success: true,
      user: {
        id: session.user.id,
        name: storedData.fullName,
        email: storedData.email,
        gender: storedData.gender,
        is_guest: false,
      },
      message: "OTP verified successfully",
    });
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({
      error: error.message || "Failed to verify OTP",
    });
  }
}
