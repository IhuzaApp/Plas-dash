import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { logger } from "../../../src/utils/logger";

// GraphQL mutation to mark notifications as read
const MARK_NOTIFICATIONS_READ = gql`
  mutation MarkNotificationsRead($user_id: uuid!, $order_id: String!) {
    update_Notifications(
      where: { user_id: { _eq: $user_id }, message: { _ilike: $order_id } }
      _set: { is_read: true }
    ) {
      affected_rows
    }
  }
`;

// GraphQL query to check if order is already assigned
const CHECK_ORDER_ASSIGNMENT = gql`
  query CheckOrderAssignment($order_id: uuid!) {
    Orders_by_pk(id: $order_id) {
      id
      shopper_id
      status
    }
    reel_orders_by_pk(id: $order_id) {
      id
      shopper_id
      status
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Authenticate the shopper
  const session = await getServerSession(req, res, authOptions as any);
  const userId = (session as any)?.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { orderId, orderType = "regular" } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: "Missing orderId" });
  }

  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Check if order is already assigned to this shopper
    const orderData = await hasuraClient.request(CHECK_ORDER_ASSIGNMENT, {
      order_id: orderId,
    });

    const regularOrder = orderData.Orders_by_pk;
    const reelOrder = orderData.reel_orders_by_pk;
    const order = regularOrder || reelOrder;

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if order is assigned to this shopper
    if (order.shopper_id !== userId) {
      return res.status(403).json({
        error: "Order not assigned to this shopper",
        success: false,
      });
    }

    // Mark notifications as read for this order
    const notificationPattern = `%${orderId}%`;
    await hasuraClient.request(MARK_NOTIFICATIONS_READ, {
      user_id: userId,
      order_id: notificationPattern,
    });

    logger.info(
      `Cleaned up notifications for order ${orderId}`,
      "CleanupNotificationAPI",
      { userId, orderId, orderType }
    );

    return res.status(200).json({
      success: true,
      message: "Notifications cleaned up successfully",
      orderId,
      orderType,
    });
  } catch (error) {
    logger.error(
      "Error cleaning up notifications",
      "CleanupNotificationAPI",
      error
    );
    return res.status(500).json({ error: "Failed to cleanup notifications" });
  }
}
