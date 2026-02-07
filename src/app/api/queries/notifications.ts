import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_NOTIFICATIONS = gql`
  query GetNotifications {
    Notifications {
      id
      user_id
      message
      is_read
      created_at
      type
    }
  }
`;

interface NotificationsResponse {
  Notifications: Array<{
    id: string;
    user_id: string;
    message: string;
    is_read: boolean;
    created_at: string;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const data = await hasuraClient.request<NotificationsResponse>(
      GET_NOTIFICATIONS
    );
    res.status(200).json({ notifications: data.Notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
}
