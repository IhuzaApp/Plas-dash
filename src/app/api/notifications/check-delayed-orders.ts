import type { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { notifyDelayedOrderToSlack } from "../../../src/lib/slackSystemNotifier";

const GET_ORDER_BY_ID = gql`
  query GetOrderForDelayedNotification($id: uuid!) {
    Orders_by_pk(id: $id) {
      id
      OrderID
      status
      delivery_time
      Shop {
        name
      }
      orderedBy {
        phone
      }
      Shoppers {
        phone
        shopper {
          phone_number
        }
      }
    }
  }
`;

const GET_REEL_ORDER_BY_ID = gql`
  query GetReelOrderForDelayedNotification($id: uuid!) {
    reel_orders_by_pk(id: $id) {
      id
      OrderID
      status
      delivery_time
      Reel {
        title
      }
      User {
        phone
      }
      Shoppers {
        name
        phone
        shopper {
          phone_number
        }
      }
    }
  }
`;

const GET_RESTAURANT_ORDER_BY_ID = gql`
  query GetRestaurantOrderForDelayedNotification($id: uuid!) {
    restaurant_orders_by_pk(id: $id) {
      id
      OrderID
      status
      delivery_time
      Restaurant {
        name
      }
      orderedBy {
        email
        id
        name
        phone
      }
      shopper {
        shopper {
          active
          address
          full_name
          phone
          phone_number
        }
      }
    }
  }
`;

const GET_BUSINESS_ORDER_BY_ID = gql`
  query GetBusinessOrderForDelayedNotification($id: uuid!) {
    businessProductOrders_by_pk(id: $id) {
      id
      status
      delivered_time
      timeRange
      business_store {
        name
      }
      orderedBy {
        phone
      }
      shopper {
        phone
      }
    }
  }
`;

type OrderType = "regular" | "reel" | "restaurant" | "business";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body as {
      orderId?: string;
      orderType?: OrderType;
      minutesRemaining?: number;
    };
    const { orderId, orderType = "regular", minutesRemaining } = body;

    if (!orderId || typeof minutesRemaining !== "number") {
      return res.status(400).json({
        error: "Missing required fields: orderId, minutesRemaining",
      });
    }

    if (!hasuraClient) {
      return res.status(503).json({ error: "Service unavailable" });
    }

    let orderNumber = "—";
    let status = "";
    let customerPhone: string | undefined;
    let shopperPhone: string | undefined;
    let storeName: string | undefined;

    if (orderType === "regular") {
      const data = await hasuraClient.request<{
        Orders_by_pk: {
          OrderID: number;
          status: string;
          Shop: { name: string } | null;
          orderedBy: { phone: string | null } | null;
          Shoppers: {
            phone: string | null;
            shopper: { phone_number: string | null } | null;
          } | null;
        } | null;
      }>(GET_ORDER_BY_ID, { id: orderId });

      const o = data?.Orders_by_pk;
      if (!o) {
        return res.status(404).json({ error: "Order not found" });
      }
      orderNumber =
        o.OrderID != null ? String(o.OrderID).padStart(4, "0") : "—";
      status = o.status;
      customerPhone = o.orderedBy?.phone ?? undefined;
      shopperPhone =
        o.Shoppers?.shopper?.phone_number ?? o.Shoppers?.phone ?? undefined;
      storeName = o.Shop?.name ?? undefined;
    } else if (orderType === "reel") {
      const data = await hasuraClient.request<{
        reel_orders_by_pk: {
          OrderID: number;
          status: string;
          Reel: { title: string } | null;
          User: { phone: string | null } | null;
          Shoppers: {
            phone: string | null;
            shopper: { phone_number: string | null } | null;
          } | null;
        } | null;
      }>(GET_REEL_ORDER_BY_ID, { id: orderId });

      const o = data?.reel_orders_by_pk;
      if (!o) {
        return res.status(404).json({ error: "Reel order not found" });
      }
      orderNumber =
        o.OrderID != null ? String(o.OrderID).padStart(4, "0") : "—";
      status = o.status;
      customerPhone = o.User?.phone ?? undefined;
      shopperPhone =
        o.Shoppers?.shopper?.phone_number ?? o.Shoppers?.phone ?? undefined;
      storeName = o.Reel?.title ?? "Reel order";
    } else if (orderType === "restaurant") {
      const data = await hasuraClient.request<{
        restaurant_orders_by_pk: {
          OrderID: number;
          status: string;
          Restaurant: { name: string } | null;
          orderedBy: {
            email: string | null;
            id: string;
            name: string | null;
            phone: string | null;
          } | null;
          shopper: {
            shopper: {
              active: boolean;
              address: string | null;
              full_name: string | null;
              phone: string | null;
              phone_number: string | null;
            } | null;
          } | null;
        } | null;
      }>(GET_RESTAURANT_ORDER_BY_ID, { id: orderId });

      const o = data?.restaurant_orders_by_pk;
      if (!o) {
        return res.status(404).json({ error: "Restaurant order not found" });
      }
      orderNumber =
        o.OrderID != null ? String(o.OrderID).padStart(4, "0") : "—";
      status = o.status;
      customerPhone = o.orderedBy?.phone ?? undefined;
      shopperPhone =
        o.shopper?.shopper?.phone_number ??
        o.shopper?.shopper?.phone ??
        undefined;
      storeName = o.Restaurant?.name ?? undefined;
    } else if (orderType === "business") {
      const data = await hasuraClient.request<{
        businessProductOrders_by_pk: {
          id: string;
          status: string | null;
          delivered_time: string | null;
          timeRange: string | null;
          business_store: { name: string } | null;
          orderedBy: { phone: string | null } | null;
          shopper: { phone: string | null } | null;
        } | null;
      }>(GET_BUSINESS_ORDER_BY_ID, { id: orderId });

      const o = data?.businessProductOrders_by_pk;
      if (!o) {
        return res.status(404).json({ error: "Business order not found" });
      }
      orderNumber = o.id ? o.id.substring(0, 8).toUpperCase() : "—";
      status = o.status ?? "Pending";
      customerPhone = o.orderedBy?.phone ?? undefined;
      shopperPhone = o.shopper?.phone ?? undefined;
      storeName = o.business_store?.name ?? undefined;
    } else {
      return res.status(400).json({ error: "Invalid orderType" });
    }

    await notifyDelayedOrderToSlack({
      orderNumber,
      status,
      minutesRemaining,
      customerPhone,
      shopperPhone,
      storeName,
    });

    return res.status(200).json({ ok: true, orderNumber });
  } catch (err) {
    console.error("check-delayed-orders error:", err);
    return res.status(500).json({
      error: "Failed to send delayed order notification",
    });
  }
}
