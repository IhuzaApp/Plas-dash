import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

// This would typically be stored in your database
// For now, we'll use a simple in-memory store (not recommended for production)
const telegramConnections = new Map<string, string>();

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

    const { chatId, shopperId } = req.body;

    if (!chatId || !shopperId) {
      return res.status(400).json({
        error: "Missing required fields: chatId and shopperId",
      });
    }

    // Verify the authenticated user matches the shopper ID
    if (shopperId !== session.user.id) {
      return res.status(403).json({
        error: "Not authorized to connect this shopper ID",
      });
    }

    // Store the connection (in production, save to database)
    telegramConnections.set(shopperId, chatId);

    console.log(
      `✅ Telegram connection stored: Shopper ${shopperId} -> Chat ${chatId}`
    );

    return res.status(200).json({
      success: true,
      message: "Telegram connection established",
      shopperId,
      chatId,
    });
  } catch (error) {
    console.error("Error connecting Telegram:", error);
    return res.status(500).json({
      error: "Failed to connect Telegram",
    });
  }
}

// Export the connections map for use in other parts of the app
export { telegramConnections };
