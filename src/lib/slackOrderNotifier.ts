const SLACK_ORDERS_WEBHOOK = process.env.SLACK_ORDERS_WEBHOOK;

export type SlackOrderType =
  | "regular"
  | "reel"
  | "business"
  | "restaurant"
  | "combined";

/** Line item for card-style Slack message (optional) */
export interface SlackOrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface SlackOrderPayload {
  id: string;
  total: number | string;
  /** Order type for Slack label (regular, reel, business, restaurant, combined) */
  orderType?: SlackOrderType;
  /** Display order number (e.g. OrderID from DB). Falls back to id if missing. */
  orderID?: string;
  /** Store/supermarket name */
  storeName?: string;
  /** Number of units/items ordered */
  units?: number | string;
  /** Customer name (optional; falls back to phone) */
  customerName?: string;
  /** Customer phone */
  customerPhone?: string;
  /** Customer delivery address */
  customerAddress?: string;
  /** Expected delivery time (e.g. ISO string or readable string) */
  deliveryTime?: string;
  /** Line items for card (optional; if missing, shows store/units summary) */
  items?: SlackOrderItem[];
}

const ORDER_TYPE_LABELS: Record<SlackOrderType, string> = {
  regular: "🛒 Regular",
  reel: "🎬 Reel",
  business: "📦 Business",
  restaurant: "🍽️ Restaurant",
  combined: "📦 Combined",
};

/**
 * Send a "new order" notification to the orders Slack channel.
 * Uses SLACK_ORDERS_WEBHOOK with a card-style block layout.
 */
export async function notifyNewOrderToSlack(order: SlackOrderPayload) {
  if (!SLACK_ORDERS_WEBHOOK) {
    console.error("SLACK_ORDERS_WEBHOOK is not configured");
    return;
  }

  const totalNumber =
    typeof order.total === "string"
      ? parseFloat(order.total || "0")
      : order.total;

  const formattedTotal = Number.isFinite(totalNumber)
    ? totalNumber.toFixed(2)
    : "0.00";

  const displayOrderId = order.orderID ?? order.id;
  const orderTypeLabel = order.orderType
    ? ORDER_TYPE_LABELS[order.orderType]
    : "Order";
  const customerDisplay = order.customerName ?? order.customerPhone ?? "—";
  const placedAt = new Date().toLocaleTimeString();
  const storeDisplay = order.storeName ?? "—";
  const unitsDisplay = order.units != null ? String(order.units) : "—";

  // Items section: use line items if provided, else one summary line
  const itemsText =
    order.items && order.items.length > 0
      ? order.items
          .map(
            (i) => `• ${i.name} ×${i.qty} — *$${(i.price * i.qty).toFixed(2)}*`
          )
          .join("\n")
      : `• Order — ×${unitsDisplay} — *$${formattedTotal}*`;

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `🛒 New Order · ${orderTypeLabel}`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Order ID*\n\`${displayOrderId}\`` },
        { type: "mrkdwn", text: `*Status*\nPENDING` },
      ],
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Supermarket*\n${storeDisplay}` },
        { type: "mrkdwn", text: `*Units*\n${unitsDisplay}` },
      ],
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Customer*\n${customerDisplay}` },
        { type: "mrkdwn", text: `*Placed at*\n${placedAt}` },
      ],
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*📞 Customer phone (call for urgency)*\n${
            order.customerPhone ?? "—"
          }`,
        },
      ],
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Items*\n${itemsText}`,
      },
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Total*\n💵 *$${formattedTotal}*`,
      },
    },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `🕒 ${new Date().toLocaleString()}` }],
    },
  ];

  try {
    await fetch(SLACK_ORDERS_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });
  } catch (error) {
    console.error("Failed to send order notification to Slack", error);
  }
}
