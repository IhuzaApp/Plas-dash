import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { logger } from "../../../src/utils/logger";

const GET_SHOPPER_AVAILABILITY = gql`
  query GetShopperAvailability($userId: uuid!) {
    Shopper_Availability(
      where: { user_id: { _eq: $userId } }
      order_by: { day_of_week: asc }
    ) {
      id
      user_id
      is_available
      created_at
      end_time
      day_of_week
      start_time
      updated_at
    }
  }
`;

interface ShopperAvailabilityResponse {
  Shopper_Availability: Array<{
    id: string;
    user_id: string;
    is_available: boolean;
    created_at: string;
    end_time: string;
    day_of_week: number;
    start_time: string;
    updated_at: string;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    logger.info(
      "Shopper availability request received",
      "ShopperAvailabilityAPI",
      {
        method: req.method,
        hasAuthHeader: Boolean(req.headers.authorization),
      }
    );

    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      logger.error("No session found", "ShopperAvailabilityAPI");
      return res.status(401).json({ error: "Unauthorized - No session found" });
    }

    if (!session.user?.id) {
      logger.error("No user ID in session", "ShopperAvailabilityAPI");
      return res.status(401).json({ error: "Unauthorized - No user ID found" });
    }

    if (!hasuraClient) {
      logger.error("Hasura client not initialized", "ShopperAvailabilityAPI");
      throw new Error("Hasura client is not initialized");
    }

    logger.info("Fetching availability from Hasura", "ShopperAvailabilityAPI", {
      userId: session.user.id,
    });

    const data = await hasuraClient.request<ShopperAvailabilityResponse>(
      GET_SHOPPER_AVAILABILITY,
      { userId: session.user.id }
    );

    logger.info("Shopper availability query result", "ShopperAvailabilityAPI", {
      userId: session.user.id,
      availabilityCount: data.Shopper_Availability.length,
      hasData: Boolean(data.Shopper_Availability),
      firstEntry: data.Shopper_Availability[0]
        ? {
            day_of_week: data.Shopper_Availability[0].day_of_week,
            is_available: data.Shopper_Availability[0].is_available,
          }
        : null,
    });

    return res
      .status(200)
      .json({ shopper_availability: data.Shopper_Availability });
  } catch (error) {
    logger.error(
      "Error fetching shopper availability",
      "ShopperAvailabilityAPI",
      error instanceof Error ? error.message : "Unknown error"
    );
    return res
      .status(500)
      .json({ error: "Failed to fetch shopper availability" });
  }
}
