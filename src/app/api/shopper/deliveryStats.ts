import type { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { logErrorToSlack } from "../../../src/lib/slackErrorReporter";

// GraphQL query to get order statistics for a shopper
const GET_DELIVERY_STATS = gql`
  query GetDeliveryStats($shopperId: uuid!) {
    # Get completed orders with shop details and order items
    Orders(
      where: { shopper_id: { _eq: $shopperId }, status: { _eq: "delivered" } }
    ) {
      id
      created_at
      updated_at
      shop_id
      Shop {
        id
        name
        address
        latitude
        longitude
      }
      Order_Items_aggregate {
        aggregate {
          sum {
            quantity
          }
          count
        }
      }
    }

    # Get distinct shops visited
    distinctShops: Orders(
      where: { shopper_id: { _eq: $shopperId }, status: { _eq: "delivered" } }
      distinct_on: shop_id
    ) {
      shop_id
    }

    # Get total order count
    completedOrdersCount: Orders_aggregate(
      where: { shopper_id: { _eq: $shopperId }, status: { _eq: "delivered" } }
    ) {
      aggregate {
        count
      }
    }
  }
`;

interface Shop {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

interface Order {
  id: string;
  created_at: string;
  updated_at: string;
  shop_id: string;
  Shop: Shop;
  Order_Items_aggregate: {
    aggregate: {
      sum: {
        quantity: number | null;
      } | null;
      count: number;
    } | null;
  };
}

interface GraphQLResponse {
  Orders: Order[];
  distinctShops: Array<{ shop_id: string }>;
  completedOrdersCount: {
    aggregate: {
      count: number;
    };
  };
}

// Function to calculate distance between two coordinates in kilometers
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;

  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Get session to identify the shopper
  const session = await getServerSession(req, res, authOptions as any);
  const userId = (session as any)?.user?.id;

  if (!userId) {
    return res
      .status(401)
      .json({ error: "You must be logged in as a shopper" });
  }

  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const data = await hasuraClient.request<GraphQLResponse>(
      GET_DELIVERY_STATS,
      {
        shopperId: userId,
      }
    );

    // Calculate total miles (converted to kilometers)
    let totalKilometers = 0;
    // Assume the shopper starts from a central location and returns there
    // This is a simplification - in a real app, you might have actual route data
    const shopCoordinates = data.Orders.filter(
      (order) => order.Shop && order.Shop.latitude && order.Shop.longitude
    ).map((order) => ({
      latitude: order.Shop.latitude as number,
      longitude: order.Shop.longitude as number,
    }));

    // Calculate rough distance by summing the distances between consecutive shops
    if (shopCoordinates.length > 0) {
      // Assume starting from the first shop
      let prevLat = shopCoordinates[0].latitude;
      let prevLon = shopCoordinates[0].longitude;

      // Calculate distance between consecutive shops
      shopCoordinates.slice(1).forEach((coord) => {
        totalKilometers += calculateDistance(
          prevLat,
          prevLon,
          coord.latitude,
          coord.longitude
        );
        prevLat = coord.latitude;
        prevLon = coord.longitude;
      });

      // Add 20% for actual routes (since direct lines underestimate real travel)
      totalKilometers *= 1.2;
    }

    // Calculate total items
    const totalItems = data.Orders.reduce((sum, order) => {
      const quantity =
        order.Order_Items_aggregate.aggregate?.sum?.quantity || 0;
      return sum + quantity;
    }, 0);

    // Calculate average time per order in minutes
    let totalMinutes = 0;
    data.Orders.forEach((order) => {
      const startTime = new Date(order.created_at);
      const endTime = new Date(order.updated_at);
      const minutesDiff =
        (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      totalMinutes += minutesDiff;
    });

    const orderCount = data.completedOrdersCount.aggregate.count;
    const avgTimePerOrder =
      orderCount > 0 ? Math.round(totalMinutes / orderCount) : 0;

    // Count unique stores visited
    const uniqueStores = data.distinctShops.length;

    return res.status(200).json({
      success: true,
      stats: {
        totalKilometers: Math.round(totalKilometers),
        totalItems,
        avgTimePerOrder,
        storesVisited: uniqueStores,
      },
    });
  } catch (error) {
    console.error("Error fetching delivery stats:", error);
    await logErrorToSlack("DeliveryStatsAPI", error, {
      userId,
      method: req.method,
    });
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch delivery stats",
    });
  }
}
