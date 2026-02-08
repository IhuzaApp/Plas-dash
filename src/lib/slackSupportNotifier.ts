const SLACK_SUPPORT_WEBHOOK = process.env.SLACK_SUPPORT_WEBHOOK;

export interface SupportTicketPayload {
  /** Order ID (internal uuid) */
  orderId: string;
  /** Display order number (e.g. OrderID from DB) */
  orderDisplayId?: string;
  /** Order type: regular, reel, restaurant, business (store) */
  orderType: "regular" | "reel" | "restaurant" | "business";
  /** Store/shop/restaurant name */
  storeName?: string;
  /** Order status */
  status?: string;
  /** User's message */
  message: string;
  /** User email (optional) */
  userEmail?: string;
  /** User name (optional) */
  userName?: string;
  /** Customer phone (for support to call for urgency) */
  userPhone?: string;
  /** Ticket number from DB (shown in Slack instead of internal ID) */
  ticketNum?: number;
}

const ORDER_TYPE_LABELS: Record<SupportTicketPayload["orderType"], string> = {
  regular: "🛒 Regular",
  reel: "🎬 Reel",
  restaurant: "🍽️ Restaurant",
  business: "🏪 Store",
};

/**
 * Send a support ticket to Slack using SLACK_SUPPORT_WEBHOOK.
 * Designed for server-side (API route) only.
 */
export async function sendSupportTicketToSlack(ticket: SupportTicketPayload) {
  if (!SLACK_SUPPORT_WEBHOOK) {
    console.error("SLACK_SUPPORT_WEBHOOK is not configured");
    return;
  }

  const orderTypeLabel = ORDER_TYPE_LABELS[ticket.orderType];
  const displayId = ticket.orderDisplayId ?? ticket.orderId;
  const storeDisplay = ticket.storeName ?? "—";
  const statusDisplay = ticket.status ?? "—";
  const userDisplay = ticket.userName
    ? `${ticket.userName}${ticket.userEmail ? ` (${ticket.userEmail})` : ""}`
    : ticket.userEmail ?? "—";
  const phoneDisplay = ticket.userPhone ?? "—";
  const ticketDisplay = ticket.ticketNum != null ? `#${ticket.ticketNum}` : "—";

  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🎫 Support Ticket",
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Ticket #*\n\`${ticketDisplay}\`` },
        { type: "mrkdwn", text: `*Type*\n${orderTypeLabel}` },
      ],
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Order ID*\n\`${displayId}\`` },
        { type: "mrkdwn", text: `*Store / Shop*\n${storeDisplay}` },
      ],
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Order Status*\n${statusDisplay}` },
        { type: "mrkdwn", text: `*From*\n${userDisplay}` },
      ],
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*📞 Customer phone (call for urgency)*\n${phoneDisplay}`,
        },
      ],
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Message*\n${ticket.message || "_No message provided._"}`,
      },
    },
    { type: "divider" },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `🕒 ${new Date().toISOString()}` }],
    },
  ];

  try {
    await fetch(SLACK_SUPPORT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text:
          ticket.ticketNum != null
            ? `Support ticket #${ticket.ticketNum} (Order #${displayId})`
            : `Support ticket for order #${displayId}`,
        blocks,
      }),
    });
  } catch (error) {
    console.error("Failed to send support ticket to Slack", error);
    throw error;
  }
}

// --- New shopper registration (waiting for review) ---

export interface NewShopperRegistrationPayload {
  full_name: string;
  phone_number: string;
  address?: string;
  transport_mode: string;
  /** Optional docs / extras provided */
  provided: {
    profile_photo: boolean;
    national_id_photos: boolean;
    driving_license: boolean;
    police_clearance: boolean;
    guarantor: boolean;
    proof_of_residency: boolean;
    signature: boolean;
  };
}

const TRANSPORT_LABELS: Record<string, string> = {
  car: "Car",
  motorcycle: "Motorcycle",
  bicycle: "Bicycle",
  on_foot: "On foot",
};

function formatProvided(p: NewShopperRegistrationPayload["provided"]): string {
  const y = (v: boolean) => (v ? "✅" : "❌");
  return [
    `• Profile photo: ${y(p.profile_photo)}`,
    `• National ID photos: ${y(p.national_id_photos)}`,
    `• Driving license: ${y(p.driving_license)}`,
    `• Police clearance: ${y(p.police_clearance)}`,
    `• Guarantor: ${y(p.guarantor)}`,
    `• Proof of residency: ${y(p.proof_of_residency)}`,
    `• Signature: ${y(p.signature)}`,
  ].join("\n");
}

/**
 * Notify Slack that a new shopper has registered and is waiting for review.
 * Shows name, phone, address, transport, and whether they provided all optional docs.
 */
