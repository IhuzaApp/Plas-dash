import type { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { logger } from "../../../src/utils/logger";

// Fetch all available pending orders (unassigned)
const GET_AVAILABLE_ORDERS = gql`
  query GetAvailableOrders {
    Orders(
      where: { shopper_id: { _is_null: true }, status: { _eq: "PENDING" } }
      order_by: { created_at: asc }
    ) {
      id
      created_at
      service_fee
      delivery_fee
      status
      shop: Shop {
        name
        address
        latitude
        longitude
      }
      address: Address {
        latitude
        longitude
        street
        city
      }
      Order_Items_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`;

// Fetch all available reel orders (unassigned)
const GET_AVAILABLE_REEL_ORDERS = gql`
  query GetAvailableReelOrders {
    reel_orders(
      where: { shopper_id: { _is_null: true }, status: { _eq: "PENDING" } }
      order_by: { created_at: asc }
    ) {
      id
      created_at
      service_fee
      delivery_fee
      total
      quantity
      delivery_note
      status
      Reel {
        id
        title
        description
        Price
        Product
        type
        video_url
        user_id
      }
      user: User {
        id
        name
        phone
      }
      address: Address {
        latitude
        longitude
        street
        city
      }
    }
  }
`;

// Fetch all available restaurant orders (unassigned)
const GET_AVAILABLE_RESTAURANT_ORDERS = gql`
  query GetAvailableRestaurantOrders {
    restaurant_orders(
      where: {
        shopper_id: { _is_null: true }
        status: { _eq: "PENDING" }
        assigned_at: { _is_null: true }
      }
      order_by: { updated_at: asc_nulls_last, created_at: asc }
    ) {
      id
      created_at
      updated_at
      delivery_fee
      total
      delivery_time
      delivery_notes
      status
      assigned_at
      Restaurant {
        id
        name
        logo
        lat
        long
      }
      orderedBy {
        id
        name
        phone
        email
      }
      Address {
        latitude
        longitude
        street
        city
      }
    }
  }
`;

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
  // Assume average speed of 30 km/h in urban areas
  const averageSpeedKmh = 30;
  const travelTimeHours = distanceKm / averageSpeedKmh;
  return Math.round(travelTimeHours * 60);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set cache control headers to prevent caching
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    logger.info("Request received", "AvailableOrders", {
      timestamp: new Date().toISOString(),
    });

    // Get shopper's current location from query params
    const shopperLatitude = parseFloat(req.query.latitude as string) || 0;
    const shopperLongitude = parseFloat(req.query.longitude as string) || 0;
    // Changed from 10 to 15 minutes max travel time
    const maxTravelTime = parseInt(req.query.maxTravelTime as string) || 15;

    logger.info("Processing request parameters", "AvailableOrders", {
      shopperLocation: { lat: shopperLatitude, lng: shopperLongitude },
      maxTravelTime: `${maxTravelTime} minutes`,
    });

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Debug: Test restaurant orders query first
    try {
      const testRestaurantQuery = await hasuraClient.request<{
        restaurant_orders: Array<{
          id: string;
          updated_at: string | null;
          created_at: string;
          assigned_at: string | null;
          status: string;
          Restaurant: {
            name: string;
          } | null;
        }>;
      }>(GET_AVAILABLE_RESTAURANT_ORDERS);
    } catch (error) {
      console.error("❌ Restaurant orders query failed:", error);
      logger.error("Restaurant orders query failed", "AvailableOrders", error);
    }

    // Fetch regular orders, reel orders, and restaurant orders in parallel
    const [regularOrdersData, reelOrdersData, restaurantOrdersData] =
      await Promise.all([
        hasuraClient.request<{
          Orders: Array<{
            id: string;
            created_at: string;
            service_fee: string | null;
            delivery_fee: string | null;
            status: string;
            shop: {
              name: string;
              address: string;
              latitude: string;
              longitude: string;
            };
            address: {
              latitude: string;
              longitude: string;
              street: string;
              city: string;
            };
            Order_Items_aggregate: {
              aggregate: { count: number | null } | null;
            };
          }>;
        }>(GET_AVAILABLE_ORDERS),
        hasuraClient.request<{
          reel_orders: Array<{
            id: string;
            created_at: string;
            service_fee: string | null;
            delivery_fee: string | null;
            total: string;
            quantity: string;
            delivery_note: string | null;
            status: string;
            Reel: {
              id: string;
              title: string;
              description: string;
              Price: string;
              Product: string;
              type: string;
              video_url: string;
              user_id: string;
            };
            user: {
              id: string;
              name: string;
              phone: string;
            };
            address: {
              latitude: string;
              longitude: string;
              street: string;
              city: string;
            };
          }>;
        }>(GET_AVAILABLE_REEL_ORDERS),
        hasuraClient.request<{
          restaurant_orders: Array<{
            id: string;
            created_at: string;
            updated_at: string | null;
            delivery_fee: string | null;
            total: string;
            delivery_time: string;
            delivery_notes: string | null;
            status: string;
            assigned_at: string | null;
            Restaurant: {
              id: string;
              name: string;
              logo: string | null;
              lat: string;
              long: string;
            };
            orderedBy: {
              id: string;
              name: string;
              phone: string;
              email: string;
            };
            Address: {
              latitude: string;
              longitude: string;
              street: string;
              city: string;
            };
            restaurant_order_items: Array<{
              id: string;
              quantity: number;
              price: string;
              restaurant_menu: {
                id: string;
                price: string;
                ProductNames: {
                  name: string;
                } | null;
                dishes: {
                  name: string;
                } | null;
              } | null;
            }>;
          }>;
        }>(GET_AVAILABLE_RESTAURANT_ORDERS),
      ]);

    const regularOrders = regularOrdersData.Orders;
    const reelOrders = reelOrdersData.reel_orders;
    const restaurantOrders = restaurantOrdersData.restaurant_orders;

    logger.info("Retrieved orders from database", "AvailableOrders", {
      regularOrderCount: regularOrders.length,
      reelOrderCount: reelOrders.length,
      restaurantOrderCount: restaurantOrders.length,
    });

    // Transform regular orders to make it easier to use on the client
    const availableRegularOrders = regularOrders.map((order) => {
      // Calculate metrics for sorting and filtering
      const createdAt = new Date(order.created_at);
      const pendingMinutes = Math.floor(
        (Date.now() - createdAt.getTime()) / 60000
      );

      // Added conditional checks to handle potential null values in coordinates
      const shopLatitude = order.shop?.latitude
        ? parseFloat(order.shop.latitude)
        : 0;
      const shopLongitude = order.shop?.longitude
        ? parseFloat(order.shop.longitude)
        : 0;
      const customerLatitude = order.address?.latitude
        ? parseFloat(order.address.latitude)
        : 0;
      const customerLongitude = order.address?.longitude
        ? parseFloat(order.address.longitude)
        : 0;

      // Calculate distance from shopper to shop in kilometers
      const distanceToShopKm = calculateDistanceKm(
        shopperLatitude,
        shopperLongitude,
        shopLatitude,
        shopLongitude
      );

      // Calculate distance between shop and customer in kilometers
      const shopToCustomerDistanceKm = calculateDistanceKm(
        shopLatitude,
        shopLongitude,
        customerLatitude,
        customerLongitude
      );

      // Calculate travel time from shopper to shop
      const travelTimeMinutes = estimateTravelTimeMinutes(distanceToShopKm);

      // Round distances to 1 decimal place
      const formattedDistanceToShop = Math.round(distanceToShopKm * 10) / 10;
      const formattedShopToCustomerDistance =
        Math.round(shopToCustomerDistanceKm * 10) / 10;

      // Calculate priority level (1-5) for UI highlighting
      // Orders over 24 hours old get highest priority as they're at risk of being cancelled
      let priorityLevel = 1;
      if (pendingMinutes >= 24 * 60) {
        priorityLevel = 5; // Critical - pending for 24+ hours
      } else if (pendingMinutes >= 4 * 60) {
        priorityLevel = 4; // High - pending for 4+ hours
      } else if (pendingMinutes >= 60) {
        priorityLevel = 3; // Medium - pending for 1+ hour
      } else if (pendingMinutes >= 30) {
        priorityLevel = 2; // Low - pending for 30+ minutes
      }

      return {
        id: order.id,
        createdAt: order.created_at,
        shopName: order.shop?.name || "Unknown Shop",
        shopAddress: order.shop?.address || "No Address",
        shopLatitude,
        shopLongitude,
        customerLatitude,
        customerLongitude,
        customerAddress: order.address
          ? `${order.address.street || ""}, ${order.address.city || ""}`
          : "No Address",
        itemsCount: order.Order_Items_aggregate?.aggregate?.count ?? 0,
        serviceFee: parseFloat(order.service_fee || "0"),
        deliveryFee: parseFloat(order.delivery_fee || "0"),
        earnings:
          parseFloat(order.service_fee || "0") +
          parseFloat(order.delivery_fee || "0"),
        pendingMinutes,
        priorityLevel,
        status: order.status,
        // Add new fields for distance and travel time
        distance: formattedDistanceToShop,
        shopToCustomerDistance: formattedShopToCustomerDistance,
        travelTimeMinutes: travelTimeMinutes,
        orderType: "regular" as const,
      };
    });

    // Transform reel orders
    const availableReelOrders = reelOrders.map((order) => {
      // Calculate metrics for sorting and filtering
      const createdAt = new Date(order.created_at);
      const pendingMinutes = Math.floor(
        (Date.now() - createdAt.getTime()) / 60000
      );

      // For reel orders, we need to get the location from the reel creator
      // Since reel orders don't have shops, we'll use a default location or the customer's location
      const customerLatitude = order.address?.latitude
        ? parseFloat(order.address.latitude)
        : 0;
      const customerLongitude = order.address?.longitude
        ? parseFloat(order.address.longitude)
        : 0;

      // For reel orders, we'll use the customer location as the pickup point
      // since the item comes from the reel creator's location
      const distanceToPickupKm = calculateDistanceKm(
        shopperLatitude,
        shopperLongitude,
        customerLatitude,
        customerLongitude
      );

      // Calculate travel time from shopper to pickup location
      const travelTimeMinutes = estimateTravelTimeMinutes(distanceToPickupKm);

      // Round distances to 1 decimal place
      const formattedDistanceToPickup =
        Math.round(distanceToPickupKm * 10) / 10;

      // Calculate priority level (1-5) for UI highlighting
      let priorityLevel = 1;
      if (pendingMinutes >= 24 * 60) {
        priorityLevel = 5; // Critical - pending for 24+ hours
      } else if (pendingMinutes >= 4 * 60) {
        priorityLevel = 4; // High - pending for 4+ hours
      } else if (pendingMinutes >= 60) {
        priorityLevel = 3; // Medium - pending for 1+ hour
      } else if (pendingMinutes >= 30) {
        priorityLevel = 2; // Low - pending for 30+ minutes
      }

      return {
        id: order.id,
        createdAt: order.created_at,
        shopName: "Reel Order", // Reel orders don't have shops
        shopAddress: "From Reel Creator", // Reel orders come from reel creators
        shopLatitude: customerLatitude, // Use customer location as pickup point
        shopLongitude: customerLongitude,
        customerLatitude,
        customerLongitude,
        customerAddress: order.address
          ? `${order.address.street || ""}, ${order.address.city || ""}`
          : "No Address",
        itemsCount: 1, // Reel orders have 1 item
        serviceFee: parseFloat(order.service_fee || "0"),
        deliveryFee: parseFloat(order.delivery_fee || "0"),
        earnings:
          parseFloat(order.service_fee || "0") +
          parseFloat(order.delivery_fee || "0"), // Service + delivery fee for reel orders
        pendingMinutes,
        priorityLevel,
        status: order.status,
        // Add new fields for distance and travel time
        distance: formattedDistanceToPickup,
        shopToCustomerDistance: 0, // No shop for reel orders
        travelTimeMinutes: travelTimeMinutes,
        orderType: "reel" as const,
        // Add reel-specific fields
        reel: order.Reel,
        quantity: parseInt(order.quantity) || 1,
        deliveryNote: order.delivery_note,
        customerName: order.user?.name || "Unknown Customer",
        customerPhone: order.user?.phone || "",
      };
    });

    // Transform restaurant orders
    const availableRestaurantOrders = restaurantOrders.map((order) => {
      // Calculate metrics for sorting and filtering
      // For aged orders, use updated_at if available, otherwise created_at
      const referenceDate = order.updated_at
        ? new Date(order.updated_at)
        : new Date(order.created_at);
      const pendingMinutes = Math.floor(
        (Date.now() - referenceDate.getTime()) / 60000
      );

      // Get coordinates from relationships
      const restaurantLatitude = order.Restaurant?.lat
        ? parseFloat(order.Restaurant.lat)
        : 0;
      const restaurantLongitude = order.Restaurant?.long
        ? parseFloat(order.Restaurant.long)
        : 0;
      const customerLatitude = order.Address?.latitude
        ? parseFloat(order.Address.latitude)
        : 0;
      const customerLongitude = order.Address?.longitude
        ? parseFloat(order.Address.longitude)
        : 0;

      // Calculate distance from shopper to restaurant in kilometers
      const distanceToRestaurantKm = calculateDistanceKm(
        shopperLatitude,
        shopperLongitude,
        restaurantLatitude,
        restaurantLongitude
      );

      // Calculate distance between restaurant and customer in kilometers
      const restaurantToCustomerDistanceKm = calculateDistanceKm(
        restaurantLatitude,
        restaurantLongitude,
        customerLatitude,
        customerLongitude
      );

      // Calculate travel time from shopper to restaurant
      const travelTimeMinutes = estimateTravelTimeMinutes(
        distanceToRestaurantKm
      );

      // Round distances to 1 decimal place
      const formattedDistanceToRestaurant =
        Math.round(distanceToRestaurantKm * 10) / 10;
      const formattedRestaurantToCustomerDistance =
        Math.round(restaurantToCustomerDistanceKm * 10) / 10;

      // Calculate priority level (1-5) for UI highlighting
      let priorityLevel = 1;
      if (pendingMinutes >= 24 * 60) {
        priorityLevel = 5; // Critical - pending for 24+ hours
      } else if (pendingMinutes >= 4 * 60) {
        priorityLevel = 4; // High - pending for 4+ hours
      } else if (pendingMinutes >= 60) {
        priorityLevel = 3; // Medium - pending for 1+ hour
      } else if (pendingMinutes >= 30) {
        priorityLevel = 2; // Low - pending for 30+ minutes
      }

      // Calculate total items count from dish orders
      const totalItems =
        order.restaurant_order_items?.reduce(
          (sum, dish) => sum + (dish.quantity || 0),
          0
        ) || 1;

      return {
        id: order.id,
        createdAt: order.created_at,
        updatedAt: order.updated_at, // Add updatedAt for restaurant orders
        shopName: order.Restaurant?.name || "Unknown Restaurant",
        shopAddress: "Restaurant Location",
        shopLatitude: restaurantLatitude,
        shopLongitude: restaurantLongitude,
        customerLatitude,
        customerLongitude,
        customerAddress: order.Address
          ? `${order.Address.street || ""}, ${order.Address.city || ""}`
          : "No Address",
        itemsCount: totalItems,
        serviceFee: 0, // Restaurant orders don't have service fee
        deliveryFee: parseFloat(order.delivery_fee || "0"),
        earnings: parseFloat(order.delivery_fee || "0"), // Only delivery fee for restaurant orders
        pendingMinutes,
        priorityLevel,
        status: order.status,
        // Add new fields for distance and travel time
        distance: formattedDistanceToRestaurant,
        shopToCustomerDistance: formattedRestaurantToCustomerDistance,
        travelTimeMinutes: travelTimeMinutes,
        orderType: "restaurant" as const,
        // Add restaurant-specific fields
        restaurant: order.Restaurant,
        deliveryTime: order.delivery_time,
        deliveryNotes: order.delivery_notes,
        customerName: order.orderedBy?.name || "Unknown Customer",
        customerPhone: order.orderedBy?.phone || "",
        customerEmail: order.orderedBy?.email || "",
        dishes: order.restaurant_order_items || [],
        total: parseFloat(order.total || "0"),
        assignedAt: order.assigned_at,
      };
    });

    // Combine all types of orders
    const allAvailableOrders = [
      ...availableRegularOrders,
      ...availableReelOrders,
      ...availableRestaurantOrders,
    ];

    // Filter orders by travel time - only show orders within 15 minutes travel time
    const filteredOrders = allAvailableOrders.filter(
      (order) => order.travelTimeMinutes <= maxTravelTime
    );

    logger.info("Filtered orders", "AvailableOrders", {
      filteredOrderCount: filteredOrders.length,
      regularOrderCount: filteredOrders.filter((o) => o.orderType === "regular")
        .length,
      reelOrderCount: filteredOrders.filter((o) => o.orderType === "reel")
        .length,
      restaurantOrderCount: filteredOrders.filter(
        (o) => o.orderType === "restaurant"
      ).length,
      maxTravelTime: `${maxTravelTime} minutes`,
    });

    res.status(200).json(filteredOrders);
  } catch (error) {
    logger.error("Error fetching available orders:", "AvailableOrders", error);
    res.status(500).json({ error: "Failed to fetch available orders" });
  }
}
