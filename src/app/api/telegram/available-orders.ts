import type { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

// Define types for the GraphQL response
interface Order {
  id: string;
  created_at: string;
  service_fee: string | null;
  delivery_fee: string | null;
  status: string;
  shop: {
    name: string;
    address: string;
  } | null;
  address: {
    street: string;
    city: string;
  } | null;
  Order_Items_aggregate: {
    aggregate: {
      count: number | null;
    } | null;
  };
}

interface ReelOrder {
  id: string;
  created_at: string;
  service_fee: string | null;
  delivery_fee: string | null;
  total: string;
  quantity: string;
  delivery_note: string | null;
  status: string;
  Reel: {
    id: string;
    title: string;
    description: string;
    Price: string;
    Product: string;
    type: string;
    video_url: string;
  };
  user: {
    name: string;
    phone: string;
  };
  address: {
    street: string;
    city: string;
  } | null;
}

interface GraphQLResponse {
  Orders: Order[];
  reel_orders: ReelOrder[];
}

// GraphQL query to fetch available orders
const GET_AVAILABLE_ORDERS = gql`
  query GetAvailableOrders {
    Orders(
      where: { shopper_id: { _is_null: true }, status: { _eq: "PENDING" } }
      order_by: { created_at: desc }
      limit: 10
    ) {
      id
      created_at
      service_fee
      delivery_fee
      status
      shop: Shop {
        name
        address
      }
      address: Address {
        street
        city
      }
      Order_Items_aggregate {
        aggregate {
          count
        }
      }
    }

    reel_orders(
      where: { shopper_id: { _is_null: true }, status: { _eq: "PENDING" } }
      order_by: { created_at: desc }
      limit: 10
    ) {
      id
      created_at
      service_fee
      delivery_fee
      total
      quantity
      delivery_note
      status
      Reel {
        id
        title
        description
        Price
        Product
        type
        video_url
      }
      user: User {
        name
        phone
      }
      address: Address {
        street
        city
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
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Calculate 40 minutes ago
    const fortyMinutesAgo = new Date(Date.now() - 40 * 60 * 1000);

    // Fetch available orders
    const data = await hasuraClient.request<GraphQLResponse>(
      GET_AVAILABLE_ORDERS
    );

    // Process regular orders
    const regularOrders = data.Orders.map((order) => {
      const serviceFee = parseFloat(order.service_fee || "0");
      const deliveryFee = parseFloat(order.delivery_fee || "0");
      const totalEarnings = serviceFee + deliveryFee;

      const createdAt = new Date(order.created_at);
      const minutesAgo = Math.floor(
        (Date.now() - createdAt.getTime()) / (1000 * 60)
      );

      return {
        id: order.id,
        type: "regular",
        shopName: order.shop?.name || "Unknown Shop",
        shopAddress: order.shop?.address || "No address",
        customerAddress: `${order.address?.street || "No street"}, ${
          order.address?.city || "No city"
        }`,
        earnings: totalEarnings,
        itemsCount: order.Order_Items_aggregate.aggregate?.count || 0,
        minutesAgo,
        createdAt: order.created_at,
      };
    });

    // Process reel orders
    const reelOrders = data.reel_orders.map((order) => {
      const serviceFee = parseFloat(order.service_fee || "0");
      const deliveryFee = parseFloat(order.delivery_fee || "0");
      const totalEarnings = serviceFee + deliveryFee;

      const createdAt = new Date(order.created_at);
      const minutesAgo = Math.floor(
        (Date.now() - createdAt.getTime()) / (1000 * 60)
      );

      return {
        id: order.id,
        type: "reel",
        title: order.Reel.title,
        description: order.Reel.description,
        product: order.Reel.Product,
        price: order.Reel.Price,
        customerName: order.user.name,
        customerPhone: order.user.phone,
        customerAddress: `${order.address?.street || "No street"}, ${
          order.address?.city || "No city"
        }`,
        earnings: totalEarnings,
        quantity: parseInt(order.quantity),
        deliveryNote: order.delivery_note,
        minutesAgo,
        createdAt: order.created_at,
      };
    });

    // Combine and sort all orders by creation time (oldest first)
    const allOrders = [...regularOrders, ...reelOrders].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return res.status(200).json({
      success: true,
      data: {
        orders: allOrders,
        totalCount: allOrders.length,
        regularCount: regularOrders.length,
        reelCount: reelOrders.length,
        fortyMinutesAgo: fortyMinutesAgo.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching available orders:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch available orders",
    });
  }
}