export async function sendNewShopperRegistrationToSlack(
  payload: NewShopperRegistrationPayload
) {
  if (!SLACK_SUPPORT_WEBHOOK) {
    console.error("SLACK_SUPPORT_WEBHOOK is not configured");
    return;
  }

  const transportDisplay =
    TRANSPORT_LABELS[payload.transport_mode] ?? payload.transport_mode;
  const addressDisplay = payload.address?.trim() || "—";
  const providedText = formatProvided(payload.provided);

  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🛒 New shopper registered – waiting for review",
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Name*\n${payload.full_name}` },
        { type: "mrkdwn", text: `*Phone*\n${payload.phone_number}` },
      ],
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Address*\n${addressDisplay}` },
        { type: "mrkdwn", text: `*Transportation*\n${transportDisplay}` },
      ],
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Provided everything*\n${providedText}`,
      },
    },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `🕒 ${new Date().toISOString()}` }],
    },
  ];

  try {
    await fetch(SLACK_SUPPORT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `New shopper: ${payload.full_name} – waiting for review`,
        blocks,
      }),
    });
  } catch (error) {
    console.error("Failed to send new shopper registration to Slack", error);
    throw error;
  }
}

// --- New business account registration (waiting for review) ---

export interface NewBusinessAccountRegistrationPayload {
  account_type: "personal" | "business";
  /** Business or trading name */
  business_name: string;
  /** Contact person name (e.g. session user name) */
  contact_name?: string;
  email: string;
  phone: string;
  business_location?: string;
  /** What was provided (for "everything shared" checklist) */
  provided: {
    business_name: boolean;
    business_email: boolean;
    business_phone: boolean;
    business_location: boolean;
    rdb_certificate: boolean;
    id_image: boolean;
    face_image: boolean;
  };
}

function formatBusinessProvided(
  p: NewBusinessAccountRegistrationPayload["provided"]
): string {
  const y = (v: boolean) => (v ? "✅" : "❌");
  return [
    `• Business name: ${y(p.business_name)}`,
    `• Email: ${y(p.business_email)}`,
    `• Phone: ${y(p.business_phone)}`,
    `• Business location: ${y(p.business_location)}`,
    `• RDB certificate: ${y(p.rdb_certificate)}`,
    `• ID image: ${y(p.id_image)}`,
    `• Face photo: ${y(p.face_image)}`,
  ].join("\n");
}

/**
 * Notify Slack that a new business account has been registered and is waiting for review.
 * Shows account type, name (personal/business), email, phone, location, and what was shared.
 */
export async function sendNewBusinessAccountRegistrationToSlack(
  payload: NewBusinessAccountRegistrationPayload
) {
  if (!SLACK_SUPPORT_WEBHOOK) {
    console.error("SLACK_SUPPORT_WEBHOOK is not configured");
    return;
  }

  const accountLabel =
    payload.account_type === "personal"
      ? "Personal account"
      : "Business account";
  const nameDisplay = payload.contact_name
    ? `${payload.business_name} (Contact: ${payload.contact_name})`
    : payload.business_name;
  const locationDisplay = payload.business_location?.trim() || "—";
  const providedText = formatBusinessProvided(payload.provided);

  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🏢 New business account registered – waiting for review",
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Account type*\n${accountLabel}` },
        { type: "mrkdwn", text: `*Name*\n${nameDisplay}` },
      ],
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Email*\n${payload.email || "—"}` },
        { type: "mrkdwn", text: `*Phone*\n${payload.phone || "—"}` },
      ],
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Business location*\n${locationDisplay}`,
        },
      ],
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Everything shared*\n${providedText}`,
      },
    },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `🕒 ${new Date().toISOString()}` }],
    },
  ];

  try {
    await fetch(SLACK_SUPPORT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `New business account: ${payload.business_name} (${accountLabel}) – waiting for review`,
        blocks,
      }),
    });
  } catch (error) {
    console.error(
      "Failed to send new business account registration to Slack",
      error
    );
    throw error;
  }
}

// --- New store product – pending review (support enables) ---

export interface NewStoreProductForReviewPayload {
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  price?: string;
  unit?: string;
  category?: string;
  queryId?: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  userId?: string;
  businessAccountId?: string;
}

/**
 * Notify Slack when a new store product is added and is pending review.
 * Support can review and enable the product for that shop.
 */
export async function sendNewStoreProductForReviewToSlack(
  payload: NewStoreProductForReviewPayload
) {
  if (!SLACK_SUPPORT_WEBHOOK) {
    console.error("SLACK_SUPPORT_WEBHOOK is not configured");
    return;
  }

  const userDisplay = payload.userName
    ? `${payload.userName}${payload.userEmail ? ` (${payload.userEmail})` : ""}`
    : payload.userEmail ?? "—";
  const phoneDisplay = payload.userPhone ?? "—";
  const priceDisplay =
    payload.price != null && payload.unit
      ? `${payload.price} / ${payload.unit}`
      : payload.price ?? "—";
  const categoryDisplay = payload.category?.trim() || "—";
  const queryDisplay = payload.queryId?.trim() || "—";

  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "📦 New store product – pending review",
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Product*\n${payload.productName}` },
        { type: "mrkdwn", text: `*Product ID*\n\`${payload.productId}\`` },
      ],
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Store*\n${payload.storeName}` },
        { type: "mrkdwn", text: `*Store ID*\n\`${payload.storeId}\`` },
      ],
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Price*\n${priceDisplay}` },
        { type: "mrkdwn", text: `*Category*\n${categoryDisplay}` },
      ],
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Added by*\n${userDisplay}` },
        {
          type: "mrkdwn",
          text: `*📞 Phone*\n${phoneDisplay}`,
        },
      ],
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Verification ID*\n\`${queryDisplay}\``,
        },
        {
          type: "mrkdwn",
          text: `*Business account ID*\n\`${
            payload.businessAccountId ?? "—"
          }\``,
        },
      ],
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `User ID: \`${
            payload.userId ?? "—"
          }\` · 🕒 ${new Date().toISOString()} · _Review and enable this product for the store._`,
        },
      ],
    },
  ];

  try {
    await fetch(SLACK_SUPPORT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `New product pending review: ${payload.productName} @ ${payload.storeName}`,
        blocks,
      }),
    });
  } catch (error) {
    console.error(
      "Failed to send new store product for review to Slack",
      error
    );
    throw error;
  }
}

