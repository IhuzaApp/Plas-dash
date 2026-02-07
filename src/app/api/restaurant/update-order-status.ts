import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const UPDATE_RESTAURANT_ORDER_STATUS = gql`
  mutation UpdateRestaurantOrderStatus($orderId: uuid!, $status: String!) {
    update_restaurant_orders(
      where: { id: { _eq: $orderId } }
      _set: { status: $status, updated_at: "now()" }
    ) {
      affected_rows
      returning {
        id
        status
        updated_at
      }
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate status values
    const validStatuses = [
      "WAITING_FOR_CONFIRMATION",
      "PENDING",
      "CONFIRMED",
      "READY",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    // Update the order status
    const result = await hasuraClient.request(UPDATE_RESTAURANT_ORDER_STATUS, {
      orderId,
      status,
    });

    if (result.update_restaurant_orders.affected_rows === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: result.update_restaurant_orders.returning[0],
    });
  } catch (error) {
    console.error("Error updating restaurant order status:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
