import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { logger } from "../../../src/utils/logger";
import { sendNewOrderNotification } from "../../../src/services/fcmService";

// ============================================================================
// OFFER EXPIRATION AND ROTATION
// ============================================================================
// This API handles the rotation logic:
// 1. Find all offers where status=OFFERED and expires_at < now()
// 2. Mark them as EXPIRED
// 3. For each expired offer's order, select the next shopper
// 4. Create a new offer (round + 1)
// 5. Send FCM to the next shopper
//
// This should be called:
// - By a cron job every 10-15 seconds
// - By the shopper app when polling for new orders
// ============================================================================

const OFFER_DURATION_MS = 60000; // 60 seconds

// Query to get expired offers
const GET_EXPIRED_OFFERS = gql`
  query GetExpiredOffers {
    order_offers(
      where: {
        _and: [
          { status: { _eq: "OFFERED" } }
          { expires_at: { _lte: "now()" } }
        ]
      }
    ) {
      id
      order_id
      reel_order_id
      restaurant_order_id
      order_type
      shopper_id
      round_number
      offered_at
      expires_at
    }
  }
`;

// Mutation to mark offer as expired
const MARK_OFFER_EXPIRED = gql`
  mutation MarkOfferExpired($offerId: uuid!) {
    update_order_offers_by_pk(
      pk_columns: { id: $offerId }
      _set: { status: "EXPIRED", updated_at: "now()" }
    ) {
      id
      status
    }
  }
`;

