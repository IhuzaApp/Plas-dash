const SLACK_GENERAL_WEBHOOK = process.env.SLACK_GENERAL_WEBHOOK;

// --- Generic system notification (e.g. Redis status) ---

export interface SystemNotificationPayload {
  /** Short title (e.g. "Redis connected") */
  title: string;
  /** Message body */
  message: string;
  /** Optional context (env, etc.) */
  context?: Record<string, string | number | boolean | undefined>;
}

/**
 * Send a generic system notification to Slack using SLACK_GENERAL_WEBHOOK.
 * Used for operational events (e.g. Redis connected, service status).
 * Throttled at call site (e.g. at most once per minute).
 */
export async function notifySystemToSlack(payload: SystemNotificationPayload) {
  if (!SLACK_GENERAL_WEBHOOK) {
    return;
  }

  const title = payload.title?.trim() || "System";
  const message = payload.message?.trim() || "—";
  const context = payload.context ?? {};

  const blocks: any[] = [
    {
      type: "header",
      text: { type: "plain_text", text: title },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: message },
    },
  ];

  if (Object.keys(context).length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "*Context*\n```" +
          JSON.stringify(context, null, 2).slice(0, 800) +
          "```",
      },
    });
  }

  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: `🕒 ${new Date().toISOString()}` }],
  });

  try {
    await fetch(SLACK_GENERAL_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `${title}: ${message}`, blocks }),
    });
  } catch (error) {
    console.error("Failed to send system notification to Slack", error);
  }
}

export interface NewReviewPayload {
  /** Order number for display (e.g. OrderID) */
  orderNumber: string;
  /** Overall rating (1–5) */
  overallRating: number;
  /** Shopper/Plaser name */
  shopperName?: string;
  /** Supermarket / store / shop name */
  storeName?: string;
  /** Customer comment (optional) */
  comment?: string;
}

/**
 * Send a "new review added" notification to Slack using SLACK_GENERAL_WEBHOOK.
 * Called after a customer submits feedback for an order.
 */
export async function notifyNewReviewToSlack(payload: NewReviewPayload) {
  if (!SLACK_GENERAL_WEBHOOK) {
    console.error("SLACK_GENERAL_WEBHOOK is not configured");
    return;
  }

  const orderDisplay = payload.orderNumber ?? "—";
  const ratingDisplay = String(payload.overallRating);
  const shopperDisplay = payload.shopperName ?? "—";
  const storeDisplay = payload.storeName ?? "—";
  const commentDisplay =
    payload.comment && payload.comment.trim()
      ? payload.comment.trim().slice(0, 1000)
      : "_No comment_";

  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "⭐ New Review Added",
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Order #*\n\`${orderDisplay}\`` },
        { type: "mrkdwn", text: `*Overall rating*\n${ratingDisplay}/5` },
      ],
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Shopper*\n${shopperDisplay}` },
        { type: "mrkdwn", text: `*Supermarket*\n${storeDisplay}` },
      ],
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Comment*\n${commentDisplay}`,
      },
    },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `🕒 ${new Date().toLocaleString()}` }],
    },
  ];

  try {
    await fetch(SLACK_GENERAL_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `New review for order #${orderDisplay} — ${ratingDisplay}/5`,
        blocks,
      }),
    });
  } catch (error) {
    console.error("Failed to send review notification to Slack", error);
  }
}

// --- Delayed order (system) notification ---

export type DelayedOrderStatus =
  | "PENDING"
  | "accepted"
  | "shopping"
  | "on_the_way"
  | string;

export interface DelayedOrderPayload {
  /** Order number for display (e.g. OrderID) */
  orderNumber: string;
  /** Order status */
  status: DelayedOrderStatus;
  /** Minutes until delivery_time (negative = already late) */
  minutesRemaining: number;
  /** Customer phone */
  customerPhone?: string;
  /** Shopper phone (when assigned) */
  shopperPhone?: string;
  /** Supermarket / store name */
  storeName?: string;
}

/**
 * Send a "delayed order / needs immediate attention" notification to Slack.
 * Called when an order has ≤2 minutes until it is late (or is already late).
 */
