/**
 * Marketplace notification counts (RFQ responses, new RFQs, business orders, incomplete orders).
 * Sends push notifications via fcmService when user has updates; clients receive via fcmClient
 * (useFCMNotifications) and can refetch on "fcm-marketplace-update" event.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { sendNotificationToUser } from "../../../src/services/fcmService";

// Throttle: send at most one marketplace FCM per user per 5 minutes
const lastMarketplaceNotifyAt = new Map<string, number>();
const MARKETPLACE_NOTIFY_THROTTLE_MS = 5 * 60 * 1000;

const GET_RFQ_RESPONSES_COUNT = gql`
  query GetRFQResponsesCount($user_id: uuid!, $seven_days_ago: timestamptz!) {
    bussines_RFQ(
      where: {
        user_id: { _eq: $user_id }
        open: { _eq: true }
        created_at: { _gte: $seven_days_ago }
      }
    ) {
      id
    }
  }
`;

const GET_RFQ_RESPONSES = gql`
  query GetRFQResponses($rfq_ids: [uuid!]!) {
    BusinessQoute(
      where: {
        businessRfq_id: { _in: $rfq_ids }
        status: { _nin: ["rejected", "cancelled"] }
      }
    ) {
      id
      businessRfq_id
    }
  }
`;

const GET_NEW_RFQS_COUNT = gql`
  query GetNewRFQsCount($seven_days_ago: timestamptz!) {
    bussines_RFQ(
      where: { open: { _eq: true }, created_at: { _gte: $seven_days_ago } }
    ) {
      id
    }
  }
`;

const GET_INCOMPLETE_ORDERS_COUNT = gql`
  query GetIncompleteOrdersCount(
    $user_id: uuid!
    $seven_days_ago: timestamptz!
  ) {
    Orders(
      where: {
        user_id: { _eq: $user_id }
        status: { _nin: ["delivered", "cancelled", "completed"] }
        created_at: { _gte: $seven_days_ago }
      }
    ) {
      id
    }
    restaurant_orders(
      where: {
        user_id: { _eq: $user_id }
        status: { _nin: ["delivered", "cancelled", "completed"] }
        created_at: { _gte: $seven_days_ago }
      }
    ) {
      id
    }
    reel_orders(
      where: {
        user_id: { _eq: $user_id }
        status: { _nin: ["delivered", "cancelled", "completed"] }
        created_at: { _gte: $seven_days_ago }
      }
    ) {
      id
    }
  }
`;

const GET_NEW_BUSINESS_PRODUCT_ORDERS_COUNT = gql`
  query GetNewBusinessProductOrdersCount($seven_days_ago: timestamptz!) {
    businessProductOrders(where: { created_at: { _gte: $seven_days_ago } }) {
      id
      created_at
    }
  }
`;

interface SessionUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

interface Session {
  user: SessionUser;
  expires: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as Session | null;

    if (!session || !session.user) {
      return res.status(200).json({
        rfqResponsesCount: 0,
        incompleteOrdersCount: 0,
        newRFQsCount: 0,
        newBusinessOrdersCount: 0,
        totalCount: 0,
      });
    }

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const userId = session.user.id;

    // Calculate 7 days ago timestamp
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    // Fetch user's open RFQs created in last 7 days
    const rfqResult = await hasuraClient.request<{
      bussines_RFQ: Array<{
        id: string;
      }>;
    }>(GET_RFQ_RESPONSES_COUNT, {
      user_id: userId,
      seven_days_ago: sevenDaysAgoISO,
    });

    // Fetch responses for those RFQs
    let rfqResponsesCount = 0;
    if (rfqResult.bussines_RFQ.length > 0) {
      const rfqIds = rfqResult.bussines_RFQ.map((rfq) => rfq.id);
      const responsesResult = await hasuraClient.request<{
        BusinessQoute: Array<{
          id: string;
          businessRfq_id: string;
        }>;
      }>(GET_RFQ_RESPONSES, {
        rfq_ids: rfqIds,
      });

      rfqResponsesCount = responsesResult.BusinessQoute?.length || 0;
    }

    // Fetch new RFQs created in last 7 days (all users)
    const newRFQsResult = await hasuraClient.request<{
      bussines_RFQ: Array<{
        id: string;
      }>;
    }>(GET_NEW_RFQS_COUNT, {
      seven_days_ago: sevenDaysAgoISO,
    });

    const newRFQsCount = newRFQsResult.bussines_RFQ?.length || 0;

    // Fetch incomplete orders count (user's orders created in last 7 days)
    const ordersResult = await hasuraClient.request<{
      Orders: Array<{ id: string }>;
      restaurant_orders: Array<{ id: string }>;
      reel_orders: Array<{ id: string }>;
    }>(GET_INCOMPLETE_ORDERS_COUNT, {
      user_id: userId,
      seven_days_ago: sevenDaysAgoISO,
    });

    const incompleteOrdersCount =
      (ordersResult.Orders?.length || 0) +
      (ordersResult.restaurant_orders?.length || 0) +
      (ordersResult.reel_orders?.length || 0);

    // Fetch new business product orders created in last 7 days (all orders)
    const newBusinessOrdersResult = await hasuraClient.request<{
      businessProductOrders: Array<{
        id: string;
        created_at: string;
      }>;
    }>(GET_NEW_BUSINESS_PRODUCT_ORDERS_COUNT, {
      seven_days_ago: sevenDaysAgoISO,
    });

    const newBusinessOrdersCount =
      newBusinessOrdersResult.businessProductOrders?.length || 0;

    // Total count: RFQ responses + incomplete orders + new RFQs + new business orders
    const totalCount =
      rfqResponsesCount +
      incompleteOrdersCount +
      newRFQsCount +
      newBusinessOrdersCount;

    // Notify user via FCM when they have marketplace updates (throttled)
    if (totalCount > 0) {
      const lastSent = lastMarketplaceNotifyAt.get(userId) ?? 0;
      if (Date.now() - lastSent >= MARKETPLACE_NOTIFY_THROTTLE_MS) {
        try {
          await sendNotificationToUser(userId, {
            title: "Marketplace updates",
            body:
              totalCount === 1
                ? "You have 1 new marketplace update"
                : `You have ${totalCount} new marketplace updates`,
            data: {
              type: "marketplace_update",
              totalCount: String(totalCount),
              rfqResponsesCount: String(rfqResponsesCount),
              newRFQsCount: String(newRFQsCount),
              newBusinessOrdersCount: String(newBusinessOrdersCount),
              incompleteOrdersCount: String(incompleteOrdersCount),
            },
          });
          lastMarketplaceNotifyAt.set(userId, Date.now());
        } catch (fcmErr: any) {
          console.warn(
            "Marketplace FCM notify failed:",
            fcmErr?.message || fcmErr
          );
        }
      }
    }

    return res.status(200).json({
      rfqResponsesCount,
      incompleteOrdersCount,
      newRFQsCount,
      newBusinessOrdersCount,
      totalCount,
    });
  } catch (error: any) {
    // Check if it's a server error (502, 520, 503, 504, etc.) - Hasura/Cloudflare issues
    const serverErrorStatus =
      error?.response?.status || error?.response?.statusCode;
    const isServerError =
      serverErrorStatus >= 500 ||
      serverErrorStatus === 520 ||
      error?.message?.includes("502") ||
      error?.message?.includes("520") ||
      error?.message?.includes("503") ||
      error?.message?.includes("504");

    // Only log non-server errors (client errors, etc.)
    if (!isServerError) {
      console.error(
        "Error fetching marketplace notifications:",
        error.message || error
      );
    }

    // For server errors, return 200 with default values (graceful degradation)
    // For other errors, return 500
    const statusCode = isServerError ? 200 : 500;

    return res.status(statusCode).json({
      error: isServerError
        ? "service_unavailable"
        : "Failed to fetch notifications",
      message: isServerError
        ? "Service temporarily unavailable"
        : error.message,
      rfqResponsesCount: 0,
      incompleteOrdersCount: 0,
      newRFQsCount: 0,
      newBusinessOrdersCount: 0,
      totalCount: 0,
    });
  }
}
