import type { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

// GraphQL query to fetch today's completed orders with full details
const GET_TODAY_COMPLETED_ORDERS = gql`
  query GetTodayCompletedOrders(
    $shopper_id: uuid!
    $today_start: timestamptz!
    $today_end: timestamptz!
  ) {
    Orders(
      where: {
        shopper_id: { _eq: $shopper_id }
        status: { _eq: "delivered" }
        updated_at: { _gte: $today_start, _lte: $today_end }
      }
      order_by: { updated_at: desc }
    ) {
      id
      service_fee
      delivery_fee
      total
      updated_at
      created_at
      user_id
      Shop {
        name
        address
        latitude
        longitude
      }
      Address {
        street
        city
        latitude
        longitude
      }
      Order_Items_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`;

// GraphQL query for reel orders
const GET_TODAY_COMPLETED_REEL_ORDERS = gql`
  query GetTodayCompletedReelOrders(
    $shopper_id: uuid!
    $today_start: timestamptz!
    $today_end: timestamptz!
  ) {
    reel_orders(
      where: {
        shopper_id: { _eq: $shopper_id }
        status: { _eq: "delivered" }
        updated_at: { _gte: $today_start, _lte: $today_end }
      }
      order_by: { updated_at: desc }
    ) {
      id
      service_fee
      delivery_fee
      total
      quantity
      updated_at
      created_at
      Reel {
        title
      }
      address: Address {
        street
        city
        latitude
        longitude
      }
      user: User {
        name
      }
    }
  }
`;

// GraphQL query for restaurant orders
const GET_TODAY_COMPLETED_RESTAURANT_ORDERS = gql`
  query GetTodayCompletedRestaurantOrders(
    $shopper_id: uuid!
    $today_start: timestamptz!
    $today_end: timestamptz!
  ) {
    restaurant_orders(
      where: {
        shopper_id: { _eq: $shopper_id }
        status: { _eq: "delivered" }
        updated_at: { _gte: $today_start, _lte: $today_end }
      }
      order_by: { updated_at: desc }
    ) {
      id
      delivery_fee
      total
      delivery_time
      updated_at
      created_at
      Restaurant {
        name
        location
        lat
        long
      }
      Address {
        street
        city
        latitude
        longitude
      }
      orderedBy {
        name
      }
    }
  }
`;

// Helper function to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get session to identify the shopper
    const session = await getServerSession(req, res, authOptions as any);
    const shopperId = (session as any)?.user?.id;

    if (!shopperId) {
      return res
        .status(401)
        .json({ error: "You must be logged in as a shopper" });
    }

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Calculate today's date range in the local timezone
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0
    );
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );

    // Fetch all order types in parallel
    const [regularOrdersData, reelOrdersData, restaurantOrdersData] =
      await Promise.all([
        hasuraClient.request<{ Orders: any[] }>(GET_TODAY_COMPLETED_ORDERS, {
          shopper_id: shopperId,
          today_start: todayStart.toISOString(),
          today_end: todayEnd.toISOString(),
        }),
        hasuraClient.request<{ reel_orders: any[] }>(
          GET_TODAY_COMPLETED_REEL_ORDERS,
          {
            shopper_id: shopperId,
            today_start: todayStart.toISOString(),
            today_end: todayEnd.toISOString(),
          }
        ),
        hasuraClient.request<{ restaurant_orders: any[] }>(
          GET_TODAY_COMPLETED_RESTAURANT_ORDERS,
          {
            shopper_id: shopperId,
            today_start: todayStart.toISOString(),
            today_end: todayEnd.toISOString(),
          }
        ),
      ]);

    let totalEarnings = 0;
    const allOrders: any[] = [];

    // Process regular orders
    regularOrdersData.Orders.forEach((order) => {
      const serviceFee = parseFloat(order.service_fee || "0");
      const deliveryFee = parseFloat(order.delivery_fee || "0");
      const earnings = serviceFee + deliveryFee;
      totalEarnings += earnings;

      // Calculate distance if coordinates available
      let distance = 0;
      if (
        order.Shop?.latitude &&
        order.Shop?.longitude &&
        order.Address?.latitude &&
        order.Address?.longitude
      ) {
        distance = calculateDistance(
          parseFloat(order.Shop.latitude),
          parseFloat(order.Shop.longitude),
          parseFloat(order.Address.latitude),
          parseFloat(order.Address.longitude)
        );
      }

      allOrders.push({
        id: order.id,
        shopName: order.Shop?.name || "Unknown Shop",
        shopAddress: order.Shop?.address || "No address",
        customerAddress: `${order.Address?.street || ""}, ${
          order.Address?.city || ""
        }`.trim(),
        customerName: "Customer",
        distance: distance.toFixed(2),
        itemsCount: order.Order_Items_aggregate?.aggregate?.count || 0,
        total: order.total || "0",
        earnings: earnings.toString(),
        deliveryFee: deliveryFee.toString(),
        completedAt: order.updated_at,
        deliveredAt: order.updated_at,
        orderType: "regular",
      });
    });

    // Process reel orders
    reelOrdersData.reel_orders.forEach((order) => {
      const serviceFee = parseFloat(order.service_fee || "0");
      const deliveryFee = parseFloat(order.delivery_fee || "0");
      const earnings = serviceFee + deliveryFee;
      totalEarnings += earnings;

      allOrders.push({
        id: order.id,
        shopName: order.Reel?.title || "Reel Order",
        shopAddress: "Reel Product",
        customerAddress: `${order.address?.street || ""}, ${
          order.address?.city || ""
        }`.trim(),
        customerName: order.user?.name || "Customer",
        distance: "0",
        itemsCount: order.quantity || 1,
        total: order.total || "0",
        earnings: earnings.toString(),
        deliveryFee: deliveryFee.toString(),
        completedAt: order.updated_at,
        deliveredAt: order.updated_at,
        orderType: "reel",
      });
    });

    // Process restaurant orders
    restaurantOrdersData.restaurant_orders.forEach((order) => {
      const deliveryFee = parseFloat(order.delivery_fee || "0");
      totalEarnings += deliveryFee;

      // Calculate distance if coordinates available
      let distance = 0;
      if (
        order.Restaurant?.lat &&
        order.Restaurant?.long &&
        order.Address?.latitude &&
        order.Address?.longitude
      ) {
        distance = calculateDistance(
          parseFloat(order.Restaurant.lat),
          parseFloat(order.Restaurant.long),
          parseFloat(order.Address.latitude),
          parseFloat(order.Address.longitude)
        );
      }

      allOrders.push({
        id: order.id,
        shopName: order.Restaurant?.name || "Restaurant",
        restaurantName: order.Restaurant?.name || "Restaurant",
        shopAddress: order.Restaurant?.location || "No address",
        restaurantAddress: order.Restaurant?.location || "No address",
        customerAddress: `${order.Address?.street || ""}, ${
          order.Address?.city || ""
        }`.trim(),
        customerName: order.orderedBy?.name || "Customer",
        distance: distance.toFixed(2),
        itemsCount: 1,
        total: order.total || "0",
        earnings: deliveryFee.toString(),
        deliveryFee: deliveryFee.toString(),
        completedAt: order.updated_at,
        deliveredAt: order.updated_at,
        deliveryTime: order.delivery_time,
        orderType: "restaurant",
      });
    });

    // Sort all orders by completion time (most recent first)
    allOrders.sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    return res.status(200).json({
      success: true,
      orders: allOrders,
      totalEarnings,
      orderCount: allOrders.length,
    });
  } catch (error) {
    console.error("Error fetching today's completed orders:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch today's completed orders",
    });
  }
}
