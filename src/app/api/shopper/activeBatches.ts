import type { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { logger } from "../../../src/utils/logger";
import { logErrorToSlack } from "../../../src/lib/slackErrorReporter";

// Fetch active regular orders for a specific shopper
const GET_ACTIVE_ORDERS = gql`
  query GetActiveOrders($shopperId: uuid!) {
    Orders(
      where: { shopper_id: { _eq: $shopperId }, status: { _neq: "delivered" } }
      order_by: { created_at: desc }
    ) {
      id
      OrderID
      created_at
      status
      service_fee
      delivery_fee
      total
      delivery_time
      combined_order_id
      pin
      shop_id
      Shop {
        id
        name
        address
        latitude
        longitude
      }
      orderedBy {
        id
        name
      }
      Address {
        latitude
        longitude
        street
        city
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

// Fetch active reel orders for a specific shopper
const GET_ACTIVE_REEL_ORDERS = gql`
  query GetActiveReelOrders($shopperId: uuid!) {
    reel_orders(
      where: { shopper_id: { _eq: $shopperId }, status: { _neq: "delivered" } }
      order_by: { created_at: desc }
    ) {
      id
      OrderID
      created_at
      status
      service_fee
      delivery_fee
      total
      delivery_time
      quantity
      delivery_note
      Reel {
        id
        title
        description
        Price
        Product
        type
        video_url
        restaurant_id
        user_id
      }
      User {
        id
        name
        phone
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

// Fetch active business orders for a specific shopper
const GET_ACTIVE_BUSINESS_ORDERS = gql`
  query GetActiveBusinessOrders($shopperId: uuid!) {
    businessProductOrders(
      where: { shopper_id: { _eq: $shopperId }, status: { _neq: "delivered" } }
      order_by: { created_at: desc }
    ) {
      id
      OrderID
      created_at
      status
      total
      transportation_fee
      service_fee
      units
      deliveryAddress
      latitude
      longitude
      delivered_time
      timeRange
      business_store {
        id
        name
        latitude
        longitude
      }
      orderedBy {
        id
        name
        phone
      }
    }
  }
`;

// Fetch active restaurant orders for a specific shopper
const GET_ACTIVE_RESTAURANT_ORDERS = gql`
  query GetActiveRestaurantOrders($shopperId: uuid!) {
    restaurant_orders(
      where: { shopper_id: { _eq: $shopperId }, status: { _neq: "delivered" } }
      order_by: { created_at: desc }
    ) {
      id
      OrderID
      created_at
      status
      delivery_fee
      total
      delivery_time
      delivery_notes
      Restaurant {
        id
        name
        location
        lat
        long
      }
      orderedBy {
        id
        name
        phone
      }
      Address {
        latitude
        longitude
        street
        city
      }
      restaurant_order_items {
        id
        quantity
      }
    }
  }
`;

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
  // Use optional chaining and type assertion for safety
  const userId = (session as any)?.user?.id;

  logger.info("ActiveBatches API called", "ActiveBatchesAPI", {
    userId,
    hasSession: !!session,
    userRole: (session as any)?.user?.role,
  });

  if (!userId) {
    logger.warn("Unauthorized access attempt", "ActiveBatchesAPI", {
      hasSession: !!session,
    });
    return res.status(401).json({
      batches: [],
      error: "You must be logged in as a shopper",
      message: "Authentication required. Please log in again.",
    });
  }

  // Check if the user is a shopper
  const userRole = (session as any)?.user?.role;
  if (userRole !== "shopper") {
    logger.warn("Non-shopper access attempt", "ActiveBatchesAPI", {
      userId,
      userRole,
    });
    return res.status(403).json({
      batches: [],
      error: "Access denied",
      message: "This API endpoint is only accessible to shoppers.",
    });
  }

  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Fetch regular, reel, restaurant, and business orders in parallel
    let regularOrdersData,
      reelOrdersData,
      restaurantOrdersData,
      businessOrdersData;

    try {
      [
        regularOrdersData,
        reelOrdersData,
        restaurantOrdersData,
        businessOrdersData,
      ] = await Promise.all([
        hasuraClient.request<{
          Orders: Array<{
            id: string;
            OrderID: number;
            created_at: string;
            status: string;
            service_fee: string | null;
            delivery_fee: string | null;
            total: number | null;
            delivery_time: string | null;
            combined_order_id: string | null;
            pin: string | null;
            shop_id: string;
            Shop: {
              id: string;
              name: string;
              address: string;
              latitude: string;
              longitude: string;
            };
            orderedBy: { id: string; name: string };
            Address: {
              latitude: string;
              longitude: string;
              street: string;
              city: string;
            };
            Order_Items_aggregate: {
              aggregate: {
                count: number | null;
                sum: {
                  quantity: number | null;
                } | null;
              } | null;
            };
          }>;
        }>(GET_ACTIVE_ORDERS, { shopperId: userId }),
        hasuraClient.request<{
          reel_orders: Array<{
            id: string;
            OrderID: string | number | null;
            created_at: string;
            status: string;
            service_fee: string | null;
            delivery_fee: string | null;
            total: string;
            delivery_time: string | null;
            quantity: string;
            delivery_note: string | null;
            Reel: {
              id: string;
              title: string;
              description: string;
              Price: string;
              Product: string;
              type: string;
              video_url: string;
              restaurant_id: string | null;
              user_id: string | null;
            };
            User: {
              id: string;
              name: string;
              phone: string;
            };
            Address: {
              latitude: string;
              longitude: string;
              street: string;
              city: string;
            };
          }>;
        }>(GET_ACTIVE_REEL_ORDERS, { shopperId: userId }),
        hasuraClient.request<{
          restaurant_orders: Array<{
            id: string;
            OrderID: string | number | null;
            created_at: string;
            status: string;
            delivery_fee: string | null;
            total: string;
            delivery_time: string | null;
            delivery_notes: string | null;
            Restaurant: {
              id: string;
              name: string;
              location: string;
              lat: string;
              long: string;
            };
            orderedBy: {
              id: string;
              name: string;
              phone: string;
            };
            Address: {
              latitude: string;
              longitude: string;
              street: string;
              city: string;
            };
            restaurant_order_items: Array<{
              id: string;
              quantity: string;
            }>;
          }>;
        }>(GET_ACTIVE_RESTAURANT_ORDERS, { shopperId: userId }),
        hasuraClient.request<{
          businessProductOrders: Array<{
            id: string;
            OrderID: string | number | null;
            created_at: string;
            status: string;
            total: string;
            transportation_fee: string;
            service_fee: string;
            units: string;
            deliveryAddress: string | any;
            latitude: string | number | null;
            longitude: string | number | null;
            delivered_time: string | null;
            timeRange: string | null;
            business_store: {
              id: string;
              name: string;
              latitude: string;
              longitude: string;
            } | null;
            orderedBy: {
              id: string;
              name: string;
              phone: string | null;
            } | null;
          }>;
        }>(GET_ACTIVE_BUSINESS_ORDERS, { shopperId: userId }),
      ]);
    } catch (fetchError) {
      console.error("Error fetching orders from Hasura:", fetchError);
      console.error(
        "Fetch error details:",
        JSON.stringify(fetchError, null, 2)
      );
      throw new Error(
        `Failed to fetch orders: ${
          fetchError instanceof Error ? fetchError.message : String(fetchError)
        }`
      );
    }

    const regularOrders = regularOrdersData.Orders;
    const reelOrders = reelOrdersData.reel_orders;
    const restaurantOrders = restaurantOrdersData.restaurant_orders;
    const businessOrders = businessOrdersData.businessProductOrders || [];

    logger.info("Active batches query results", "ActiveBatchesAPI", {
      userId,
      regularOrdersCount: regularOrders.length,
      reelOrdersCount: reelOrders.length,
      restaurantOrdersCount: restaurantOrders.length,
      businessOrdersCount: businessOrders.length,
      totalOrders:
        regularOrders.length +
        reelOrders.length +
        restaurantOrders.length +
        businessOrders.length,
    });

    // Group regular orders by combined_order_id
    const combinedOrdersMap = new Map<string, typeof regularOrders>();
    const standaloneOrders: typeof regularOrders = [];

    regularOrders.forEach((order) => {
      if (order.combined_order_id) {
        const existing = combinedOrdersMap.get(order.combined_order_id) || [];
        existing.push(order);
        combinedOrdersMap.set(order.combined_order_id, existing);
      } else {
        standaloneOrders.push(order);
      }
    });

    // Transform combined orders into single batches (only when there are 2+ orders in the group).
    // Single-order groups with combined_order_id are regular orders, not combined.
    const transformedCombinedOrders: Array<{
      id: string;
      OrderID: string;
      status: string;
      createdAt: string;
      deliveryTime?: string;
      shopName: string;
      shopNames: string[];
      shopAddress: string;
      shopLat: number;
      shopLng: number;
      customerName: string;
      customerNames: string[];
      customerAddress: string;
      customerAddresses: string[];
      customerLat: number;
      customerLng: number;
      items: number;
      itemsCount: number;
      total: number;
      estimatedEarnings: string;
      orderType: "combined";
      combinedOrderId: string;
      pin: string | null;
      orderCount: number;
      orderIds: string[];
      orderIDs: number[];
    }> = [];
    const singleOrderFromCombinedGroup: typeof regularOrders = [];

    Array.from(combinedOrdersMap.entries()).forEach(
      ([combinedOrderId, orders]) => {
        if (orders.length === 1) {
          // Single order with combined_order_id = treat as regular order
          singleOrderFromCombinedGroup.push(orders[0]);
          return;
        }
        // True combined: 2+ orders
        const totalUnits = orders.reduce((sum, o) => {
          const units = o.Order_Items_aggregate.aggregate?.sum?.quantity ?? 0;
          return sum + units;
        }, 0);
        const totalItemLines = orders.reduce(
          (sum, o) => sum + (o.Order_Items_aggregate.aggregate?.count ?? 0),
          0
        );
        const totalAmount = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
        const totalEarnings = orders.reduce(
          (sum, o) =>
            sum +
            parseFloat(o.service_fee || "0") +
            parseFloat(o.delivery_fee || "0"),
          0
        );
        const shopNamesArray = Array.from(
          new Set(orders.map((o) => o.Shop.name))
        );
        const shopNamesDisplay =
          shopNamesArray.length === 2
            ? `${shopNamesArray[0]} and ${shopNamesArray[1]}`
            : shopNamesArray.join(", ");
        const orderIDs = orders.map((o) => o.OrderID);
        const firstOrder = orders[0];

        const customerNames = Array.from(
          new Set(orders.map((o) => o.orderedBy?.name).filter(Boolean))
        ) as string[];
        const customerAddresses = Array.from(
          new Set(
            orders
              .map((o) => `${o.Address.street}, ${o.Address.city}`)
              .filter(Boolean)
          )
        ) as string[];
        const customerNameDisplay =
          customerNames.length === 2
            ? `${customerNames[0]} & ${customerNames[1]}`
            : customerNames.join(", ") || firstOrder.orderedBy.name;
        const customerAddressDisplay =
          customerAddresses.length === 2
            ? `${customerAddresses[0]} | ${customerAddresses[1]}`
            : customerAddresses.join(" | ") ||
              `${firstOrder.Address.street}, ${firstOrder.Address.city}`;

        transformedCombinedOrders.push({
          id: firstOrder.id,
          OrderID: `${firstOrder.OrderID}`,
          status: firstOrder.status,
          createdAt: firstOrder.created_at,
          deliveryTime: firstOrder.delivery_time || undefined,
          shopName: shopNamesDisplay,
          shopNames: shopNamesArray,
          shopAddress: `Multiple stores (${orders.length} orders)`,
          shopLat: parseFloat(firstOrder.Shop.latitude),
          shopLng: parseFloat(firstOrder.Shop.longitude),
          customerName: customerNameDisplay,
          customerNames,
          customerAddress: customerAddressDisplay,
          customerAddresses,
          customerLat: parseFloat(firstOrder.Address.latitude),
          customerLng: parseFloat(firstOrder.Address.longitude),
          items: totalUnits,
          itemsCount: totalItemLines,
          total: totalAmount,
          estimatedEarnings: totalEarnings.toFixed(2),
          orderType: "combined" as const,
          combinedOrderId,
          pin: firstOrder.pin,
          orderCount: orders.length,
          orderIds: Array.from(
            new Set([firstOrder.id, ...orders.map((o) => o.id)])
          ),
          orderIDs,
        });
      }
    );

    // Transform single orders that had combined_order_id but are alone in their group → regular
    const transformedSingleOrderAsRegular = singleOrderFromCombinedGroup.map(
      (o) => ({
        id: o.id,
        OrderID: o.OrderID,
        status: o.status,
        createdAt: o.created_at,
        deliveryTime: o.delivery_time || undefined,
        shopName: o.Shop.name,
        shopNames: [o.Shop.name],
        shopAddress: o.Shop.address,
        shopLat: parseFloat(o.Shop.latitude),
        shopLng: parseFloat(o.Shop.longitude),
        customerName: o.orderedBy.name,
        customerNames: [o.orderedBy.name],
        customerAddress: `${o.Address.street}, ${o.Address.city}`,
        customerAddresses: [`${o.Address.street}, ${o.Address.city}`],
        customerLat: parseFloat(o.Address.latitude),
        customerLng: parseFloat(o.Address.longitude),
        items: o.Order_Items_aggregate.aggregate?.sum?.quantity ?? 0,
        itemsCount: o.Order_Items_aggregate.aggregate?.count ?? 0,
        total: o.total ?? 0,
        estimatedEarnings: (
          parseFloat(o.service_fee || "0") + parseFloat(o.delivery_fee || "0")
        ).toFixed(2),
        orderType: "regular" as const,
        combinedOrderId: o.combined_order_id,
        pin: o.pin,
      })
    );

    // Transform standalone regular orders
    const transformedStandaloneOrders = standaloneOrders.map((o) => ({
      id: o.id,
      OrderID: o.OrderID,
      status: o.status,
      createdAt: o.created_at,
      deliveryTime: o.delivery_time || undefined,
      shopName: o.Shop.name,
      shopNames: [o.Shop.name],
      shopAddress: o.Shop.address,
      shopLat: parseFloat(o.Shop.latitude),
      shopLng: parseFloat(o.Shop.longitude),
      customerName: o.orderedBy.name,
      customerNames: [o.orderedBy.name],
      customerAddress: `${o.Address.street}, ${o.Address.city}`,
      customerAddresses: [`${o.Address.street}, ${o.Address.city}`],
      customerLat: parseFloat(o.Address.latitude),
      customerLng: parseFloat(o.Address.longitude),
      items: o.Order_Items_aggregate.aggregate?.sum?.quantity ?? 0,
      itemsCount: o.Order_Items_aggregate.aggregate?.count ?? 0,
      total: o.total ?? 0,
      estimatedEarnings: (
        parseFloat(o.service_fee || "0") + parseFloat(o.delivery_fee || "0")
      ).toFixed(2),
      orderType: "regular" as const,
      combinedOrderId: o.combined_order_id,
      pin: o.pin,
    }));

    // Transform reel orders
    const transformedReelOrders = reelOrders.map((o) => {
      // Determine if this is a restaurant/user reel (skip shopping) or regular reel (full flow)
      // Skip shopping if EITHER restaurant_id OR user_id is not null
      const isRestaurantUserReel = o.Reel.restaurant_id || o.Reel.user_id;

      return {
        id: o.id,
        OrderID: o.OrderID != null ? o.OrderID : o.id,
        status: o.status,
        createdAt: o.created_at,
        deliveryTime: o.delivery_time || undefined,
        shopName: isRestaurantUserReel ? "Restaurant/User Reel" : "Reel Order",
        shopNames: [
          isRestaurantUserReel ? "Restaurant/User Reel" : "Reel Order",
        ],
        shopAddress: isRestaurantUserReel
          ? "From Restaurant/User"
          : "From Reel Creator",
        shopLat: parseFloat(o.Address.latitude), // Use customer location as pickup point
        shopLng: parseFloat(o.Address.longitude),
        customerName: o.User.name,
        customerAddress: `${o.Address.street}, ${o.Address.city}`,
        customerLat: parseFloat(o.Address.latitude),
        customerLng: parseFloat(o.Address.longitude),
        items: parseInt(o.quantity) || 1,
        total: parseFloat(o.total || "0"),
        estimatedEarnings: (
          parseFloat(o.service_fee || "0") + parseFloat(o.delivery_fee || "0")
        ).toFixed(2),
        orderType: "reel" as const,
        reel: {
          ...o.Reel,
          restaurant_id: o.Reel.restaurant_id,
          user_id: o.Reel.user_id,
          isRestaurantUserReel, // Add flag to identify the flow type
        },
        quantity: parseInt(o.quantity) || 1,
        deliveryNote: o.delivery_note,
        customerPhone: o.User.phone,
      };
    });

    // Transform business orders
    const transformedBusinessOrders = businessOrders.map((o) => {
      const da = o.deliveryAddress;
      const deliveryAddr =
        typeof da === "string"
          ? da
          : da && typeof da === "object"
          ? [(da as any).street, (da as any).city, (da as any).address]
              .filter(Boolean)
              .join(", ") || "—"
          : "—";
      const custLat = parseFloat(
        String(o.latitude ?? (da && (da as any).latitude) ?? 0)
      );
      const custLng = parseFloat(
        String(o.longitude ?? (da && (da as any).longitude) ?? 0)
      );
      const store = o.business_store;
      // Use delivered_time if set, else estimate ~2h from created_at so table/card show a time (not N/A)
      const deliveryTime =
        o.delivered_time && o.delivered_time.trim() !== ""
          ? o.delivered_time
          : new Date(
              new Date(o.created_at).getTime() + 2 * 60 * 60 * 1000
            ).toISOString();
      return {
        id: o.id,
        OrderID: o.OrderID != null ? o.OrderID : o.id,
        status: o.status,
        createdAt: o.created_at,
        deliveryTime,
        shopName: store?.name || "Business Store",
        shopNames: [store?.name || "Business Store"],
        shopAddress: store ? "Business store" : "—",
        shopLat: store ? parseFloat(store.latitude) : 0,
        shopLng: store ? parseFloat(store.longitude) : 0,
        customerName: o.orderedBy?.name || "Customer",
        customerAddress: deliveryAddr,
        customerLat: custLat,
        customerLng: custLng,
        items: parseInt(String(o.units), 10) || 1,
        total: parseFloat(o.total || "0"),
        estimatedEarnings: (
          parseFloat(o.transportation_fee || "0") +
          parseFloat(o.service_fee || "0")
        ).toFixed(2),
        orderType: "business" as const,
        customerPhone: o.orderedBy?.phone || null,
      };
    });

    // Transform restaurant orders (show OrderID in order column, not id)
    const transformedRestaurantOrders = restaurantOrders.map((o) => ({
      id: o.id,
      OrderID: o.OrderID != null ? o.OrderID : o.id,
      status: o.status,
      createdAt: o.created_at,
      deliveryTime: o.delivery_time || undefined,
      shopName: o.Restaurant.name,
      shopNames: [o.Restaurant.name],
      shopAddress: o.Restaurant.location,
      shopLat: parseFloat(o.Restaurant.lat),
      shopLng: parseFloat(o.Restaurant.long),
      customerName: o.orderedBy.name,
      customerAddress: `${o.Address.street}, ${o.Address.city}`,
      customerLat: parseFloat(o.Address.latitude),
      customerLng: parseFloat(o.Address.longitude),
      items: o.restaurant_order_items.reduce(
        (sum, item) => sum + (parseInt(item.quantity) || 0),
        0
      ),
      total: parseFloat(o.total || "0"),
      estimatedEarnings: parseFloat(o.delivery_fee || "0").toFixed(2),
      orderType: "restaurant" as const,
      deliveryNote: o.delivery_notes,
      customerPhone: o.orderedBy.phone,
    }));

    // Combine all types of orders (single-order "combined" groups are included as regular)
    const allActiveOrders = [
      ...transformedCombinedOrders,
      ...transformedStandaloneOrders,
      ...transformedSingleOrderAsRegular,
      ...transformedReelOrders,
      ...transformedRestaurantOrders,
      ...transformedBusinessOrders,
    ];

    // If no orders were found, return a specific message but with 200 status code
    if (allActiveOrders.length === 0) {
      return res.status(200).json({
        batches: [],
        message: "No active batches found",
        noOrdersFound: true,
      });
    }

    res.status(200).json({
      batches: allActiveOrders,
      message: `Found ${allActiveOrders.length} active batches`,
    });
  } catch (error) {
    console.error("=== ERROR in ActiveBatches API ===");
    console.error("Error:", error);
    console.error(
      "Error message:",
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    console.error("User ID:", userId);
    console.error("Hasura client exists:", !!hasuraClient);

    logger.error("Error fetching active batches", "ActiveBatchesAPI", {
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    await logErrorToSlack("api/shopper/activeBatches", error, {
      userId,
      hasuraClientExists: !!hasuraClient,
    });

    // Return a more informative error response with correct format
    res.status(500).json({
      batches: [],
      error: "Failed to fetch active batches",
      message: error instanceof Error ? error.message : String(error),
      detail:
        "There was a problem connecting to the database or processing your request.",
    });
  }
}
