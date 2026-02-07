import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { gql } from "graphql-request";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { logger } from "../../../src/utils/logger";

interface OrdersResponse {
  Orders: Array<{
    id: string;
    status: string;
  }>;
  reel_orders: Array<{
    id: string;
    status: string;
  }>;
  restaurant_orders: Array<{
    id: string;
    status: string;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const GET_ACTIVE_ORDERS = gql`
      query GetActiveOrders($shopperId: uuid!) {
        Orders(
          where: {
            shopper_id: { _eq: $shopperId }
            status: { _neq: "delivered" }
          }
        ) {
          id
          status
        }
        reel_orders(
          where: {
            shopper_id: { _eq: $shopperId }
            status: { _neq: "delivered" }
          }
        ) {
          id
          status
        }
        restaurant_orders(
          where: {
            shopper_id: { _eq: $shopperId }
            status: { _neq: "delivered" }
          }
        ) {
          id
          status
        }
      }
    `;

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const data = await hasuraClient.request<OrdersResponse>(GET_ACTIVE_ORDERS, {
      shopperId: userId,
    });

    const allOrders = [
      ...(data.Orders || []),
      ...(data.reel_orders || []),
      ...(data.restaurant_orders || []),
    ];

    logger.info("Active orders query result:", "ActiveOrdersAPI", {
      userId,
      orderCount: allOrders.length,
    });

    return res.status(200).json({
      orders: allOrders,
    });
  } catch (error) {
    logger.error("Error fetching active orders:", "ActiveOrdersAPI", error);
    return res.status(500).json({ error: "Failed to fetch active orders" });
  }
}
