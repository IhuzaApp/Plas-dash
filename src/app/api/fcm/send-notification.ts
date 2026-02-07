import { NextApiRequest, NextApiResponse } from "next";
import { sendChatNotification } from "../../../src/services/fcmService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { recipientId, senderName, message, orderId, conversationId } =
      req.body;

    if (
      !recipientId ||
      !senderName ||
      !message ||
      !orderId ||
      !conversationId
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: recipientId, senderName, message, orderId, conversationId",
      });
    }

    await sendChatNotification(
      recipientId,
      senderName,
      message,
      orderId,
      conversationId
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(
      "Error sending chat notification:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return res.status(500).json({
      error: "Failed to send notification",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
