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
      timeRemaining = 20,
    } = req.body;

    if (!shopperId || !orderId || !shopName || !customerAddress) {
      return res.status(400).json({
        error:
          "Missing required fields: shopperId, orderId, shopName, customerAddress",
      });
    }

    // Format the warning notification message
    const title = `⚠️ Batch Expiring Soon!`;
    const body = `${distance}km • ${itemsCount} units • ${
      estimatedEarnings ? `${estimatedEarnings} RWF` : "Check details"
    } • ${timeRemaining}s left`;

    // Create notification payload - simplified with only essential info
    const payload = {
      title,
      body,
      data: {
        type: "batch_warning",
        orderId,
        OrderID: orderId, // For compatibility
        distance: distance?.toString() || "0",
        units: itemsCount?.toString() || "0",
        earnings: estimatedEarnings?.toString() || "0",
        timeRemaining: timeRemaining?.toString() || "20",
        urgent: "true",
        click_action: "view_batch",
        action_url: `/shopper/batch/${orderId}/details`,
        notification_id: `warning_${orderId}_${Date.now()}`,
      },
      imageUrl: "/images/warning-notification-icon.png", // Optional: add a warning icon
    };

    await sendNotificationToUser(shopperId, payload);

    return res.status(200).json({
      success: true,
      message: "Warning notification sent successfully",
    });
  } catch (error) {
    console.error(
      "Error sending warning notification:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return res.status(500).json({
      error: "Failed to send warning notification",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
