import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

// Fetch recent orders for a shopper with their status delivered
const GET_SHOPPER_RECENT_ORDERS = gql`
  query GetShopperRecentOrders(
    $shopper_id: uuid!
    $limit: Int!
    $offset: Int!
  ) {
    Orders(
      where: { shopper_id: { _eq: $shopper_id }, status: { _eq: "delivered" } }
      order_by: { updated_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      OrderID
      user_id
      status
      created_at
      updated_at
      total
      service_fee
      delivery_fee
      shop_id
      Shop {
        id
        name
        image
      }
      Order_Items_aggregate {
        aggregate {
          count
          sum {
            quantity
          }
        }
      }
    }

    # Get total count of delivered orders
    Orders_aggregate(
      where: { shopper_id: { _eq: $shopper_id }, status: { _eq: "delivered" } }
    ) {
      aggregate {
        count
      }
    }
  }
`;

interface OrdersResponse {
  Orders: Array<{
    id: string;
    OrderID: string;
    user_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    total: string;
    service_fee: string;
    delivery_fee: string;
    shop_id: string;
    Shop: {
      id: string;
      name: string;
      image: string;
    };
    Order_Items_aggregate: {
      aggregate: {
        count: number;
        sum: {
          quantity: number | null;
        } | null;
      } | null;
    };
  }>;
  Orders_aggregate: {
    aggregate: {
      count: number;
    };
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get session to identify the shopper
    const session = await getServerSession(req, res, authOptions as any);
    const shopperId = (session as any)?.user?.id;

    if (!shopperId) {
      return res
        .status(401)
        .json({ error: "You must be logged in as a shopper" });
    }

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Get pagination parameters from query params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const offset = (page - 1) * limit;

    // Fetch recent completed orders with pagination
    const data = await hasuraClient.request<OrdersResponse>(
      GET_SHOPPER_RECENT_ORDERS,
      {
        shopper_id: shopperId,
        limit,
        offset,
      }
    );

    // Get total count of orders
    const totalOrders = data.Orders_aggregate.aggregate.count;

    // Format orders for the frontend
    const recentOrders = data.Orders.map((order) => {
      // Get fee amounts
      const serviceFee = parseFloat(order.service_fee || "0");
      const deliveryFee = parseFloat(order.delivery_fee || "0");
      const totalEarnings = serviceFee + deliveryFee;

      // Calculate time difference between creation and completion
      const createdAt = new Date(order.created_at);
      const completedAt = new Date(order.updated_at);
      const minutesTaken = Math.floor(
        (completedAt.getTime() - createdAt.getTime()) / (1000 * 60)
      );

      // Format date for display
      const orderDate = completedAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      // Get item counts
      const itemCount =
        order.Order_Items_aggregate.aggregate?.sum?.quantity || 0;

      return {
        id: order.id,
        orderNumber: order.OrderID,
        date: orderDate,
        store: order.Shop.name,
        items: itemCount,
        amount: totalEarnings,
        serviceFee: serviceFee,
        deliveryFee: deliveryFee,
        tip: 0, // Tip information not available in the current data model
        minutesTaken,
      };
    });

    return res.status(200).json({
      success: true,
      orders: recentOrders,
      total: totalOrders,
      page,
      limit,
      totalPages: Math.ceil(totalOrders / limit),
    });
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch recent orders",
    });
  }
}
