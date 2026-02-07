import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!hasuraClient) {
      return res.status(500).json({
        success: false,
        message: "Database client not available",
      });
    }

    // GraphQL query to get notification settings
    const query = `
      query GetShopperNotificationSettings($user_id: uuid!) {
        shopper_notification_settings(where: {user_id: {_eq: $user_id}}) {
          id
          user_id
          use_live_location
          custom_locations
          max_distance
          notification_types
          sound_settings
          created_at
          updated_at
        }
      }
    `;

    const variables = {
      user_id: user_id,
    };

    const response = (await hasuraClient.request(query, variables)) as any;

    return res.status(200).json({
      success: true,
      settings: response.shopper_notification_settings,
    });
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notification settings",
    });
  }
}
