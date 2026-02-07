import { NextApiRequest, NextApiResponse } from "next";
import { removeFCMToken } from "../../../src/services/fcmService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: "Missing required field: token",
      });
    }

    await removeFCMToken(token);

    res.status(200).json({
      success: true,
      message: "Token removed successfully",
    });
  } catch (error) {
    console.error(
      "Error removing FCM token:",
      error instanceof Error ? error.message : "Unknown error"
    );
    res.status(500).json({
      error: "Failed to remove token",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
