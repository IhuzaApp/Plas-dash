import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

// GraphQL mutation to update regular order with delivery photo and updated_at
const UPDATE_ORDER_DELIVERY_PHOTO = gql`
  mutation UpdateOrderDeliveryPhoto(
    $order_id: uuid!
    $delivery_photo_url: String!
    $updated_at: timestamptz!
  ) {
    update_Orders(
      where: { id: { _eq: $order_id } }
      _set: { delivery_photo_url: $delivery_photo_url, updated_at: $updated_at }
    ) {
      affected_rows
    }
  }
`;

// GraphQL mutation to update reel order with delivery photo and updated_at
const UPDATE_REEL_ORDER_DELIVERY_PHOTO = gql`
  mutation UpdateReelOrderDeliveryPhoto(
    $order_id: uuid!
    $delivery_photo_url: String!
    $updated_at: timestamptz!
  ) {
    update_reel_orders(
      where: { id: { _eq: $order_id } }
      _set: { delivery_photo_url: $delivery_photo_url, updated_at: $updated_at }
    ) {
      affected_rows
    }
  }
`;

// GraphQL mutation to update restaurant order with delivery photo and updated_at
const UPDATE_RESTAURANT_ORDER_DELIVERY_PHOTO = gql`
  mutation UpdateRestaurantOrderDeliveryPhoto(
    $order_id: uuid!
    $delivery_photo_url: String!
    $updated_at: timestamptz!
  ) {
    update_restaurant_orders(
      where: { id: { _eq: $order_id } }
      _set: { delivery_photo_url: $delivery_photo_url, updated_at: $updated_at }
    ) {
      affected_rows
    }
  }
`;

// GraphQL query to check if order is delivered
const CHECK_ORDER_STATUS = gql`
  query CheckOrderStatus($orderId: uuid!) {
    Orders_by_pk(id: $orderId) {
      id
      status
    }
  }
`;

// GraphQL query to check if reel order is delivered
const CHECK_REEL_ORDER_STATUS = gql`
  query CheckReelOrderStatus($orderId: uuid!) {
    reel_orders_by_pk(id: $orderId) {
      id
      status
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify the user is authenticated
    const session = (await getServerSession(req, res, authOptions as any)) as {
      user?: any;
    };
    if (!session || !session.user) {
      return res
        .status(401)
        .json({ error: "You must be authenticated to upload delivery photos" });
    }

    // Get the order ID, photo data, updated_at, and order type from the request
    const { orderId, file, updatedAt, orderType = "regular" } = req.body;

    if (!orderId || !file || !updatedAt) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Convert base64 to a data URL if it's not already
    const photoUrl = file.startsWith("data:")
      ? file
      : `data:image/jpeg;base64,${file}`;

    // Check hasuraClient is not null
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const isReelOrder = orderType === "reel";
    const isRestaurantOrder = orderType === "restaurant";

    // Update the order with the delivery photo and updated_at based on order type
    let data: any;

    if (isReelOrder) {
      // Update reel order
      type UpdateReelOrderDeliveryPhotoResponse = {
        update_reel_orders: {
          affected_rows: number;
        };
      };
      data = await hasuraClient.request<UpdateReelOrderDeliveryPhotoResponse>(
        UPDATE_REEL_ORDER_DELIVERY_PHOTO,
        {
          order_id: orderId,
          delivery_photo_url: photoUrl,
          updated_at: updatedAt,
        }
      );
    } else if (isRestaurantOrder) {
      // Update restaurant order
      type UpdateRestaurantOrderDeliveryPhotoResponse = {
        update_restaurant_orders: {
          affected_rows: number;
        };
      };
      data =
        await hasuraClient.request<UpdateRestaurantOrderDeliveryPhotoResponse>(
          UPDATE_RESTAURANT_ORDER_DELIVERY_PHOTO,
          {
            order_id: orderId,
            delivery_photo_url: photoUrl,
            updated_at: updatedAt,
          }
        );
    } else {
      // Update regular order
      type UpdateOrderDeliveryPhotoResponse = {
        update_Orders: {
          affected_rows: number;
        };
      };
      data = await hasuraClient.request<UpdateOrderDeliveryPhotoResponse>(
        UPDATE_ORDER_DELIVERY_PHOTO,
        {
          order_id: orderId,
          delivery_photo_url: photoUrl,
          updated_at: updatedAt,
        }
      );
    }

    // Check if the update was successful
    const affectedRows = isReelOrder
      ? data.update_reel_orders.affected_rows
      : isRestaurantOrder
      ? data.update_restaurant_orders.affected_rows
      : data.update_Orders.affected_rows;

    if (affectedRows === 0) {
      return res.status(404).json({
        error: "Order not found or update failed",
      });
    }

    // Note: Revenue calculation is now handled separately in updateOrderStatus.ts
    // - Commission revenue is added when status = "shopping"
    // - Plasa fee revenue is added when status = "delivered"
    // No revenue calculation needed here for photo upload

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Delivery photo uploaded successfully",
      data: {
        orderId,
        photoUrl,
        updatedAt,
        orderType,
      },
    });
  } catch (error) {
    console.error("Error uploading delivery photo:", error);
    return res.status(500).json({
      error: "Failed to upload delivery photo",
    });
  }
}
