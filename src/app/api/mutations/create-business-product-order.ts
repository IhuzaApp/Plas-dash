import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { notifyNewOrderToSlack } from "../../../src/lib/slackOrderNotifier";

function generateOrderPin(): number {
  return Math.floor(Math.random() * 100);
}

const GET_STORE_AND_USER = gql`
  query GetStoreAndUser($store_id: uuid!, $user_id: uuid!) {
    business_stores_by_pk(id: $store_id) {
      name
    }
    User_by_pk(id: $user_id) {
      phone
    }
  }
`;

const CREATE_BUSINESS_PRODUCT_ORDER = gql`
  mutation CreateBusinessProductOrder(
    $store_id: uuid!
    $allProducts: jsonb!
    $total: String!
    $transportation_fee: String!
    $service_fee: String!
    $units: String!
    $latitude: String!
    $longitude: String!
    $deliveryAddress: String!
    $comment: String
    $delivered_time: String
    $timeRange: String
    $ordered_by: uuid
    $status: String
    $shopper_id: uuid
    $pin: Int!
  ) {
    insert_businessProductOrders(
      objects: {
        store_id: $store_id
        allProducts: $allProducts
        total: $total
        transportation_fee: $transportation_fee
        service_fee: $service_fee
        units: $units
        latitude: $latitude
        longitude: $longitude
        deliveryAddress: $deliveryAddress
        comment: $comment
        delivered_time: $delivered_time
        timeRange: $timeRange
        ordered_by: $ordered_by
        status: $status
        shopper_id: $shopper_id
        pin: $pin
      }
    ) {
      affected_rows
      returning {
        id
      }
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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as Session | null;

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const {
      store_id,
      allProducts,
      total,
      transportation_fee,
      service_fee,
      units,
      latitude,
      longitude,
      deliveryAddress,
      comment,
      delivered_time,
      timeRange,
      ordered_by,
      status,
      await_momo_payment,
    } = req.body;

    if (!store_id || !allProducts || !total) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["store_id", "allProducts", "total"],
      });
    }

    // Ensure delivered_time and timeRange are strings, not null
    const deliveredTimeValue =
      delivered_time && delivered_time.trim() !== ""
        ? delivered_time
        : new Date(Date.now() + 60 * 60000).toISOString(); // Default: 1 hour from now

    const timeRangeValue =
      timeRange && timeRange.trim() !== "" ? timeRange : "Within 1-2 hours"; // Default time range

    // Prepare mutation variables
    const mutationVariables: any = {
      store_id,
      allProducts: Array.isArray(allProducts) ? allProducts : [],
      total: total.toString(),
      transportation_fee: transportation_fee?.toString() || "0",
      service_fee: service_fee?.toString() || "0",
      units: units?.toString() || "0",
      latitude: latitude || "",
      longitude: longitude || "",
      deliveryAddress: deliveryAddress || "",
      comment: comment || null,
      delivered_time: deliveredTimeValue,
      timeRange: timeRangeValue,
      status: status || "Pending",
      shopper_id: null, // Explicitly set shopper_id to null as per requirement
      pin: generateOrderPin(),
    };

    // Only add ordered_by if it's provided
    if (ordered_by && ordered_by.trim() !== "") {
      mutationVariables.ordered_by = ordered_by;
    }

    const result = await hasuraClient.request<{
      insert_businessProductOrders: {
        affected_rows: number;
        returning: Array<{ id: string }>;
      };
    }>(CREATE_BUSINESS_PRODUCT_ORDER, mutationVariables);

    if (result.insert_businessProductOrders.affected_rows === 0) {
      return res.status(500).json({ error: "Failed to create order" });
    }

    const createdOrder = result.insert_businessProductOrders.returning[0];
    const orderId = createdOrder?.id;

    let storeName: string | undefined;
    let customerPhone: string | undefined;
    if (orderId && ordered_by) {
      try {
        const storeUser = await hasuraClient.request<{
          business_stores_by_pk: { name: string } | null;
          User_by_pk: { phone: string | null } | null;
        }>(GET_STORE_AND_USER, { store_id, user_id: ordered_by });
        storeName = storeUser.business_stores_by_pk?.name;
        customerPhone = storeUser.User_by_pk?.phone ?? undefined;
      } catch (_) {
        // non-blocking
      }
    }

    // Defer Slack notification for MoMo orders until payment is confirmed
    if (!await_momo_payment) {
      void notifyNewOrderToSlack({
        id: orderId ?? "",
        orderID: orderId,
        total: total,
        orderType: "business",
        storeName,
        units,
        customerPhone,
        customerAddress: deliveryAddress || undefined,
        deliveryTime: timeRangeValue || delivered_time,
      });
    }

    return res.status(200).json({
      success: true,
      orderId: createdOrder?.id,
      affected_rows: result.insert_businessProductOrders.affected_rows,
    });
  } catch (error: any) {
    console.error("Error creating business product order:", error);
    return res.status(500).json({
      error: "Failed to create order",
      message: error.message,
    });
  }
}
