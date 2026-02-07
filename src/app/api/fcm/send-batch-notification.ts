import { NextApiRequest, NextApiResponse } from "next";
import { sendNotificationToUser } from "../../../src/services/fcmService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      shopperId,
      orderId,
      shopName,
      customerAddress,
      distance,
      itemsCount,
      estimatedEarnings,
      orderType = "regular",
    } = req.body;

    if (!shopperId || !orderId || !shopName || !customerAddress) {
      return res.status(400).json({
        error:
          "Missing required fields: shopperId, orderId, shopName, customerAddress",
      });
    }

    // Format the notification message
    const title = `🚀 New Batch Available!`;
    const body = `${distance}km • ${itemsCount} units • ${
      estimatedEarnings ? `${estimatedEarnings} RWF` : "Check details"
    }`;

    // Create notification payload - simplified with only essential info
    const payload = {
      title,
      body,
      data: {
        type: "batch_notification",
        orderId,
        OrderID: orderId, // For compatibility
        distance: distance?.toString() || "0",
        units: itemsCount?.toString() || "0",
        earnings: estimatedEarnings?.toString() || "0",
        click_action: "view_batch",
        action_url: `/shopper/batch/${orderId}/details`,
        notification_id: `batch_${orderId}_${Date.now()}`,
      },
      imageUrl: "/images/batch-notification-icon.png", // Optional: add a custom icon
    };

    await sendNotificationToUser(shopperId, payload);

    return res.status(200).json({
      success: true,
      message: "Batch notification sent successfully",
    });
  } catch (error) {
    console.error(
      "Error sending batch notification:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return res.status(500).json({
      error: "Failed to send batch notification",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