// --- Request to enable store (store was disabled by owner, support re-enables) ---

export interface RequestEnableStorePayload {
  storeId: string;
  storeName: string;
  /** Optional message from the owner */
  message?: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  userId?: string;
  businessAccountId?: string;
}

/**
 * Notify Slack when a store owner requests to re-enable their disabled store.
 */
export async function sendRequestEnableStoreToSlack(
  payload: RequestEnableStorePayload
) {
  if (!SLACK_SUPPORT_WEBHOOK) {
    console.error("SLACK_SUPPORT_WEBHOOK is not configured");
    return;
  }

  const userDisplay = payload.userName
    ? `${payload.userName}${payload.userEmail ? ` (${payload.userEmail})` : ""}`
    : payload.userEmail ?? "—";
  const phoneDisplay = payload.userPhone ?? "—";

  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🏪 Request to enable store",
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Store*\n${payload.storeName}` },
        { type: "mrkdwn", text: `*Store ID*\n\`${payload.storeId}\`` },
      ],
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Requested by*\n${userDisplay}` },
        {
          type: "mrkdwn",
          text: `*📞 Phone*\n${phoneDisplay}`,
        },
      ],
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Business account ID*\n\`${
            payload.businessAccountId ?? "—"
          }\``,
        },
      ],
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Message*\n${
          payload.message?.trim() || "_No additional message._"
        }`,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `User ID: \`${
            payload.userId ?? "—"
          }\` · 🕒 ${new Date().toISOString()}`,
        },
      ],
    },
  ];

  try {
    await fetch(SLACK_SUPPORT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `Request to enable store: ${payload.storeName}`,
        blocks,
      }),
    });
  } catch (error) {
    console.error("Failed to send request enable store to Slack", error);
    throw error;
  }
}

// --- Rejected business account – contact support / re-evaluation request ---

export interface RejectedAccountSupportPayload {
  /** User's message (e.g. "I believe this is a mistake because...") */
  message: string;
  /** Priority: low, medium, high */
  priority: "low" | "medium" | "high";
  /** User email (from session or business account) */
  userEmail?: string;
  /** User / contact name */
  userName?: string;
  /** User ID (internal) */
  userId?: string;
  /** Business account ID if available */
  businessAccountId?: string;
}

const PRIORITY_LABELS: Record<
  RejectedAccountSupportPayload["priority"],
  string
> = {
  low: "🟢 Low",
  medium: "🟡 Medium",
  high: "🔴 High",
};

/**
 * Notify Slack when a user with a rejected business account submits a contact-support / re-evaluation request.
 */
export async function sendRejectedAccountSupportRequestToSlack(
  payload: RejectedAccountSupportPayload
) {
  if (!SLACK_SUPPORT_WEBHOOK) {
    console.error("SLACK_SUPPORT_WEBHOOK is not configured");
    return;
  }

  const priorityLabel = PRIORITY_LABELS[payload.priority];
  const userDisplay = payload.userName
    ? `${payload.userName}${payload.userEmail ? ` (${payload.userEmail})` : ""}`
    : payload.userEmail ?? "—";
  const ownerNameDisplay = payload.userName ?? "—";
  const businessIdDisplay = payload.businessAccountId ?? "—";

  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🚫 Rejected account – contact support / re-evaluation request",
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Priority*\n${priorityLabel}` },
        { type: "mrkdwn", text: `*From*\n${userDisplay}` },
      ],
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Account owner*\n${ownerNameDisplay}` },
        {
          type: "mrkdwn",
          text: `*Business account ID*\n\`${businessIdDisplay}\``,
        },
      ],
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Message*\n${payload.message || "_No message provided._"}`,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `User ID: \`${
            payload.userId ?? "—"
          }\` · 🕒 ${new Date().toISOString()}`,
        },
      ],
    },
  ];

  try {
    await fetch(SLACK_SUPPORT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `Rejected account support request (${priorityLabel}) from ${ownerNameDisplay}`,
        blocks,
      }),
    });
  } catch (error) {
    console.error(
      "Failed to send rejected account support request to Slack",
      error
    );
    throw error;
  }
}