export async function notifyDelayedOrderToSlack(payload: DelayedOrderPayload) {
  if (!SLACK_GENERAL_WEBHOOK) {
    console.error("SLACK_GENERAL_WEBHOOK is not configured");
    return;
  }

  const orderDisplay = payload.orderNumber ?? "—";
  const storeDisplay = payload.storeName ?? "—";
  const customerPhone = payload.customerPhone ?? "—";
  const shopperPhone = payload.shopperPhone ?? "—";
  const status = (payload.status || "").toLowerCase();
  const isPending = status === "pending";
  const isAssigned =
    status === "accepted" ||
    status === "shopping" ||
    status === "on_the_way" ||
    status === "packing";

  const minutes = payload.minutesRemaining;
  const expiryText =
    minutes < 0
      ? "Already late"
      : minutes <= 1
      ? "Will expire in 1 minute"
      : `Will expire in ${Math.round(minutes)} minutes`;

  let statusLine: string;
  if (isPending) {
    statusLine = "Has been delayed and not yet assigned.";
  } else if (isAssigned) {
    statusLine = "Has been accepted and the shopper hasn't delivered it yet.";
  } else {
    statusLine = `Status: ${payload.status}.`;
  }

  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "⚠️ Order Late / Needs Immediate Attention",
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Order #*\n\`${orderDisplay}\`` },
        { type: "mrkdwn", text: `*Supermarket*\n${storeDisplay}` },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Status:* ${statusLine}`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*📞 Customer phone*\n${customerPhone}` },
        {
          type: "mrkdwn",
          text: `*📞 Shopper phone*\n${shopperPhone}`,
        },
      ],
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Needs immediate attention.* ${expiryText}.`,
      },
    },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `🕒 ${new Date().toLocaleString()}` }],
    },
  ];

  try {
    await fetch(SLACK_GENERAL_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `Order #${orderDisplay} is late or at risk — ${expiryText}`,
        blocks,
      }),
    });
  } catch (error) {
    console.error("Failed to send delayed order notification to Slack", error);
  }
}

// --- New store created (system) notification ---

export interface NewStoreCreatedPayload {
  /** Store name */
  storeName: string;
  /** Store description (can be HTML/rich text; will be trimmed for display) */
  description?: string;
  /** Latitude */
  latitude?: string;
  /** Longitude */
  longitude?: string;
  /** Image URL for Slack preview (must be public URL; base64 not supported in Slack image block) */
  imageUrl?: string;
  /** True when image was uploaded as base64 (no URL preview possible) */
  imageProvided?: boolean;
  /** Business / owner name (optional) */
  businessName?: string;
}

/**
 * Send a "new store created" notification to Slack with store info, description, and location.
 * Called after a business store is successfully created.
 */
export async function notifyNewStoreCreatedToSlack(
  payload: NewStoreCreatedPayload
) {
  if (!SLACK_GENERAL_WEBHOOK) {
    console.error("SLACK_GENERAL_WEBHOOK is not configured");
    return;
  }

  const nameDisplay = payload.storeName?.trim() ?? "—";
  const descRaw = payload.description?.trim() || "";
  const descDisplay = descRaw
    ? descRaw.replace(/<[^>]*>/g, "").slice(0, 500) +
      (descRaw.length > 500 ? "…" : "")
    : "_No description_";
  const lat = payload.latitude?.trim() ?? "";
  const lng = payload.longitude?.trim() ?? "";
  const locationDisplay =
    lat && lng
      ? `Lat: ${lat}, Lng: ${lng}\n<https://www.google.com/maps?q=${encodeURIComponent(
          lat + "," + lng
        )}|View on Google Maps>`
      : "—";
  const businessDisplay = payload.businessName?.trim() ?? "—";

  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🏪 New Store Created",
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Store name*\n${nameDisplay}` },
        { type: "mrkdwn", text: `*Business / owner*\n${businessDisplay}` },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Description*\n${descDisplay}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Location*\n${locationDisplay}`,
      },
    },
  ];

  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: `🕒 ${new Date().toLocaleString()}` }],
  });

  try {
    await fetch(SLACK_GENERAL_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `New store created: ${nameDisplay}`,
        blocks,
      }),
    });
  } catch (error) {
    console.error(
      "Failed to send new store created notification to Slack",
      error
    );
  }
}
