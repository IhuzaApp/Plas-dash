import type { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { orderId, pin, orderType = "regular", combinedOrderIds } = req.body;

    if (!orderId || !pin) {
      return res.status(400).json({ error: "Missing orderId or PIN" });
    }

    // Handle combined_customer orders - verify all orders have the same PIN
    if (
      orderType === "combined_customer" &&
      combinedOrderIds &&
      combinedOrderIds.length > 0
    ) {
      // Fetch PINs for all orders
      const pinsQuery = gql`
        query GetOrdersPins($orderIds: [uuid!]!) {
          Orders(where: { id: { _in: $orderIds } }) {
            id
            pin
          }
        }
      `;

      const pinsData = await hasuraClient.request<any>(pinsQuery, {
        orderIds: combinedOrderIds,
      });

      const orders = pinsData.Orders;

      if (!orders || orders.length === 0) {
        return res.status(404).json({
          error: "No orders found",
          verified: false,
        });
      }

      if (orders.length !== combinedOrderIds.length) {
        return res.status(400).json({
          error: "Some orders not found",
          verified: false,
        });
      }

      // Check if all orders have the same PIN
      const pins = orders.map((o: any) => o.pin).filter(Boolean);
      const uniquePins = [...new Set(pins)];

      if (uniquePins.length === 0) {
        return res.status(400).json({
          error: "No PINs found for orders",
          verified: false,
        });
      }

      if (uniquePins.length > 1) {
        return res.status(400).json({
          error:
            "Orders have different PINs. All orders must have the same PIN.",
          verified: false,
          pinsMismatch: true,
        });
      }

      // Verify the PIN against the shared PIN
      const verified = uniquePins[0] === pin;

      return res.status(200).json({
        verified,
        message: verified
          ? "All orders have the same PIN and verification successful"
          : "Invalid PIN. All orders must have the same PIN.",
      });
    }

    // Handle combined orders (different customers/routes)
    // NOTE: For "combined" orderType (different customers), verify ONLY the specific order
    // Do NOT verify all orders in the combined group - each order should be verified independently
    // Only "combined_customer" (same customer) should verify all orders together
    if (orderType === "combined") {
      // For combined orders going to different customers/routes,
      // verify only the specific order being delivered
      const orderQuery = gql`
        query GetOrderPin($orderId: uuid!) {
          Orders_by_pk(id: $orderId) {
            id
            pin
          }
        }
      `;

      const orderData = await hasuraClient.request<any>(orderQuery, {
        orderId,
      });
      const order = orderData.Orders_by_pk;

      if (!order) {
        return res
          .status(404)
          .json({ error: "Order not found", verified: false });
      }

      // Verify only this specific order's PIN
      const verified = order.pin && order.pin === pin;
      return res.status(200).json({
        verified,
        message: verified ? "PIN verified successfully" : "Invalid PIN",
      });
    }

    // Query the appropriate table based on order type
    let query;
    let variableName;

    if (orderType === "restaurant") {
      query = gql`
        query VerifyRestaurantOrderPin($orderId: uuid!) {
          restaurant_orders_by_pk(id: $orderId) {
            id
            pin
          }
        }
      `;
      variableName = "restaurant_orders_by_pk";
    } else if (orderType === "reel") {
      query = gql`
        query VerifyReelOrderPin($orderId: uuid!) {
          reel_orders_by_pk(id: $orderId) {
            id
            pin
          }
        }
      `;
      variableName = "reel_orders_by_pk";
    } else if (orderType === "business") {
      query = gql`
        query VerifyBusinessOrderPin($orderId: uuid!) {
          businessProductOrders_by_pk(id: $orderId) {
            id
            pin
          }
        }
      `;
      variableName = "businessProductOrders_by_pk";
    } else {
      // Regular order
      query = gql`
        query VerifyOrderPin($orderId: uuid!) {
          Orders_by_pk(id: $orderId) {
            id
            pin
          }
        }
      `;
      variableName = "Orders_by_pk";
    }

    const data = await hasuraClient.request<any>(query, { orderId });
    const order = data[variableName];

    if (!order) {
      return res
        .status(404)
        .json({ error: "Order not found", verified: false });
    }

    // Verify the PIN (business orders may store pin as number)
    const orderPin = order.pin != null ? String(order.pin) : "";
    const verified = orderPin !== "" && orderPin === pin;

    return res.status(200).json({
      verified,
      message: verified ? "PIN verified successfully" : "Invalid PIN",
    });
  } catch (error) {
    console.error("Error verifying PIN:", error);
    return res.status(500).json({
      error: "Failed to verify PIN",
      verified: false,
    });
  }
}
