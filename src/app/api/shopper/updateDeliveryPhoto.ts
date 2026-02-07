import type { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

// GraphQL mutation to update the delivery photo URL
const UPDATE_DELIVERY_PHOTO = gql`
  mutation UpdateDeliveryPhoto($orderId: uuid!, $photoUrl: String!) {
    update_Orders_by_pk(
      pk_columns: { id: $orderId }
      _set: { delivery_photo_url: $photoUrl }
    ) {
      id
      delivery_photo_url
      updated_at
    }
  }
`;

type UpdatePhotoResponse = {
  update_Orders_by_pk: {
    id: string;
    delivery_photo_url: string;
    updated_at: string;
  } | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Get the user session
    const session = await getServerSession(req, res, authOptions as any);
    const userId = (session as any)?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized. Please log in.",
      });
    }

    // Extract data from the request body
    const { orderId, photoUrl } = req.body;

    // Validate required fields
    if (!orderId || !photoUrl) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: orderId and photoUrl are required",
      });
    }

    // Check if Hasura client is initialized
    if (!hasuraClient) {
      return res.status(500).json({
        success: false,
        error: "Database client not initialized",
      });
    }

    // Update the delivery photo URL in the database
    const result = await hasuraClient.request<UpdatePhotoResponse>(
      UPDATE_DELIVERY_PHOTO,
      {
        orderId,
        photoUrl,
      }
    );

    // Check if the update was successful
    if (!result.update_Orders_by_pk) {
      return res.status(404).json({
        success: false,
        error: "Order not found or update failed",
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Delivery photo updated successfully",
      data: {
        orderId: result.update_Orders_by_pk.id,
        photoUrl: result.update_Orders_by_pk.delivery_photo_url,
        updatedAt: result.update_Orders_by_pk.updated_at,
      },
    });
  } catch (error) {
    console.error("Error updating delivery photo:", error);

    // Return detailed error message
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
      message: "Failed to update delivery photo",
    });
  }
}
