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
      orderId,
      shopName,
      customerAddress,
      distance,
      itemsCount,
      estimatedEarnings,
      orderType = "regular",
    } = req.body;

    if (!orderId || !shopName || !customerAddress) {
      return res.status(400).json({
        error: "Missing required fields: orderId, shopName, customerAddress",
      });
    }

    // Get all users with FCM tokens and notifications enabled
    const allUsersResponse = await fetch(
      `${
        req.headers.origin || "http://localhost:3000"
      }/api/queries/get-all-notification-users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: req.headers.cookie || "", // Pass cookies for authentication
        },
      }
    );

    if (!allUsersResponse.ok) {
      return res.status(200).json({
        success: true,
        message: "Batch notification processing completed",
        notificationsSent: 0,
        error: "Could not fetch users with notifications",
      });
    }

    const allUsersData = await allUsersResponse.json();
    const notificationUsers = allUsersData.users || [];

    if (notificationUsers.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No users with notifications enabled found",
        notificationsSent: 0,
      });
    }

    // Format the notification message
    const title = `🚀 New Batch Available!`;
    const body = `${distance}km • ${itemsCount} items • ${
      estimatedEarnings ? `${estimatedEarnings} RWF` : "Check details"
    }`;

    // Create notification payload
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
        shopName,
        customerAddress,
        orderType,
        click_action: "view_batch",
        action_url: `/Plasa/active-batches/batch/${orderId}`,
        notification_id: `batch_${orderId}_${Date.now()}`,
        // Mark as background notification (no click actions needed)
        background_notification: "true",
      },
      imageUrl: "/images/batch-notification-icon.png",
    };

    // Send notifications to all users with notifications enabled
    const notificationPromises = notificationUsers.map(
      async (user: { id: string }) => {
        try {
          await sendNotificationToUser(user.id, payload);
          return { userId: user.id, success: true };
        } catch (error) {
          return { userId: user.id, success: false, error };
        }
      }
    );

    const results = await Promise.allSettled(notificationPromises);
    const successful = results.filter(
      (result) => result.status === "fulfilled" && result.value.success
    ).length;

    return res.status(200).json({
      success: true,
      message:
        "Batch notifications sent to all users with notifications enabled",
      notificationsSent: successful,
      totalUsers: notificationUsers.length,
      orderId,
    });
  } catch (error) {
    console.error(
      "Error sending batch notifications:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return res.status(500).json({
      error: "Failed to send batch notifications to all users",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
