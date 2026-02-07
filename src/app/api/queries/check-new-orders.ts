import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { Client as GoogleMapsClient } from "@googlemaps/google-maps-services-js";
import {
  startOrderNotifications,
  stopOrderNotifications,
} from "../../../src/utils/orderNotifier";
import { logger } from "../../../src/utils/logger";
import { logErrorToSlack } from "../../../src/lib/slackErrorReporter";

const googleMapsClient = new GoogleMapsClient({});

// Haversine formula to calculate distance in kilometers between two coordinates
function calculateDistanceKm(
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

// Estimate travel time in minutes based on distance
function estimateTravelTimeMinutes(distanceKm: number): number {
  const avgSpeedKmPerMinute = 0.5; // 30 km/h = 0.5 km per minute
  return Math.round(distanceKm / avgSpeedKmPerMinute);
}

const GET_NEW_ORDERS = gql`
  query GetNewOrders($created_after: timestamptz!) {
    Orders(
      where: {
        created_at: { _gt: $created_after }
        status: { _eq: "PENDING" }
        shopper_id: { _is_null: true }
      }
    ) {
      id
      shop_id
      total
      created_at
      Address {
        street
        city
        postal_code
        latitude
        longitude
      }
      Shop {
        id
        name
        address
        latitude
        longitude
      }
      Order_Items_aggregate {
        aggregate {
          count
          sum {
            quantity
          }
        }
      }
    }
  }
`;

const GET_ACTIVE_SHOPPERS = gql`
  query GetActiveShoppers($current_time: time!, $current_day: Int!) {
    Shopper_Availability(
      where: {
        _and: [
          { is_available: { _eq: true } }
          { status: { _eq: "ACTIVE" } }
          { day_of_week: { _eq: $current_day } }
          { start_time: { _lte: $current_time } }
          { end_time: { _gte: $current_time } }
        ]
      }
    ) {
      user_id
      default_latitude
      default_longitude
      current_latitude
      current_longitude
      preferred_radius_km
    }
  }
`;

interface Order {
  id: string;
  shop_id: string;
  total: string;
  created_at: string;
  Address: {
    street: string;
    city: string;
    postal_code: string;
    latitude: number;
    longitude: number;
  };
  Shop: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  Order_Items_aggregate?: {
    aggregate?: {
      count?: number;
      sum?: {
        quantity?: number;
      };
    };
  };
  distance?: number;
  travelTimeMinutes?: number;
}

interface Shopper {
  user_id: string;
  default_latitude: number;
  default_longitude: number;
  current_latitude: number | null;
  current_longitude: number | null;
  preferred_radius_km: number;
}

let lastCheckTime: Date | null = null;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Get shopper's location and settings from query params
    const shopperLatitude = parseFloat(req.query.latitude as string) || 0;
    const shopperLongitude = parseFloat(req.query.longitude as string) || 0;
    const userId = req.query.user_id as string;

    // If this is not the first check, ensure at least 3 minutes have passed
    if (lastCheckTime) {
      const timeSinceLastCheck = Date.now() - lastCheckTime.getTime();
      if (timeSinceLastCheck < 180000) {
        // 3 minutes in milliseconds
        return res.status(200).json({
          success: true,
          message: "Skipping check - less than 3 minutes since last check",
          notifications: [],
        });
      }
    }

    // Update last check time
    lastCheckTime = new Date();

    // Get notification settings if user_id is provided
    let notificationSettings = null;
    if (userId) {
      const GET_NOTIFICATION_SETTINGS = gql`
        query GetNotificationSettings($user_id: uuid!) {
          shopper_notification_settings(where: { user_id: { _eq: $user_id } }) {
            notification_types
            sound_settings
            max_distance
          }
        }
      `;

      try {
        const settingsResponse = (await hasuraClient.request(
          GET_NOTIFICATION_SETTINGS,
          { user_id: userId }
        )) as any;
        notificationSettings =
          settingsResponse.shopper_notification_settings?.[0];
      } catch (error) {
        logger.warn(
          "Failed to fetch notification settings",
          "CheckNewOrdersAPI",
          error
        );
      }
    }

    // Get orders created in the last 10 minutes (NEW orders only)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { Orders: newOrders } = await hasuraClient.request<{
      Orders: Order[];
    }>(GET_NEW_ORDERS, {
      created_after: tenMinutesAgo,
    });

    if (newOrders.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No new orders found",
        notifications: [],
      });
    }

    // Calculate distance and travel time for each order
    const ordersWithDistance = newOrders.map((order) => {
      const shopLat = order.Shop.latitude;
      const shopLng = order.Shop.longitude;

      const distanceKm = calculateDistanceKm(
        shopperLatitude,
        shopperLongitude,
        shopLat,
        shopLng
      );

      const travelTimeMinutes = estimateTravelTimeMinutes(distanceKm);

      return {
        ...order,
        distance: Math.round(distanceKm * 10) / 10,
        travelTimeMinutes,
      };
    });

    // Get max distance from notification settings or use default
    const maxDistanceKm = notificationSettings?.max_distance
      ? parseFloat(notificationSettings.max_distance)
      : 10;
    const maxTravelTime = maxDistanceKm * 2; // Rough conversion: 1km ≈ 2 minutes

    // Filter orders by travel time
    const nearbyOrders = ordersWithDistance.filter(
      (order) => order.travelTimeMinutes <= maxTravelTime
    );

    if (nearbyOrders.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No nearby orders found",
        notifications: [],
      });
    }

    // Group orders by shop for better notifications
    const ordersByShop = nearbyOrders.reduce((acc, order) => {
      if (!acc[order.Shop.name]) {
        acc[order.Shop.name] = [];
      }
      acc[order.Shop.name].push(order);
      return acc;
    }, {} as Record<string, Order[]>);

    // Create notifications for nearby orders
    const notifications = Object.entries(ordersByShop).map(
      ([shopName, orders]) => {
        const totalOrders = orders.length;
        const totalItems = orders.reduce(
          (sum, order) =>
            sum + (order.Order_Items_aggregate?.aggregate?.count || 0),
          0
        );
        const totalEarnings = orders.reduce(
          (sum, order) => sum + parseFloat(order.total || "0"),
          0
        );

        // Get the closest order's distance
        const closestOrder = orders.reduce((closest, current) =>
          (current.distance || 0) < (closest.distance || Infinity)
            ? current
            : closest
        );

        return {
          id: `${shopName}-${Date.now()}`,
          type: "NEW_ORDERS",
          title: `🔔 New Orders at ${shopName}!`,
          message: `${totalOrders} new order${
            totalOrders > 1 ? "s" : ""
          } (${totalItems} items) - ${
            closestOrder.distance
          }km away. Potential earnings: RWF${totalEarnings.toFixed(0)}`,
          orders: orders.map((order) => ({
            id: order.id,
            shop_name: shopName,
            items: order.Order_Items_aggregate?.aggregate?.count || 0,
            total: order.total,
            distance: order.distance,
            travelTime: order.travelTimeMinutes,
          })),
          timestamp: new Date().toISOString(),
          priority: totalOrders > 2 ? "high" : "normal",
          // Add order details for notifications
          itemsCount: totalItems,
          estimatedEarnings: totalEarnings,
          totalOrders: totalOrders,
        };
      }
    );

    // Send notifications
    if (notifications.length > 0) {
      logger.info(
        `Sending ${notifications.length} notifications for nearby orders`,
        "CheckNewOrdersAPI",
        {
          notifications,
          shopperLocation: {
            latitude: shopperLatitude,
            longitude: shopperLongitude,
          },
          maxDistance: maxDistanceKm,
        }
      );

      res.status(200).json({
        success: true,
        notifications,
        should_play_sound:
          notifications.length > 0 &&
          (!notificationSettings?.sound_settings ||
            notificationSettings.sound_settings.enabled),
        sound_settings: notificationSettings?.sound_settings || {
          enabled: true,
          volume: 0.8,
        },
        message: `Found ${notifications.length} new nearby order notifications`,
      });

      // Start notifications when shopper logs in or becomes active
      startOrderNotifications();

      // Stop notifications when shopper logs out or becomes inactive
      stopOrderNotifications();
    } else {
      res.status(200).json({
        success: true,
        message: "No new nearby orders found",
        notifications: [],
      });
    }
  } catch (error) {
    logger.error("Error checking new orders", "CheckNewOrdersAPI", error);
    await logErrorToSlack("queries/check-new-orders", error, {
      user_id: req.query.user_id,
      latitude: req.query.latitude,
      longitude: req.query.longitude,
    });
    res.status(500).json({ error: "Failed to check new orders" });
  }
}
