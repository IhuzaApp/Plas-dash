import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import type { Session } from "next-auth";
import { logger } from "../../../src/utils/logger";

// Fetch ALL orders including item aggregates, fees, and shopper assignment
const GET_ALL_ORDERS = gql`
  query GetAllOrders {
    Orders(order_by: { created_at: desc }) {
      id
      OrderID
      user_id
      status
      created_at
      total
      service_fee
      delivery_fee
      shop_id
      shopper_id
      delivery_time
      pin
      Order_Items_aggregate {
        aggregate {
          count
          sum {
            quantity
          }
        }
      }
    }
  }
`;

// Fetch shop details by IDs
const GET_SHOPS_BY_IDS = gql`
  query GetShopsByIds($ids: [uuid!]!) {
    Shops(where: { id: { _in: $ids } }) {
      id
      name
      address
      image
      logo
      category_id
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
    total: string;
    service_fee: string;
    delivery_fee: string;
    shop_id: string;
    shopper_id: string | null;
    delivery_time: string;
    pin: string;
    Order_Items_aggregate: {
      aggregate: {
        count: number;
        sum: {
          quantity: number | null;
        } | null;
      } | null;
    };
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Get the user ID from the session for authentication
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as Session | null;
    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 1. Fetch ALL orders
    const data = await hasuraClient.request<OrdersResponse>(GET_ALL_ORDERS);
    const orders = data.Orders;

    // If no orders found, return empty array
    if (!orders || orders.length === 0) {
      return res.status(200).json({ orders: [] });
    }

    // 2. Fetch shops for these orders
    const shopIds = Array.from(new Set(orders.map((o) => o.shop_id))).filter(
      Boolean
    );

    if (shopIds.length === 0) {
      // If no shop IDs, return orders without shop data
      const enriched = orders.map((o) => ({
        id: o.id,
        OrderID: o.OrderID,
        user_id: o.user_id,
        status: o.status,
        created_at: o.created_at,
        delivery_time: o.delivery_time,
        pin: o.pin,
        total:
          parseFloat(o.total || "0") +
          parseFloat(o.service_fee || "0") +
          parseFloat(o.delivery_fee || "0"),
        shop_id: o.shop_id,
        shopper_id: o.shopper_id,
        shop: null,
        itemsCount: o.Order_Items_aggregate.aggregate?.count ?? 0,
        unitsCount: o.Order_Items_aggregate.aggregate?.sum?.quantity ?? 0,
      }));
      return res.status(200).json({ orders: enriched });
    }

    // Proceed with shop data fetching
    const shopsData = await hasuraClient.request<{
      Shops: Array<{
        id: string;
        name: string;
        address: string;
        image: string;
        logo: string;
        category_id: string;
      }>;
    }>(GET_SHOPS_BY_IDS, { ids: shopIds });
    const shopMap = new Map(shopsData.Shops.map((s) => [s.id, s]));

    // 3. Enrich orders with shop details and item counts
    const enriched = orders.map((o) => {
      const agg = o.Order_Items_aggregate.aggregate;
      const itemsCount = agg?.count ?? 0;
      const unitsCount = agg?.sum?.quantity ?? 0;
      // Compute grand total including fees
      const baseTotal = parseFloat(o.total || "0");
      const serviceFee = parseFloat(o.service_fee || "0");
      const deliveryFee = parseFloat(o.delivery_fee || "0");
      const grandTotal = baseTotal + serviceFee + deliveryFee;
      return {
        id: o.id,
        OrderID: o.OrderID,
        user_id: o.user_id,
        status: o.status,
        created_at: o.created_at,
        delivery_time: o.delivery_time,
        pin: o.pin,
        total: grandTotal,
        shop_id: o.shop_id,
        shopper_id: o.shopper_id,
        shop: shopMap.get(o.shop_id) || null,
        itemsCount,
        unitsCount,
      };
    });
    res.status(200).json({ orders: enriched });
  } catch (error) {
    logger.error("Error fetching all orders", "AllOrdersAPI", error);
    res.status(500).json({ error: "Failed to fetch all orders" });
  }
}