// Query to get eligible orders for a specific order ID
const GET_ORDER_DETAILS = gql`
  query GetOrderDetails($orderId: uuid!) {
    Orders(where: { id: { _eq: $orderId }, status: { _eq: "PENDING" } }) {
      id
      created_at
      shop_id
      service_fee
      delivery_fee
      Shop {
        name
        latitude
        longitude
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

const GET_REEL_ORDER_DETAILS = gql`
  query GetReelOrderDetails($orderId: uuid!) {
    reel_orders(where: { id: { _eq: $orderId }, status: { _eq: "PENDING" } }) {
      id
      created_at
      service_fee
      delivery_fee
      total
      quantity
      Reel {
        title
        type
      }
      user: User {
        name
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

const GET_RESTAURANT_ORDER_DETAILS = gql`
  query GetRestaurantOrderDetails($orderId: uuid!) {
    restaurant_orders(
      where: { id: { _eq: $orderId }, status: { _eq: "PENDING" } }
    ) {
      id
      created_at
      delivery_fee
      total
      delivery_time
      Restaurant {
        name
        lat
        long
      }
      orderedBy {
        name
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

// Query to get shoppers who have already been offered this order
const GET_SHOPPERS_ALREADY_OFFERED = gql`
  query GetShoppersAlreadyOffered($orderId: uuid!) {
    order_offers(
      where: {
        _or: [
          { order_id: { _eq: $orderId } }
          { reel_order_id: { _eq: $orderId } }
          { restaurant_order_id: { _eq: $orderId } }
        ]
      }
    ) {
      shopper_id
      status
      round_number
    }
  }
`;

// Query to get available shoppers (active, online, within reasonable distance)
const GET_AVAILABLE_SHOPPERS = gql`
  query GetAvailableShoppers {
    Shoppers(
      where: {
        _and: [
          { status: { _eq: "approved" } }
          { active: { _eq: true } }
          { latitude: { _is_null: false } }
          { longitude: { _is_null: false } }
        ]
      }
    ) {
      id
      latitude
      longitude
      full_name
      phone_number
      Orders_aggregate(
        where: { status: { _in: ["accepted", "in_progress", "picked_up"] } }
      ) {
        aggregate {
          count
        }
      }
      orderOffers_aggregate(
        where: {
          _and: [
            { status: { _eq: "OFFERED" } }
            { expires_at: { _gt: "now()" } }
          ]
        }
      ) {
        aggregate {
          count
        }
      }
    }
  }
`;

// Query to get shopper performance data
const GET_SHOPPER_PERFORMANCE = gql`
  query GetShopperPerformance($shopper_id: uuid!) {
    Orders_aggregate(where: { shopper_id: { _eq: $shopper_id } }) {
      aggregate {
        count
      }
    }
    Ratings_aggregate(where: { shopper_id: { _eq: $shopper_id } }) {
      aggregate {
        avg {
          rating
        }
        count
      }
    }
  }
`;

// Mutation to create an exclusive offer
const CREATE_ORDER_OFFER = gql`
  mutation CreateOrderOffer(
    $order_id: uuid
    $reel_order_id: uuid
    $restaurant_order_id: uuid
    $shopper_id: uuid!
    $order_type: String!
    $offered_at: timestamptz!
    $expires_at: timestamptz!
    $round_number: Int!
  ) {
    insert_order_offers_one(
      object: {
        order_id: $order_id
        reel_order_id: $reel_order_id
        restaurant_order_id: $restaurant_order_id
        shopper_id: $shopper_id
        order_type: $order_type
        status: "OFFERED"
        offered_at: $offered_at
        expires_at: $expires_at
        round_number: $round_number
      }
    ) {
      id
      shopper_id
      status
      offered_at
      expires_at
      round_number
    }
  }
`;

// Haversine formula to calculate distance in kilometers
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

// Calculate shopper priority score (lower is better)
function calculateShopperPriority(
  shopperLocation: { lat: number; lng: number },
  order: any,
  performance: any
): number {
  const orderLocation = {
    lat: parseFloat(order.Address?.latitude || order.address?.latitude),
    lng: parseFloat(order.Address?.longitude || order.address?.longitude),
  };

  // Calculate distance
  const distance = calculateDistanceKm(
    shopperLocation.lat,
    shopperLocation.lng,
    orderLocation.lat,
    orderLocation.lng
  );

  // Get performance metrics
  const avgRating = performance.Ratings_aggregate?.aggregate?.avg?.rating || 0;
  const orderCount = performance.Orders_aggregate?.aggregate?.count || 0;
  const completionRate =
    orderCount > 0 ? Math.min(100, (orderCount / 10) * 100) : 0;

  // Calculate order age in minutes
  const orderTimestamp = new Date(order.created_at).getTime();
  const ageInMinutes = (Date.now() - orderTimestamp) / 60000;

  // Age factor
  let ageFactor;
  if (ageInMinutes >= 30) {
    ageFactor = -5;
  } else if (ageInMinutes >= 15) {
    ageFactor = -2;
  } else if (ageInMinutes >= 5) {
    ageFactor = 0;
  } else {
    ageFactor = 2;
  }

  // Priority score calculation (lower is better)
  const priorityScore =
    distance * 0.3 +
    (5 - avgRating) * 1.5 +
    (100 - completionRate) * 0.01 +
    ageFactor +
    Math.random() * 0.3;

  return priorityScore;
}

// Get order details based on type
async function getOrderDetails(
  orderId: string,
  orderType: string
): Promise<any> {
  let orderData;

  if (orderType === "regular") {
    orderData = (await hasuraClient.request(GET_ORDER_DETAILS, {
      orderId,
    })) as any;
    const order = orderData.Orders?.[0];
    return order ? { ...order, orderType: "regular" } : null;
  } else if (orderType === "reel") {
    orderData = (await hasuraClient.request(GET_REEL_ORDER_DETAILS, {
      orderId,
    })) as any;
    const order = orderData.reel_orders?.[0];
    return order ? { ...order, orderType: "reel" } : null;
  } else if (orderType === "restaurant") {
    orderData = (await hasuraClient.request(GET_RESTAURANT_ORDER_DETAILS, {
      orderId,
    })) as any;
    const order = orderData.restaurant_orders?.[0];
    return order ? { ...order, orderType: "restaurant" } : null;
  }

  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("=== Rotating Expired Offers ===");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // ========================================================================
    // STEP 1: Find all expired offers
    // ========================================================================

    console.log("Finding expired offers...");
    const expiredOffersData = (await hasuraClient.request(
      GET_EXPIRED_OFFERS
    )) as any;

    const expiredOffers = expiredOffersData.order_offers || [];

    if (expiredOffers.length === 0) {
      console.log("No expired offers found");
      return res.status(200).json({
        success: true,
        message: "No expired offers to rotate",
        rotatedCount: 0,
      });
    }

    console.log(`Found ${expiredOffers.length} expired offers to rotate`);

    // ========================================================================
    // STEP 2: Process each expired offer
    // ========================================================================

    const rotationResults = [];

    for (const expiredOffer of expiredOffers) {
      try {
        console.log(`Processing expired offer ${expiredOffer.id}...`);

        // Mark offer as expired
        await hasuraClient.request(MARK_OFFER_EXPIRED, {
          offerId: expiredOffer.id,
        });

        console.log(`✅ Marked offer ${expiredOffer.id} as EXPIRED`);

        // Get order details
        const orderId =
          expiredOffer.order_id ||
          expiredOffer.reel_order_id ||
          expiredOffer.restaurant_order_id;

        if (!orderId) {
          console.error("No order ID found for expired offer");
          continue;
        }

        const order = await getOrderDetails(orderId, expiredOffer.order_type);

        if (!order) {
          console.log(
            `Order ${orderId} is no longer available (might have been accepted)`
          );
          continue;
        }

        // Get shoppers who have already been offered this order
        const offeredShoppersData = (await hasuraClient.request(
          GET_SHOPPERS_ALREADY_OFFERED,
          { orderId }
        )) as any;

        const offeredShopperIds = new Set(
          offeredShoppersData.order_offers.map((o: any) => o.shopper_id)
        );

        console.log(
          `${offeredShopperIds.size} shoppers have already been offered this order`
        );

        // Get all available shoppers
        const availableShoppersData = (await hasuraClient.request(
          GET_AVAILABLE_SHOPPERS
        )) as any;

        const availableShoppers = availableShoppersData.Shoppers || [];

        // Filter out shoppers who:
        // 1. Have already been offered this order
        // 2. Already have 2 or more active orders (cannot receive new offers until delivery)
        // 3. Already have an active pending offer (one offer at a time rule)
        const eligibleShoppers = availableShoppers.filter((shopper: any) => {
          const alreadyOffered = offeredShopperIds.has(shopper.id);
          const activeOrderCount =
            shopper.Orders_aggregate?.aggregate?.count || 0;
          const activeOfferCount =
            shopper.orderOffers_aggregate?.aggregate?.count || 0;

          if (alreadyOffered) return false;

          if (activeOrderCount >= 2) {
            console.log(
              `⏭️ Skipping shopper ${shopper.full_name}: Already has ${activeOrderCount} active orders`
            );
            return false;
          }

          if (activeOfferCount > 0) {
            console.log(
              `⏭️ Skipping shopper ${shopper.full_name}: Already has a pending offer`
            );
            return false;
          }

          return true;
        });

        if (eligibleShoppers.length === 0) {
          console.log(
            `⚠️ No more shoppers to rotate for order ${orderId} - all have been offered`
          );
          continue;
        }

        console.log(
          `Found ${eligibleShoppers.length} eligible shoppers for rotation`
        );

        // Calculate priority for each shopper
        const shoppersWithPriority = await Promise.all(
          eligibleShoppers.map(async (shopper: any) => {
            const performance = (await hasuraClient.request(
              GET_SHOPPER_PERFORMANCE,
              {
                shopper_id: shopper.id,
              }
            )) as any;

            const priority = calculateShopperPriority(
              {
                lat: parseFloat(shopper.latitude),
                lng: parseFloat(shopper.longitude),
              },
              order,
              performance
            );

            return { ...shopper, priority };
          })
        );

        // Sort by priority (lowest first)
        shoppersWithPriority.sort((a, b) => a.priority - b.priority);

        // Select the best shopper
        const nextShopper = shoppersWithPriority[0];

        console.log(`Next shopper selected: ${nextShopper.full_name}`);

        // Create new offer for next shopper
        const now = new Date();
        const offeredAt = now.toISOString();
        const expiresAt = new Date(
          now.getTime() + OFFER_DURATION_MS
        ).toISOString();
        const nextRound = expiredOffer.round_number + 1;

        const offerVariables: any = {
          shopper_id: nextShopper.id,
          order_type: expiredOffer.order_type,
          offered_at: offeredAt,
          expires_at: expiresAt,
          round_number: nextRound,
          order_id: null,
          reel_order_id: null,
          restaurant_order_id: null,
          business_order_id: null,
        };

        // Set only the relevant order ID based on type
        if (expiredOffer.order_type === "regular") {
          offerVariables.order_id = orderId;
        } else if (expiredOffer.order_type === "reel") {
          offerVariables.reel_order_id = orderId;
        } else if (expiredOffer.order_type === "restaurant") {
          offerVariables.restaurant_order_id = orderId;
        }

        const newOfferResult = (await hasuraClient.request(
          CREATE_ORDER_OFFER,
          offerVariables
        )) as any;

        console.log(
          `✅ Created new offer for shopper ${nextShopper.full_name} (round ${nextRound})`
        );

        // Send FCM notification to next shopper
        try {
          const distance = calculateDistanceKm(
            parseFloat(nextShopper.latitude),
            parseFloat(nextShopper.longitude),
            parseFloat(order.Address?.latitude || order.address?.latitude),
            parseFloat(order.Address?.longitude || order.address?.longitude)
          );

          const estimatedEarnings =
            expiredOffer.order_type === "restaurant"
              ? parseFloat(order.delivery_fee || "0")
              : parseFloat(order.service_fee || "0") +
                parseFloat(order.delivery_fee || "0");

          await sendNewOrderNotification(nextShopper.id, {
            id: orderId,
            shopName:
              order.Shop?.name ||
              order.Reel?.title ||
              order.Restaurant?.name ||
              "Unknown Shop",
            customerAddress: `${
              order.Address?.street || order.address?.street
            }, ${order.Address?.city || order.address?.city}`,
            distance,
            itemsCount: 1,
            travelTimeMinutes: Math.round((distance / 20) * 60),
            estimatedEarnings,
            orderType: expiredOffer.order_type,
            expiresInMs: OFFER_DURATION_MS,
          });

          console.log(`✅ FCM notification sent to ${nextShopper.full_name}`);
        } catch (fcmError) {
          console.error("Failed to send FCM notification:", fcmError);
          // Continue even if notification fails
        }

        rotationResults.push({
          orderId,
          orderType: expiredOffer.order_type,
          previousShopper: expiredOffer.shopper_id,
          nextShopper: nextShopper.id,
          round: nextRound,
        });
      } catch (error) {
        console.error(
          `Error rotating offer ${expiredOffer.id}:`,
          error instanceof Error ? error.message : String(error)
        );
        // Continue with next offer
      }
    }

    console.log(`✅ Rotated ${rotationResults.length} offers`);

    return res.status(200).json({
      success: true,
      message: `Rotated ${rotationResults.length} expired offers`,
      rotatedCount: rotationResults.length,
      results: rotationResults,
    });
  } catch (error) {
    console.error("Error rotating expired offers:", error);
    logger.error("Error in offer rotation", "OfferRotationAPI", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return res.status(500).json({
      error: "Failed to rotate expired offers",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
