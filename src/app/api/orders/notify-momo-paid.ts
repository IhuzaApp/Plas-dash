import type { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { notifyNewOrderToSlack } from "../../../src/lib/slackOrderNotifier";

const GET_ORDER_FOR_SLACK = gql`
  query GetOrderForSlack($id: uuid!) {
    businessProductOrders_by_pk(id: $id) {
      id
      total
      units
      deliveryAddress
      delivered_time
      timeRange
      store_id
      ordered_by
      business_store {
        name
      }
      orderedBy {
        phone
      }
    }
  }
`;

/**
 * Called when MoMo payment is confirmed on the payment-pending page.
 * Sends the deferred Slack notification for the order.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "orderId is required" });
    }

    if (!hasuraClient) {
      return res.status(500).json({ error: "Server not configured" });
    }

    const result = await hasuraClient.request<{
      businessProductOrders_by_pk: {
        id: string;
        total: string;
        units: string;
        deliveryAddress: string | null;
        delivered_time: string | null;
        timeRange: string | null;
        business_store: { name: string } | null;
        orderedBy: { phone: string | null } | null;
      } | null;
    }>(GET_ORDER_FOR_SLACK, { id: orderId });

    const order = result.businessProductOrders_by_pk;
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    void notifyNewOrderToSlack({
      id: order.id,
      orderID: order.id,
      total: order.total,
      orderType: "business",
      storeName: order.business_store?.name ?? undefined,
      units: order.units,
      customerPhone: order.orderedBy?.phone ?? undefined,
      customerAddress: order.deliveryAddress ?? undefined,
      deliveryTime: order.timeRange ?? order.delivered_time ?? undefined,
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("[notify-momo-paid] Error:", error);
    return res.status(500).json({
      error: "Failed to send notification",
      message: error.message,
    });
  }
}
