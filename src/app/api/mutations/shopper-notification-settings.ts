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

    const {
      user_id,
      use_live_location,
      custom_locations,
      max_distance,
      notification_types,
      sound_settings,
    } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!hasuraClient) {
      return res.status(500).json({
        success: false,
        message: "Database client not available",
      });
    }

    // Check if settings already exist for this user
    const checkQuery = `
      query CheckExistingSettings($user_id: uuid!) {
        shopper_notification_settings(where: {user_id: {_eq: $user_id}}) {
          id
        }
      }
    `;

    const checkResponse = (await hasuraClient.request(checkQuery, {
      user_id,
    })) as any;
    const existingSettings = checkResponse.shopper_notification_settings;

    let result;

    if (existingSettings && existingSettings.length > 0) {
      // Update existing settings
      const updateQuery = `
        mutation UpdateShopperNotificationSettings(
          $id: uuid!
          $use_live_location: Boolean!
          $custom_locations: jsonb!
          $max_distance: String!
          $notification_types: jsonb!
          $sound_settings: jsonb!
        ) {
          update_shopper_notification_settings_by_pk(
            pk_columns: { id: $id }
            _set: {
              use_live_location: $use_live_location
              custom_locations: $custom_locations
              max_distance: $max_distance
              notification_types: $notification_types
              sound_settings: $sound_settings
              updated_at: "now()"
            }
          ) {
            id
            user_id
            use_live_location
            custom_locations
            max_distance
            notification_types
            sound_settings
            updated_at
          }
        }
      `;

      const updateVariables = {
        id: existingSettings[0].id,
        use_live_location:
          use_live_location !== undefined ? use_live_location : true,
        custom_locations: custom_locations || [],
        max_distance: max_distance || "10",
        notification_types: notification_types || {
          orders: true,
          batches: true,
          earnings: true,
          system: true,
        },
        sound_settings: sound_settings || {
          enabled: true,
          volume: 0.8,
        },
      };

      result = (await hasuraClient.request(
        updateQuery,
        updateVariables
      )) as any;
    } else {
      // Insert new settings
      const insertQuery = `
        mutation InsertShopperNotificationSettings(
          $user_id: uuid!
          $use_live_location: Boolean!
          $custom_locations: jsonb!
          $max_distance: String!
          $notification_types: jsonb!
          $sound_settings: jsonb!
        ) {
          insert_shopper_notification_settings_one(object: {
            user_id: $user_id
            use_live_location: $use_live_location
            custom_locations: $custom_locations
            max_distance: $max_distance
            notification_types: $notification_types
            sound_settings: $sound_settings
          }) {
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

      const insertVariables = {
        user_id,
        use_live_location:
          use_live_location !== undefined ? use_live_location : true,
        custom_locations: custom_locations || [],
        max_distance: max_distance || "10",
        notification_types: notification_types || {
          orders: true,
          batches: true,
          earnings: true,
          system: true,
        },
        sound_settings: sound_settings || {
          enabled: true,
          volume: 0.8,
        },
      };

      result = (await hasuraClient.request(
        insertQuery,
        insertVariables
      )) as any;
    }

    return res.status(200).json({
      success: true,
      message: "Notification settings saved successfully",
      settings:
        result.insert_shopper_notification_settings_one ||
        result.update_shopper_notification_settings_by_pk,
    });
  } catch (error) {
    console.error("Error saving notification settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save notification settings",
    });
  }
}
