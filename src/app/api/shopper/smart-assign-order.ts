import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { logger } from "../../../src/utils/logger";
import { sendNewOrderNotification } from "../../../src/services/fcmService";
import {
  getShopperLocation,
  isShopperOnline,
  logOfferSkip,
} from "../../../src/lib/redisClient";
import { logErrorToSlack } from "../../../src/lib/slackErrorReporter";

// ============================================================================
// SYSTEM DESIGN: Dispatch with Exclusive Offers + Nearby Assignment
// ============================================================================
// Orders table = business truth (is the order assigned?)
// order_offers table = dispatch truth (who can currently see this order?)
// Redis = volatile state (GPS location, online status)
// FCM = transport only (no logic, just deliver messages)
//
// **ACTION-BASED SYSTEM** (No time-based expiry):
// - Offers stay until shopper explicitly ACCEPTS or DECLINES
// - If DECLINED → Goes to next shopper immediately
// - If ACCEPTED → Shopper works exclusively, no new offers until delivery
// - ONE ORDER AT A TIME → Cannot accept new orders while working on one
//
// Distance Gating: Only offer to shoppers within radius (3km → 5km → 8km)
// Location Validation: Shopper must have fresh location (< 30s old)
// ============================================================================

// ============================================================================
// DISTANCE & RADIUS CONFIGURATION
// ============================================================================
// Professional systems use round-based radius expansion to prevent starvation
// ============================================================================

interface RoundConfig {
  round: number;
  maxDistanceKm: number;
  maxEtaMinutes: number;
  offerDurationMs: number;
}

const ROUND_CONFIGS: RoundConfig[] = [
  { round: 1, maxDistanceKm: 3, maxEtaMinutes: 15, offerDurationMs: 60000 },
  { round: 2, maxDistanceKm: 5, maxEtaMinutes: 25, offerDurationMs: 60000 },
  { round: 3, maxDistanceKm: 8, maxEtaMinutes: 40, offerDurationMs: 90000 },
];

// For orders older than 30 minutes, use wider radius immediately
const URGENT_ORDER_AGE_MINUTES = 30;
const URGENT_MAX_DISTANCE_KM = 10;

// Randomization: pick from top N candidates by priority so regular, reel, restaurant, and business orders get fair exposure
const TOP_CANDIDATES_FOR_RANDOM = 10;

// GraphQL query to get eligible orders (no active offers, not assigned)
const GET_ELIGIBLE_ORDERS = gql`
  query GetEligibleOrders {
    Orders(
      where: {
        _and: [
          { status: { _eq: "PENDING" } }
          { shopper_id: { _is_null: true } }
          { _not: { orderOffers: { status: { _eq: "OFFERED" } } } }
        ]
      }
      order_by: { created_at: asc }
      limit: 50
    ) {
      id
      OrderID
      created_at
      shop_id
      service_fee
      delivery_fee
      combined_order_id
      pin
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

const GET_ELIGIBLE_REEL_ORDERS = gql`
  query GetEligibleReelOrders {
    reel_orders(
      where: {
        _and: [
          { status: { _eq: "PENDING" } }
          { shopper_id: { _is_null: true } }
          { _not: { orderOffers: { status: { _eq: "OFFERED" } } } }
        ]
      }
      order_by: { created_at: asc }
      limit: 50
    ) {
      id
      OrderID
      created_at
      service_fee
      delivery_fee
      total
      quantity
      Reel {
        title
        type
        Restaurant {
          lat
          long
        }
        Shops {
          latitude
          longitude
        }
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

const GET_ELIGIBLE_RESTAURANT_ORDERS = gql`
  query GetEligibleRestaurantOrders {
    restaurant_orders(
      where: {
        _and: [
          { status: { _eq: "PENDING" } }
          { shopper_id: { _is_null: true } }
          { _not: { orderOffers: { status: { _eq: "OFFERED" } } } }
        ]
      }
      order_by: { updated_at: asc_nulls_last, created_at: asc }
      limit: 50
    ) {
      id
      OrderID
      created_at
      updated_at
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

const GET_ELIGIBLE_BUSINESS_ORDERS = gql`
  query GetEligibleBusinessOrders {
    businessProductOrders(
      where: {
        _and: [
          { status: { _eq: "Ready for Pickup" } }
          { shopper_id: { _is_null: true } }
          { _not: { orderOffers: { status: { _eq: "OFFERED" } } } }
        ]
      }
      order_by: { created_at: asc }
      limit: 50
    ) {
      id
      OrderID
      created_at
      total
      transportation_fee
      service_fee
      units
      latitude
      longitude
      deliveryAddress
      business_store {
        id
        name
        latitude
        longitude
      }
      orderedBy {
        name
      }
    }
  }
`;

// Fetch single order by pk for existing-offer display (same shape as eligible so formatOrderForResponse works)
const GET_ORDER_BY_PK = gql`
  query GetOrderByPk($id: uuid!) {
    Orders_by_pk(id: $id) {
      id
      OrderID
      created_at
      shop_id
      service_fee
      delivery_fee
      combined_order_id
      pin
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

const GET_REEL_ORDER_BY_PK = gql`
  query GetReelOrderByPk($id: uuid!) {
    reel_orders_by_pk(id: $id) {
      id
      OrderID
      created_at
      service_fee
      delivery_fee
      total
      quantity
      Reel {
        title
        type
        Restaurant {
          lat
          long
        }
        Shops {
          latitude
          longitude
        }
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

const GET_RESTAURANT_ORDER_BY_PK = gql`
  query GetRestaurantOrderByPk($id: uuid!) {
    restaurant_orders_by_pk(id: $id) {
      id
      OrderID
      created_at
      updated_at
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

const GET_BUSINESS_ORDER_BY_PK = gql`
  query GetBusinessOrderByPk($id: uuid!) {
    businessProductOrders_by_pk(id: $id) {
      id
      OrderID
      created_at
      total
      transportation_fee
      service_fee
      units
      latitude
      longitude
      deliveryAddress
      business_store {
        id
        name
        latitude
        longitude
      }
      orderedBy {
        name
      }
    }
  }
`;

// GraphQL query to get shopper performance data
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

// Query to get current round number for an order
const GET_CURRENT_ROUND = gql`
  query GetCurrentRound($order_id: uuid!) {
    order_offers(
      where: {
        _or: [
          { order_id: { _eq: $order_id } }
          { reel_order_id: { _eq: $order_id } }
          { restaurant_order_id: { _eq: $order_id } }
          { business_order_id: { _eq: $order_id } }
        ]
      }
      order_by: { round_number: desc }
      limit: 1
    ) {
      round_number
    }
  }
`;

// Query to check if shopper has already declined a regular order
const CHECK_SHOPPER_DECLINED_ORDER_REGULAR = gql`
  query CheckShopperDeclinedOrderRegular($order_id: uuid!, $shopper_id: uuid!) {
    order_offers(
      where: {
        _and: [
          { order_id: { _eq: $order_id } }
          { shopper_id: { _eq: $shopper_id } }
          { status: { _eq: "DECLINED" } }
        ]
      }
      limit: 1
    ) {
      id
      status
      round_number
    }
  }
`;

// Query to check if shopper has already declined a reel order
const CHECK_SHOPPER_DECLINED_ORDER_REEL = gql`
  query CheckShopperDeclinedOrderReel(
    $reel_order_id: uuid!
    $shopper_id: uuid!
  ) {
    order_offers(
      where: {
        _and: [
          { reel_order_id: { _eq: $reel_order_id } }
          { shopper_id: { _eq: $shopper_id } }
          { status: { _eq: "DECLINED" } }
        ]
      }
      limit: 1
    ) {
      id
      status
      round_number
    }
  }
`;

// Query to check if shopper has already declined a restaurant order
const CHECK_SHOPPER_DECLINED_ORDER_RESTAURANT = gql`
  query CheckShopperDeclinedOrderRestaurant(
    $restaurant_order_id: uuid!
    $shopper_id: uuid!
  ) {
    order_offers(
      where: {
        _and: [
          { restaurant_order_id: { _eq: $restaurant_order_id } }
          { shopper_id: { _eq: $shopper_id } }
          { status: { _eq: "DECLINED" } }
        ]
      }
      limit: 1
    ) {
      id
      status
      round_number
    }
  }
`;

// Query to check if shopper has already declined a business order
const CHECK_SHOPPER_DECLINED_ORDER_BUSINESS = gql`
  query CheckShopperDeclinedOrderBusiness(
    $business_order_id: uuid!
    $shopper_id: uuid!
  ) {
    order_offers(
      where: {
        _and: [
          { business_order_id: { _eq: $business_order_id } }
          { shopper_id: { _eq: $shopper_id } }
          { status: { _eq: "DECLINED" } }
        ]
      }
      limit: 1
    ) {
      id
      status
      round_number
    }
  }
`;

// Query to check if shopper already has an active offer for this order (regular)
const CHECK_SHOPPER_EXISTING_OFFER_REGULAR = gql`
  query CheckShopperExistingOfferRegular(
    $order_id: uuid!
    $shopper_id: uuid!
    $order_type: String!
  ) {
    order_offers(
      where: {
        _and: [
          { shopper_id: { _eq: $shopper_id } }
          { order_type: { _eq: $order_type } }
          { status: { _in: ["OFFERED"] } }
          { order_id: { _eq: $order_id } }
        ]
      }
      limit: 1
    ) {
      id
      expires_at
      round_number
      status
    }
  }
`;

// Query to check if shopper already has an active offer for this order (reel)
const CHECK_SHOPPER_EXISTING_OFFER_REEL = gql`
  query CheckShopperExistingOfferReel(
    $reel_order_id: uuid!
    $shopper_id: uuid!
    $order_type: String!
  ) {
    order_offers(
      where: {
        _and: [
          { shopper_id: { _eq: $shopper_id } }
          { order_type: { _eq: $order_type } }
          { status: { _in: ["OFFERED"] } }
          { reel_order_id: { _eq: $reel_order_id } }
        ]
      }
      limit: 1
    ) {
      id
      expires_at
      round_number
      status
    }
  }
`;

// Query to check if shopper already has an active offer for this order (restaurant)
const CHECK_SHOPPER_EXISTING_OFFER_RESTAURANT = gql`
  query CheckShopperExistingOfferRestaurant(
    $restaurant_order_id: uuid!
    $shopper_id: uuid!
    $order_type: String!
  ) {
    order_offers(
      where: {
        _and: [
          { shopper_id: { _eq: $shopper_id } }
          { order_type: { _eq: $order_type } }
          { status: { _in: ["OFFERED"] } }
          { restaurant_order_id: { _eq: $restaurant_order_id } }
        ]
      }
      limit: 1
    ) {
      id
      expires_at
      round_number
      status
    }
  }
`;

// Query to check if shopper already has an active offer for this order (business)
const CHECK_SHOPPER_EXISTING_OFFER_BUSINESS = gql`
  query CheckShopperExistingOfferBusiness(
    $business_order_id: uuid!
    $shopper_id: uuid!
    $order_type: String!
  ) {
    order_offers(
      where: {
        _and: [
          { shopper_id: { _eq: $shopper_id } }
          { order_type: { _eq: $order_type } }
          { status: { _in: ["OFFERED"] } }
          { business_order_id: { _eq: $business_order_id } }
        ]
      }
      limit: 1
    ) {
      id
      expires_at
      round_number
      status
    }
  }
`;

// Mutation to update existing offer expiry time
const UPDATE_OFFER_EXPIRY = gql`
  mutation UpdateOfferExpiry($offer_id: uuid!, $expires_at: timestamptz!) {
    update_order_offers_by_pk(
      pk_columns: { id: $offer_id }
      _set: { expires_at: $expires_at, offered_at: "now()" }
    ) {
      id
      expires_at
      round_number
    }
  }
`;

// Mutation to create an exclusive offer
const CREATE_ORDER_OFFER = gql`
  mutation CreateOrderOffer(
    $order_id: uuid
    $reel_order_id: uuid
    $restaurant_order_id: uuid
    $business_order_id: uuid
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
        business_order_id: $business_order_id
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

// Fetch all regular orders belonging to a combined order group
const GET_ORDERS_BY_COMBINED_ORDER_ID = gql`
  query GetOrdersByCombinedOrderId($combined_order_id: uuid!) {
    Orders(where: { combined_order_id: { _eq: $combined_order_id } }) {
      id
      OrderID
      service_fee
      delivery_fee
      Shop {
        name
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

// Get the latest offer round across multiple regular order IDs (for combined offers)
const GET_CURRENT_ROUND_FOR_ORDER_IDS = gql`
  query GetCurrentRoundForOrderIds($order_ids: [uuid!]!) {
    order_offers(
      where: { order_id: { _in: $order_ids } }
      order_by: { round_number: desc }
      limit: 1
    ) {
      round_number
    }
  }
`;

// Query to verify order is still unassigned before sending notification
const VERIFY_ORDER_UNASSIGNED_REGULAR = gql`
  query VerifyOrderUnassignedRegular($order_id: uuid!) {
    Orders_by_pk(id: $order_id) {
      id
      shopper_id
      status
    }
  }
`;

const VERIFY_ORDER_UNASSIGNED_REEL = gql`
  query VerifyOrderUnassignedReel($order_id: uuid!) {
    reel_orders_by_pk(id: $order_id) {
      id
      shopper_id
      status
    }
  }
`;

const VERIFY_ORDER_UNASSIGNED_RESTAURANT = gql`
  query VerifyOrderUnassignedRestaurant($order_id: uuid!) {
    restaurant_orders_by_pk(id: $order_id) {
      id
      shopper_id
      status
    }
  }
`;

const VERIFY_ORDER_UNASSIGNED_BUSINESS = gql`
  query VerifyOrderUnassignedBusiness($order_id: uuid!) {
    businessProductOrders_by_pk(id: $order_id) {
      id
      shopper_id
      status
    }
  }
`;

// Query to verify all orders in a combined group are unassigned
const VERIFY_COMBINED_ORDERS_UNASSIGNED = gql`
  query VerifyCombinedOrdersUnassigned($order_ids: [uuid!]!) {
    Orders(where: { id: { _in: $order_ids } }) {
      id
      shopper_id
      status
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

// Calculate travel time in minutes (assuming 20 km/h average speed)
function calculateTravelTime(distanceKm: number): number {
  const averageSpeedKmh = 20;
  const travelTimeHours = distanceKm / averageSpeedKmh;
  return Math.round(travelTimeHours * 60);
}

// Format order data for API response
function formatOrderForResponse(
  order: any,
  shopperLocation: { lat: number; lng: number },
  expiresInMs: number | null
): any {
  const deliveryLat =
    order.orderType === "business"
      ? parseFloat(order.latitude || order.business_store?.latitude || "0")
      : parseFloat(order.Address?.latitude || order.address?.latitude || "0");
  const deliveryLng =
    order.orderType === "business"
      ? parseFloat(order.longitude || order.business_store?.longitude || "0")
      : parseFloat(order.Address?.longitude || order.address?.longitude || "0");
  const distance = calculateDistanceKm(
    shopperLocation.lat,
    shopperLocation.lng,
    deliveryLat,
    deliveryLng
  );

  // Calculate items count based on order type
  let itemsCount = 1; // Default
  if (order.orderType === "regular") {
    const unitsCount =
      order.Order_Items_aggregate?.aggregate?.sum?.quantity || 0;
    const itemsTypeCount = order.Order_Items_aggregate?.aggregate?.count || 0;
    itemsCount = unitsCount || itemsTypeCount || 1;
  } else if (order.orderType === "reel") {
    itemsCount = order.quantity || 1;
  } else if (order.orderType === "restaurant") {
    itemsCount = order.items || order.quantity || 1;
  } else if (order.orderType === "business") {
    const u = order.units;
    itemsCount =
      typeof u === "number"
        ? u
        : typeof u === "string"
        ? parseInt(u, 10) || 1
        : 1;
  }

  const customerAddressStr =
    order.orderType === "business"
      ? typeof order.deliveryAddress === "string"
        ? order.deliveryAddress
        : order.deliveryAddress
        ? JSON.stringify(order.deliveryAddress)
        : "—"
      : `${order.Address?.street || order.address?.street || ""}, ${
          order.Address?.city || order.address?.city || ""
        }`.trim() || "—";

  return {
    id: order.id,
    OrderID: order.OrderID ?? null,
    displayOrderId: order.OrderID != null ? String(order.OrderID) : null,
    shopName:
      order.Shop?.name ||
      order.Reel?.title ||
      order.Restaurant?.name ||
      order.business_store?.name ||
      "Unknown Shop",
    distance: distance,
    travelTimeMinutes: calculateTravelTime(distance),
    createdAt: order.created_at,
    customerAddress: customerAddressStr,
    itemsCount: itemsCount,
    estimatedEarnings:
      order.orderType === "restaurant"
        ? parseFloat(order.delivery_fee || "0")
        : order.orderType === "business"
        ? parseFloat(order.transportation_fee || "0") +
          parseFloat(order.service_fee || "0")
        : parseFloat(order.service_fee || "0") +
          parseFloat(order.delivery_fee || "0"),
    orderType: order.orderType,
    priority: order.priority,
    expiresIn: expiresInMs ?? null,
    // Add coordinates for map route display (pickup location)
    shopLatitude: parseFloat(
      order.Shop?.latitude ||
        order.Restaurant?.lat ||
        order.business_store?.latitude ||
        order.Reel?.Restaurant?.lat ||
        order.Reel?.Shops?.latitude ||
        "0"
    ),
    shopLongitude: parseFloat(
      order.Shop?.longitude ||
        order.Restaurant?.long ||
        order.business_store?.longitude ||
        order.Reel?.Restaurant?.long ||
        order.Reel?.Shops?.longitude ||
        "0"
    ),
    customerLatitude: deliveryLat,
    customerLongitude: deliveryLng,
    // Add restaurant-specific fields
    ...(order.orderType === "restaurant" && {
      restaurant: order.Restaurant,
      total: parseFloat(order.total || "0"),
      deliveryTime: order.delivery_time,
    }),
    // Add reel-specific fields
    ...(order.orderType === "reel" && {
      reel: order.Reel,
    }),
    // Add business-specific fields
    ...(order.orderType === "business" && {
      business_store: order.business_store,
      total: parseFloat(order.total || "0"),
      transportation_fee: parseFloat(order.transportation_fee || "0"),
      service_fee: parseFloat(order.service_fee || "0"),
    }),
  };
}

// Calculate shopper priority score (lower is better)
// Prioritizes older orders heavily while still considering new ones
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
    orderCount > 0 ? Math.min(100, (orderCount / 10) * 100) : 0; // Simplified completion rate

  // Calculate order age in minutes
  const orderTimestamp =
    (order.orderType === "restaurant" && order.updated_at) ||
    (order.orderType === "business" && order.updated_at)
      ? new Date(order.updated_at).getTime()
      : new Date(order.created_at).getTime();
  const ageInMinutes = (Date.now() - orderTimestamp) / 60000;

  // Age factor: heavily prioritize older orders, but don't completely ignore new ones
  // - Orders 30+ minutes old get maximum priority boost (lowest score)
  // - Orders 15-30 minutes old get moderate priority boost
  // - Orders under 15 minutes get less priority boost
  // - All orders are still considered, ensuring new ones don't get stuck
  let ageFactor;
  if (ageInMinutes >= 30) {
    // Very old orders: strongest priority (lowest score added)
    ageFactor = -5; // Negative value means higher priority
  } else if (ageInMinutes >= 15) {
    // Moderately old orders: good priority
    ageFactor = -2;
  } else if (ageInMinutes >= 5) {
    // Somewhat new orders: neutral priority
    ageFactor = 0;
  } else {
    // Very new orders: lower priority (higher score added)
    ageFactor = 2;
  }

  // Priority score calculation (lower is better)
  const priorityScore =
    distance * 0.3 + // Distance weight (30%)
    (5 - avgRating) * 1.5 + // Rating weight (inverted, 15%)
    (100 - completionRate) * 0.01 + // Completion rate weight (5%)
    ageFactor + // Age-based priority (50%)
    Math.random() * 0.3; // Small random factor (5%) for fairness

  return priorityScore;
}

// Note: Atomic assignment removed - shoppers must accept orders explicitly

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("=== Smart Assignment API (with Exclusive Offers) ===");
  console.log("Method:", req.method);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { current_location, user_id } = req.body;
    console.log("Request body:", { user_id, current_location });

    if (!user_id) {
      console.warn("Missing user_id in request");
      return res.status(400).json({
        error: "User ID is required",
      });
    }

    if (!current_location || !current_location.lat || !current_location.lng) {
      console.warn("Missing or invalid current_location in request");
      return res.status(400).json({
        error: "Current location is required",
      });
    }

    if (!hasuraClient) {
      console.error("Hasura client is not initialized!");
      throw new Error("Hasura client is not initialized");
    }

    // ========================================================================
    // STEP 0: Check if shopper already has active orders
    // ========================================================================
    // ONE ORDER AT A TIME: Shopper cannot get new offers if they're working
    // on an order. They must complete/deliver it first.
    // ========================================================================

    // ========================================================================
    // Check if shopper has 2 or more active orders (not delivered)
    // ========================================================================
    // Shoppers can work on up to 2 orders at a time
    // If they have 2 active orders, block new offers until at least one is delivered
    // ========================================================================
    const CHECK_ACTIVE_ORDERS = gql`
      query CheckActiveOrders($shopper_id: uuid!) {
        Orders(
          where: {
            shopper_id: { _eq: $shopper_id }
            status: { _neq: "delivered" }
          }
        ) {
          id
          status
        }
        reel_orders(
          where: {
            shopper_id: { _eq: $shopper_id }
            status: { _neq: "delivered" }
          }
        ) {
          id
          status
        }
        restaurant_orders(
          where: {
            shopper_id: { _eq: $shopper_id }
            status: { _neq: "delivered" }
          }
        ) {
          id
          status
        }
        businessProductOrders(
          where: {
            shopper_id: { _eq: $shopper_id }
            status: { _neq: "delivered" }
          }
        ) {
          id
          status
        }
      }
    `;

    const activeOrdersData = (await hasuraClient.request(CHECK_ACTIVE_ORDERS, {
      shopper_id: user_id,
    })) as any;

    const activeOrders = [
      ...(activeOrdersData.Orders || []),
      ...(activeOrdersData.reel_orders || []),
      ...(activeOrdersData.restaurant_orders || []),
      ...(activeOrdersData.businessProductOrders || []),
    ];
    const activeOrderCount = activeOrders.length;

    if (activeOrderCount >= 2) {
      console.log(
        "🚫 Shopper already has 2 active orders (not delivered) - cannot receive new offers:",
        {
          shopperId: user_id,
          activeOrderCount: activeOrderCount,
          orders: activeOrders.map((order: any) => ({
            orderId: order.id,
            status: order.status,
          })),
        }
      );

      return res.status(200).json({
        success: false,
        message: `You have ${activeOrderCount} active orders. Please deliver at least one before receiving new offers`,
        reason: "MAX_ACTIVE_ORDERS_REACHED",
        activeOrderCount: activeOrderCount,
        maxAllowed: 2,
        activeOrders: activeOrders.map((order: any) => ({
          orderId: order.id,
          status: order.status,
        })),
        note: "You can work on up to 2 orders at a time. Deliver at least one to receive new offers",
      });
    }

    if (activeOrderCount === 1) {
      console.log(
        "✅ Shopper has 1 active order - can still receive new offers (max 2 active orders)"
      );
    } else {
      console.log("✅ Shopper has no active orders - can receive new offers");
    }

    // ========================================================================
    // Check if shopper already has an active OFFERED offer
    // ========================================================================
    // One offer at a time rule: Shoppers can only have ONE pending offer
    // They must accept or decline it before receiving a new offer
    // ========================================================================
    const CHECK_ACTIVE_OFFERED_OFFER = gql`
      query CheckActiveOfferedOffer($shopper_id: uuid!) {
        order_offers(
          where: {
            shopper_id: { _eq: $shopper_id }
            status: { _eq: "OFFERED" }
          }
          order_by: { offered_at: desc }
          limit: 1
        ) {
          id
          order_id
          reel_order_id
          restaurant_order_id
          business_order_id
          order_type
          status
          expires_at
          round_number
        }
      }
    `;

    const activeOfferedOfferData = (await hasuraClient.request(
      CHECK_ACTIVE_OFFERED_OFFER,
      {
        shopper_id: user_id,
      }
    )) as any;

    if (
      activeOfferedOfferData.order_offers &&
      activeOfferedOfferData.order_offers.length > 0
    ) {
      const activeOffer = activeOfferedOfferData.order_offers[0];
      const orderId =
        activeOffer.order_id ||
        activeOffer.reel_order_id ||
        activeOffer.restaurant_order_id ||
        activeOffer.business_order_id;

      console.log(
        "🚫 Shopper already has an active OFFERED offer - cannot receive new offer:",
        {
          shopperId: user_id,
          offerId: activeOffer.id,
          orderId: orderId,
          orderType: activeOffer.order_type,
          status: activeOffer.status,
          expiresAt: activeOffer.expires_at,
          round: activeOffer.round_number,
        }
      );

      // Return existing offer details so the client can show the notification card on refresh/navigate
      const orderType = activeOffer.order_type || "regular";
      const currentLocation = (req.body as any)?.current_location;
      let rawOrder: any = null;
      if (orderType === "regular" && activeOffer.order_id) {
        const r = (await hasuraClient.request(GET_ORDER_BY_PK, {
          id: activeOffer.order_id,
        })) as any;
        rawOrder = r?.Orders_by_pk;
      } else if (orderType === "reel" && activeOffer.reel_order_id) {
        const r = (await hasuraClient.request(GET_REEL_ORDER_BY_PK, {
          id: activeOffer.reel_order_id,
        })) as any;
        rawOrder = r?.reel_orders_by_pk;
      } else if (
        orderType === "restaurant" &&
        activeOffer.restaurant_order_id
      ) {
        const r = (await hasuraClient.request(GET_RESTAURANT_ORDER_BY_PK, {
          id: activeOffer.restaurant_order_id,
        })) as any;
        rawOrder = r?.restaurant_orders_by_pk;
      } else if (orderType === "business" && activeOffer.business_order_id) {
        const r = (await hasuraClient.request(GET_BUSINESS_ORDER_BY_PK, {
          id: activeOffer.business_order_id,
        })) as any;
        rawOrder = r?.businessProductOrders_by_pk;
      }
      if (rawOrder) {
        rawOrder.orderType = orderType;
        const shopperLocation =
          currentLocation &&
          typeof currentLocation.lat === "number" &&
          typeof currentLocation.lng === "number"
            ? { lat: currentLocation.lat, lng: currentLocation.lng }
            : { lat: 0, lng: 0 };
        const formattedOrder = formatOrderForResponse(
          rawOrder,
          shopperLocation,
          null
        );
        return res.status(200).json({
          success: false,
          message:
            "You have a pending offer. Please accept or decline it before receiving new offers",
          reason: "ACTIVE_OFFER_PENDING",
          activeOfferId: activeOffer.id,
          activeOrderId: orderId,
          activeOrderType: orderType,
          existingOffer: {
            order: formattedOrder,
            offerId: activeOffer.id,
          },
          note: "Action-based system: You must accept or decline your current offer before receiving a new one",
        });
      }

      return res.status(200).json({
        success: false,
        message:
          "You have a pending offer. Please accept or decline it before receiving new offers",
        reason: "ACTIVE_OFFER_PENDING",
        activeOfferId: activeOffer.id,
        activeOrderId: orderId,
        activeOrderType: activeOffer.order_type,
        note: "Action-based system: You must accept or decline your current offer before receiving a new one",
      });
    }

    console.log(
      "✅ Shopper has no active orders or pending offers - can receive new offer"
    );

    // ========================================================================
    // STEP 1: Find Eligible Orders
    // ========================================================================
    // Orders are eligible only if:
    // - Order status = PENDING
    // - shopper_id IS NULL
    // - NO active offer (status=OFFERED, expires_at > now())
    // ========================================================================

    console.log("Fetching eligible orders (no active offers)...");
    const [
      regularOrdersData,
      reelOrdersData,
      restaurantOrdersData,
      businessOrdersData,
      performanceData,
    ] = await Promise.all([
      hasuraClient.request(GET_ELIGIBLE_ORDERS) as any,
      hasuraClient.request(GET_ELIGIBLE_REEL_ORDERS) as any,
      hasuraClient.request(GET_ELIGIBLE_RESTAURANT_ORDERS) as any,
      hasuraClient.request(GET_ELIGIBLE_BUSINESS_ORDERS) as any,
      hasuraClient.request(GET_SHOPPER_PERFORMANCE, {
        shopper_id: user_id,
      }) as any,
    ]);

    const availableOrders = regularOrdersData.Orders || [];
    const availableReelOrders = reelOrdersData.reel_orders || [];
    const availableRestaurantOrders =
      restaurantOrdersData.restaurant_orders || [];
    const availableBusinessOrders =
      businessOrdersData.businessProductOrders || [];

    console.log("Eligible orders (no active offers):", {
      regular: availableOrders.length,
      reel: availableReelOrders.length,
      restaurant: availableRestaurantOrders.length,
      business: availableBusinessOrders.length,
      total:
        availableOrders.length +
        availableReelOrders.length +
        availableRestaurantOrders.length +
        availableBusinessOrders.length,
    });

    // Combine all orders with type information
    const allOrders = [
      ...availableOrders.map((order: any) => ({
        ...order,
        orderType: "regular",
      })),
      ...availableReelOrders.map((order: any) => ({
        ...order,
        orderType: "reel",
      })),
      ...availableRestaurantOrders.map((order: any) => ({
        ...order,
        orderType: "restaurant",
      })),
      ...availableBusinessOrders.map((order: any) => ({
        ...order,
        orderType: "business",
      })),
    ];

    if (allOrders.length === 0) {
      console.log("No eligible orders found");
      return res.status(200).json({
        success: false,
        message: "No available orders at the moment",
        orders: [],
      });
    }

    // ========================================================================
    // STEP 1.5: DISTANCE GATING (Professional Eligibility Checks)
    // ========================================================================
    // Server-side validation (never trust client):
    // 1. Check shopper is online (has fresh Redis location)
    // 2. Filter orders by distance (round-based radius expansion)
    // 3. Log all skips for audit/debugging
    // ========================================================================

    console.log("📍 Performing distance gating checks...");

    // Check if shopper has fresh location in Redis
    const redisLocation = await getShopperLocation(user_id);
    const useRedisLocation = redisLocation !== null;

    if (useRedisLocation) {
      const locationAge = (Date.now() - redisLocation.updatedAt) / 1000;
      console.log(
        `✅ Using Redis location (age: ${locationAge.toFixed(1)}s):`,
        redisLocation
      );

      // Check if location is fresh enough
      if (locationAge > 30) {
        console.warn(
          `⚠️ Location is stale (${locationAge.toFixed(
            1
          )}s old). Shopper may be offline.`
        );
        await logOfferSkip({
          orderId: "N/A",
          shopperId: user_id,
          reason: "STALE_LOCATION",
          timestamp: Date.now(),
          metadata: { locationAge },
        });
      }
    } else {
      console.log(
        "⚠️ No Redis location found. Using fallback client location."
      );
      console.log(
        "   (This is normal if Redis is unavailable or shopper just went online)"
      );
    }

    // Use Redis location if available, otherwise fall back to client location
    const shopperLocation = useRedisLocation
      ? { lat: redisLocation.lat, lng: redisLocation.lng }
      : current_location;

    // Filter orders by distance with round-based expansion
    const nearbyOrders: any[] = [];

    for (const order of allOrders) {
      const orderLocation =
        order.orderType === "business"
          ? {
              lat: parseFloat(
                order.latitude || order.business_store?.latitude || "0"
              ),
              lng: parseFloat(
                order.longitude || order.business_store?.longitude || "0"
              ),
            }
          : {
              lat: parseFloat(
                order.Address?.latitude || order.address?.latitude || "0"
              ),
              lng: parseFloat(
                order.Address?.longitude || order.address?.longitude || "0"
              ),
            };

      const distance = calculateDistanceKm(
        shopperLocation.lat,
        shopperLocation.lng,
        orderLocation.lat,
        orderLocation.lng
      );

      // Calculate order age
      const orderTimestamp =
        order.orderType === "restaurant" && order.updated_at
          ? new Date(order.updated_at).getTime()
          : new Date(order.created_at).getTime();
      const orderAgeMinutes = (Date.now() - orderTimestamp) / 60000;

      // Determine max distance based on order age and round
      let maxDistanceKm: number;
      let maxEtaMinutes: number;

      if (orderAgeMinutes >= URGENT_ORDER_AGE_MINUTES) {
        // Urgent old orders: use wider radius immediately
        maxDistanceKm = URGENT_MAX_DISTANCE_KM;
        maxEtaMinutes = 60;
        console.log(
          `⏰ URGENT order ${order.id} (${orderAgeMinutes.toFixed(
            1
          )}m old) - using ${maxDistanceKm}km radius`
        );
      } else {
        // Get current round for this order
        const roundData = (await hasuraClient.request(GET_CURRENT_ROUND, {
          order_id: order.id,
        })) as any;

        const currentRound = roundData.order_offers?.[0]?.round_number || 0;
        const nextRound = currentRound + 1;

        // Get config for next round (capped at max round)
        const roundConfig =
          ROUND_CONFIGS[Math.min(nextRound - 1, ROUND_CONFIGS.length - 1)];
        maxDistanceKm = roundConfig.maxDistanceKm;
        maxEtaMinutes = roundConfig.maxEtaMinutes;

        console.log(
          `📍 Order ${
            order.id
          } round ${nextRound}: max ${maxDistanceKm}km, distance ${distance.toFixed(
            2
          )}km`
        );
      }

      // Distance check
      if (distance > maxDistanceKm) {
        console.log(
          `❌ SKIP: Order ${order.id} too far (${distance.toFixed(
            2
          )}km > ${maxDistanceKm}km)`
        );
        await logOfferSkip({
          orderId: order.id,
          shopperId: user_id,
          reason: "DISTANCE_TOO_FAR",
          distance,
          timestamp: Date.now(),
          metadata: {
            maxDistanceKm,
            orderAgeMinutes,
          },
        });
        continue;
      }

      // ETA check (optional but professional)
      const eta = calculateTravelTime(distance);
      if (eta > maxEtaMinutes) {
        console.log(
          `❌ SKIP: Order ${order.id} ETA too long (${eta}min > ${maxEtaMinutes}min)`
        );
        await logOfferSkip({
          orderId: order.id,
          shopperId: user_id,
          reason: "ETA_TOO_LONG",
          distance,
          timestamp: Date.now(),
          metadata: {
            eta,
            maxEtaMinutes,
          },
        });
        continue;
      }

      // Check if shopper has already declined this order
      // Use separate queries for each order type to avoid null UUID issues
      let declinedCheck: any = { order_offers: [] };

      try {
        if (order.orderType === "regular") {
          declinedCheck = (await hasuraClient.request(
            CHECK_SHOPPER_DECLINED_ORDER_REGULAR,
            {
              order_id: order.id,
              shopper_id: user_id,
            }
          )) as any;
        } else if (order.orderType === "reel") {
          declinedCheck = (await hasuraClient.request(
            CHECK_SHOPPER_DECLINED_ORDER_REEL,
            {
              reel_order_id: order.id,
              shopper_id: user_id,
            }
          )) as any;
        } else if (order.orderType === "restaurant") {
          declinedCheck = (await hasuraClient.request(
            CHECK_SHOPPER_DECLINED_ORDER_RESTAURANT,
            {
              restaurant_order_id: order.id,
              shopper_id: user_id,
            }
          )) as any;
        } else if (order.orderType === "business") {
          declinedCheck = (await hasuraClient.request(
            CHECK_SHOPPER_DECLINED_ORDER_BUSINESS,
            {
              business_order_id: order.id,
              shopper_id: user_id,
            }
          )) as any;
        }

        if (
          declinedCheck.order_offers &&
          declinedCheck.order_offers.length > 0
        ) {
          console.log(
            `❌ SKIP: Order ${order.id} was already declined by this shopper (round ${declinedCheck.order_offers[0].round_number})`
          );
          await logOfferSkip({
            orderId: order.id,
            shopperId: user_id,
            reason: "ALREADY_DECLINED",
            distance,
            timestamp: Date.now(),
            metadata: {
              declinedRound: declinedCheck.order_offers[0].round_number,
            },
          });
          continue;
        }
      } catch (error) {
        // Log error but don't block the order - better to show it than fail silently
        console.error("Error checking declined order status:", error);
        logger.error("Error checking declined order", "SmartAssignOrder", {
          orderId: order.id,
          orderType: order.orderType,
          shopperId: user_id,
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue processing - don't skip the order if we can't check declined status
      }

      // Order passes all checks
      nearbyOrders.push({
        ...order,
        distance,
        eta,
      });
      console.log(
        `✅ ELIGIBLE: Order ${order.id} (${distance.toFixed(
          2
        )}km, ${eta}min ETA)`
      );
    }

    console.log(
      `📊 Distance filtering: ${allOrders.length} total → ${nearbyOrders.length} nearby`
    );

    if (nearbyOrders.length === 0) {
      console.log("No nearby orders found after distance gating");
      return res.status(200).json({
        success: false,
        message: "No nearby orders available at the moment",
        orders: [],
        reason: "DISTANCE_FILTERED",
      });
    }

    // ========================================================================
    // STEP 2: Select the Next Shopper for Each Order
    // ========================================================================
    // Use smart logic (distance, age, rating, completion rate, random factor)
    // to find the best order for THIS shopper
    // ========================================================================

    console.log(
      "Calculating priority for",
      nearbyOrders.length,
      "nearby orders"
    );

    // Calculate priority for each order
    const ordersWithPriority = nearbyOrders.map((order) => ({
      ...order,
      priority: calculateShopperPriority(
        shopperLocation, // Use validated shopper location
        order,
        performanceData
      ),
    }));

    // Sort by priority (lowest first)
    ordersWithPriority.sort((a, b) => a.priority - b.priority);

    // Randomize among top candidates so restaurant, reel, regular, and business orders get fair exposure
    const topN = Math.min(TOP_CANDIDATES_FOR_RANDOM, ordersWithPriority.length);
    const topCandidates = ordersWithPriority.slice(0, topN);
    const bestOrder =
      topCandidates[Math.floor(Math.random() * topCandidates.length)];

    console.log(
      `✅ Best order selected for this shopper (random among top ${topN}):`,
      {
        id: bestOrder.id,
        type: bestOrder.orderType,
        distance: bestOrder.distance.toFixed(2) + "km",
        eta: bestOrder.eta + "min",
        priority: bestOrder.priority.toFixed(2),
      }
    );

    // ========================================================================
    // STEP 3: Create Exclusive Offer (THIS IS THE LOCK)
    // ========================================================================
    // Insert one row into order_offers
    // This row is the exclusive lock - only this shopper can see the order
    // ========================================================================

    // If this is a combined regular order, we'll create offers for ALL orders in the group
    const isCombinedRegular =
      bestOrder.orderType === "regular" && !!bestOrder.combined_order_id;

    let combinedOrders: any[] = [];
    let combinedOrderIds: string[] = [];

    if (isCombinedRegular) {
      const combinedData = (await hasuraClient.request(
        GET_ORDERS_BY_COMBINED_ORDER_ID,
        { combined_order_id: bestOrder.combined_order_id }
      )) as any;
      combinedOrders = combinedData.Orders || [];
      combinedOrderIds = combinedOrders.map((o: any) => o.id);
    }

    // Get current round number for this order (or max round across combined group)
    let currentRound = 0;
    if (isCombinedRegular && combinedOrderIds.length > 0) {
      const roundData = (await hasuraClient.request(
        GET_CURRENT_ROUND_FOR_ORDER_IDS,
        { order_ids: combinedOrderIds }
      )) as any;
      currentRound = roundData.order_offers?.[0]?.round_number || 0;
    } else {
      const roundData = (await hasuraClient.request(GET_CURRENT_ROUND, {
        order_id: bestOrder.id,
      })) as any;
      currentRound = roundData.order_offers?.[0]?.round_number || 0;
    }

    const nextRound = currentRound + 1;

    const now = new Date();
    const offeredAt = now.toISOString();
    // Set expiry to 4 hours from now (fallback safety - action-based system means shopper must accept/decline)
    const expiresAt = new Date(
      now.getTime() + 4 * 60 * 60 * 1000
    ).toISOString();

    // Prepare the order_id field based on order type
    // Set unused foreign keys explicitly to null to avoid constraint violations
    const offerVariables: any = {
      shopper_id: user_id,
      order_type: bestOrder.orderType,
      offered_at: offeredAt,
      expires_at: expiresAt,
      round_number: nextRound,
      order_id: null,
      reel_order_id: null,
      restaurant_order_id: null,
      business_order_id: null,
    };

    // Set only the relevant order ID based on type
    if (bestOrder.orderType === "regular") {
      offerVariables.order_id = bestOrder.id;
    } else if (bestOrder.orderType === "reel") {
      offerVariables.reel_order_id = bestOrder.id;
    } else if (bestOrder.orderType === "restaurant") {
      offerVariables.restaurant_order_id = bestOrder.id;
    } else if (bestOrder.orderType === "business") {
      offerVariables.business_order_id = bestOrder.id;
    }

    // ========================================================================
    // Check if shopper already has an active offer for this order
    // If yes, just extend the expiry time instead of creating a duplicate
    // ========================================================================

    let existingOfferData: any;

    if (bestOrder.orderType === "regular") {
      existingOfferData = await hasuraClient.request(
        CHECK_SHOPPER_EXISTING_OFFER_REGULAR,
        {
          shopper_id: user_id,
          order_type: bestOrder.orderType,
          order_id: bestOrder.id,
        }
      );
    } else if (bestOrder.orderType === "reel") {
      existingOfferData = await hasuraClient.request(
        CHECK_SHOPPER_EXISTING_OFFER_REEL,
        {
          shopper_id: user_id,
          order_type: bestOrder.orderType,
          reel_order_id: bestOrder.id,
        }
      );
    } else if (bestOrder.orderType === "restaurant") {
      existingOfferData = await hasuraClient.request(
        CHECK_SHOPPER_EXISTING_OFFER_RESTAURANT,
        {
          shopper_id: user_id,
          order_type: bestOrder.orderType,
          restaurant_order_id: bestOrder.id,
        }
      );
    } else if (bestOrder.orderType === "business") {
      existingOfferData = await hasuraClient.request(
        CHECK_SHOPPER_EXISTING_OFFER_BUSINESS,
        {
          shopper_id: user_id,
          order_type: bestOrder.orderType,
          business_order_id: bestOrder.id,
        }
      );
    }

    const existingOffer = existingOfferData.order_offers?.[0];

    let offerId: string;
    let offerRound: number;
    let isExtendingOffer = false; // Track if we're extending vs creating

    if (existingOffer) {
      isExtendingOffer = true; // Mark that we're extending
      // Shopper already has an active offer for this order - just extend the expiry
      console.log("🔄 Extending existing offer (preventing duplicate):", {
        existingOfferId: existingOffer.id,
        orderId: bestOrder.id,
        shopperId: user_id,
        currentExpiry: existingOffer.expires_at,
        newExpiry: expiresAt,
        round: existingOffer.round_number,
      });

      const updateResult = (await hasuraClient.request(UPDATE_OFFER_EXPIRY, {
        offer_id: existingOffer.id,
        expires_at: expiresAt,
      })) as any;

      offerId = existingOffer.id;
      offerRound = existingOffer.round_number;

      console.log("✅ Offer expiry extended:", {
        offerId,
        newExpiresAt: expiresAt,
        round: offerRound,
      });
    } else {
      // No existing offer found - but double-check before creating to prevent race conditions
      // Re-check one more time to ensure no duplicate was created between our check and now
      let finalCheckData: any;
      if (bestOrder.orderType === "regular") {
        finalCheckData = await hasuraClient.request(
          CHECK_SHOPPER_EXISTING_OFFER_REGULAR,
          {
            shopper_id: user_id,
            order_type: bestOrder.orderType,
            order_id: bestOrder.id,
          }
        );
      } else if (bestOrder.orderType === "reel") {
        finalCheckData = await hasuraClient.request(
          CHECK_SHOPPER_EXISTING_OFFER_REEL,
          {
            shopper_id: user_id,
            order_type: bestOrder.orderType,
            reel_order_id: bestOrder.id,
          }
        );
      } else if (bestOrder.orderType === "restaurant") {
        finalCheckData = await hasuraClient.request(
          CHECK_SHOPPER_EXISTING_OFFER_RESTAURANT,
          {
            shopper_id: user_id,
            order_type: bestOrder.orderType,
            restaurant_order_id: bestOrder.id,
          }
        );
      } else if (bestOrder.orderType === "business") {
        finalCheckData = await hasuraClient.request(
          CHECK_SHOPPER_EXISTING_OFFER_BUSINESS,
          {
            shopper_id: user_id,
            order_type: bestOrder.orderType,
            business_order_id: bestOrder.id,
          }
        );
      }

      const finalCheckOffer = finalCheckData.order_offers?.[0];

      if (finalCheckOffer) {
        // Another request created the offer between our checks - extend it instead
        console.log(
          "🔄 Race condition detected - offer created by another request, extending:",
          {
            existingOfferId: finalCheckOffer.id,
            orderId: bestOrder.id,
            shopperId: user_id,
          }
        );

        const updateResult = (await hasuraClient.request(UPDATE_OFFER_EXPIRY, {
          offer_id: finalCheckOffer.id,
          expires_at: expiresAt,
        })) as any;

        offerId = finalCheckOffer.id;
        offerRound = finalCheckOffer.round_number;

        console.log("✅ Offer extended (race condition handled):", {
          offerId,
          round: offerRound,
        });
        isExtendingOffer = true; // Mark that we're extending, not creating
      } else {
        // Re-check for ANY active offer right before creating (prevents race when 2 requests run in parallel)
        const preCreateCheck = (await hasuraClient.request(
          CHECK_ACTIVE_OFFERED_OFFER,
          { shopper_id: user_id }
        )) as any;
        if (
          preCreateCheck.order_offers &&
          preCreateCheck.order_offers.length > 0
        ) {
          const existing = preCreateCheck.order_offers[0];
          const existingOrderId =
            existing.order_id ||
            existing.reel_order_id ||
            existing.restaurant_order_id ||
            existing.business_order_id;
          console.log(
            "🚫 Race prevented: Another request already created offer for this shopper:",
            { offerId: existing.id, orderId: existingOrderId }
          );
          return res.status(200).json({
            success: false,
            message:
              "You have a pending offer. Please accept or decline it before receiving new offers",
            reason: "ACTIVE_OFFER_PENDING",
            activeOfferId: existing.id,
            activeOrderId: existingOrderId,
            activeOrderType: existing.order_type,
            note: "Action-based system: You must accept or decline your current offer before receiving a new one",
          });
        }

        // Confirmed no existing offer - safe to create new one
        console.log("Creating exclusive offer:", {
          orderId: bestOrder.id,
          orderType: bestOrder.orderType,
          shopperId: user_id,
          round: nextRound,
          note: "No time limit - shopper must accept or decline",
          isCombinedRegular,
          combinedCount: combinedOrderIds.length,
        });

        try {
          if (isCombinedRegular && combinedOrderIds.length > 0) {
            // Create one offer per order in the combined group
            const createdOfferIds: string[] = [];

            for (const oid of combinedOrderIds) {
              const perOrderVars = {
                ...offerVariables,
                order_id: oid,
                reel_order_id: null,
                restaurant_order_id: null,
                business_order_id: null,
              };

              const offerResult = (await hasuraClient.request(
                CREATE_ORDER_OFFER,
                perOrderVars
              )) as any;

              if (!offerResult.insert_order_offers_one?.id) {
                throw new Error("Failed to create offer for combined order");
              }

              createdOfferIds.push(offerResult.insert_order_offers_one.id);
            }

            offerId = createdOfferIds[0];
            offerRound = nextRound;

            console.log("✅ Combined offers created:", {
              combined_order_id: bestOrder.combined_order_id,
              offerCount: createdOfferIds.length,
              offerId,
              round: offerRound,
            });
          } else {
            const offerResult = (await hasuraClient.request(
              CREATE_ORDER_OFFER,
              offerVariables
            )) as any;

            if (!offerResult.insert_order_offers_one) {
              throw new Error("Failed to create order offer");
            }

            offerId = offerResult.insert_order_offers_one.id;
            offerRound = nextRound;

            console.log("✅ Exclusive offer created:", {
              offerId,
              round: offerRound,
            });
          }
        } catch (error: any) {
          // Handle potential unique constraint violation
          if (
            error.message?.includes("duplicate") ||
            error.message?.includes("unique constraint")
          ) {
            console.warn(
              "⚠️ Duplicate offer detected during creation, checking for existing offer:",
              {
                orderId: bestOrder.id,
                shopperId: user_id,
              }
            );

            // One final check - maybe another request created it
            let recoveryCheckData: any;
            if (bestOrder.orderType === "regular") {
              recoveryCheckData = await hasuraClient.request(
                CHECK_SHOPPER_EXISTING_OFFER_REGULAR,
                {
                  shopper_id: user_id,
                  order_type: bestOrder.orderType,
                  order_id: bestOrder.id,
                }
              );
            } else if (bestOrder.orderType === "reel") {
              recoveryCheckData = await hasuraClient.request(
                CHECK_SHOPPER_EXISTING_OFFER_REEL,
                {
                  shopper_id: user_id,
                  order_type: bestOrder.orderType,
                  reel_order_id: bestOrder.id,
                }
              );
            } else if (bestOrder.orderType === "restaurant") {
              recoveryCheckData = await hasuraClient.request(
                CHECK_SHOPPER_EXISTING_OFFER_RESTAURANT,
                {
                  shopper_id: user_id,
                  order_type: bestOrder.orderType,
                  restaurant_order_id: bestOrder.id,
                }
              );
            } else if (bestOrder.orderType === "business") {
              recoveryCheckData = await hasuraClient.request(
                CHECK_SHOPPER_EXISTING_OFFER_BUSINESS,
                {
                  shopper_id: user_id,
                  order_type: bestOrder.orderType,
                  business_order_id: bestOrder.id,
                }
              );
            }

            const recoveryOffer = recoveryCheckData.order_offers?.[0];
            if (recoveryOffer) {
              // Found it - extend instead
              const updateResult = (await hasuraClient.request(
                UPDATE_OFFER_EXPIRY,
                {
                  offer_id: recoveryOffer.id,
                  expires_at: expiresAt,
                }
              )) as any;

              offerId = recoveryOffer.id;
              offerRound = recoveryOffer.round_number;
              isExtendingOffer = true; // Mark that we're extending, not creating

              console.log(
                "✅ Recovered from duplicate - extended existing offer:",
                {
                  offerId,
                  round: offerRound,
                }
              );
            } else {
              throw error; // Re-throw if we can't recover
            }
          } else {
            throw error; // Re-throw other errors
          }
        }
      }
    }

    // ========================================================================
    // STEP 5: Send FCM Notification (Aligned with Offer)
    // ========================================================================
    // FCM payload represents the OFFER, not just the order
    // expiresIn must match the database expires_at
    // ========================================================================

    const orderData = formatOrderForResponse(
      bestOrder,
      shopperLocation, // Use validated shopper location
      null // No time-based expiry
    );

    // If this is a combined regular order, return it as ONE logical batch (same as notification)
    let responseOrder: any = orderData;
    if (
      bestOrder.orderType === "regular" &&
      bestOrder.combined_order_id &&
      combinedOrders.length > 1
    ) {
      const totalEarnings = combinedOrders.reduce((sum: number, o: any) => {
        return (
          sum +
          parseFloat(o.service_fee || "0") +
          parseFloat(o.delivery_fee || "0")
        );
      }, 0);

      const totalItems = combinedOrders.reduce((sum: number, o: any) => {
        const unitsCount =
          o.Order_Items_aggregate?.aggregate?.sum?.quantity || 0;
        const itemsTypeCount = o.Order_Items_aggregate?.aggregate?.count || 0;
        const items = unitsCount || itemsTypeCount || 0;
        return sum + items;
      }, 0);

      const storeNames = combinedOrders
        .map((o: any) => o.Shop?.name)
        .filter(Boolean)
        .join(", ");

      const firstOrderId = combinedOrders[0]?.OrderID;
      const firstShop = combinedOrders[0]?.Shop;

      responseOrder = {
        ...orderData,
        id: bestOrder.combined_order_id,
        shopName: `${combinedOrders.length} Stores: ${storeNames}`,
        estimatedEarnings: totalEarnings,
        itemsCount: totalItems,
        isCombinedOrder: true,
        orderCount: combinedOrders.length,
        storeNames,
        combinedOrderId: bestOrder.combined_order_id,
        orderIds: combinedOrderIds,
        displayOrderId:
          firstOrderId !== null && firstOrderId !== undefined
            ? `Combined-${String(firstOrderId)}`
            : "Combined",
        // Use first store coords for directions (shopper goes to first store first)
        ...(firstShop?.latitude != null &&
          firstShop?.longitude != null && {
            shopLatitude: parseFloat(firstShop.latitude),
            shopLongitude: parseFloat(firstShop.longitude),
          }),
      };
    }

    // Only send FCM notification for NEW offers, not when extending existing ones
    // This prevents duplicate notifications when polling refreshes the same offer
    if (!isExtendingOffer) {
      try {
        // ========================================================================
        // CRITICAL: Verify order is still unassigned before sending notification
        // ========================================================================
        // This prevents sending notifications for orders that were already accepted
        // by this or another shopper between the query and notification send
        // ========================================================================
        let orderStillUnassigned = true;
        let orderAssignedToShopper = false;

        if (isCombinedRegular && combinedOrderIds.length > 0) {
          // For combined orders, check all orders in the group
          const verificationData = (await hasuraClient.request(
            VERIFY_COMBINED_ORDERS_UNASSIGNED,
            { order_ids: combinedOrderIds }
          )) as any;

          const assignedOrders = (verificationData.Orders || []).filter(
            (o: any) => o.shopper_id !== null
          );

          if (assignedOrders.length > 0) {
            orderStillUnassigned = false;
            // Check if any order is assigned to this shopper
            orderAssignedToShopper = assignedOrders.some(
              (o: any) => o.shopper_id === user_id
            );

            console.log(
              `❌ BLOCKING notification: Combined order group has ${assignedOrders.length} assigned order(s)`,
              {
                combinedOrderId: bestOrder.combined_order_id,
                assignedOrders: assignedOrders.map((o: any) => ({
                  orderId: o.id,
                  shopperId: o.shopper_id,
                  assignedToThisShopper: o.shopper_id === user_id,
                })),
              }
            );
          }
        } else {
          // For single orders, check the specific order
          let verificationData: any;
          if (bestOrder.orderType === "regular") {
            verificationData = (await hasuraClient.request(
              VERIFY_ORDER_UNASSIGNED_REGULAR,
              { order_id: bestOrder.id }
            )) as any;
          } else if (bestOrder.orderType === "reel") {
            verificationData = (await hasuraClient.request(
              VERIFY_ORDER_UNASSIGNED_REEL,
              { order_id: bestOrder.id }
            )) as any;
          } else if (bestOrder.orderType === "restaurant") {
            verificationData = (await hasuraClient.request(
              VERIFY_ORDER_UNASSIGNED_RESTAURANT,
              { order_id: bestOrder.id }
            )) as any;
          } else if (bestOrder.orderType === "business") {
            verificationData = (await hasuraClient.request(
              VERIFY_ORDER_UNASSIGNED_BUSINESS,
              { order_id: bestOrder.id }
            )) as any;
          }

          const order =
            verificationData?.Orders_by_pk ||
            verificationData?.reel_orders_by_pk ||
            verificationData?.restaurant_orders_by_pk ||
            verificationData?.businessProductOrders_by_pk;

          if (order && order.shopper_id !== null) {
            orderStillUnassigned = false;
            orderAssignedToShopper = order.shopper_id === user_id;

            console.log(
              `❌ BLOCKING notification: Order ${bestOrder.id} is already assigned`,
              {
                orderId: bestOrder.id,
                orderType: bestOrder.orderType,
                assignedShopperId: order.shopper_id,
                assignedToThisShopper: orderAssignedToShopper,
                status: order.status,
              }
            );
          }
        }

        if (!orderStillUnassigned) {
          if (orderAssignedToShopper) {
            console.log(
              `⚠️ Order ${bestOrder.id} is already assigned to this shopper - skipping notification (order already accepted)`
            );
          } else {
            console.log(
              `⚠️ Order ${bestOrder.id} is already assigned to another shopper - skipping notification`
            );
          }
          // Don't send notification - order is already assigned
          return res.status(200).json({
            success: false,
            message: "Order is no longer available (already assigned)",
            reason: "ORDER_ALREADY_ASSIGNED",
            orderId: bestOrder.id,
            note: "Order was assigned between query and notification send",
          });
        }

        // For reel/restaurant orders: do not notify the same order again if this shopper already declined it
        let skipFcmForDeclined = false;
        if (bestOrder.orderType === "reel") {
          const reelDeclinedCheck = (await hasuraClient.request(
            CHECK_SHOPPER_DECLINED_ORDER_REEL,
            {
              reel_order_id: bestOrder.id,
              shopper_id: user_id,
            }
          )) as any;
          if (
            reelDeclinedCheck.order_offers &&
            reelDeclinedCheck.order_offers.length > 0
          ) {
            console.log(
              `⏭️ Skipping FCM for reel order ${bestOrder.id} - shopper already declined this order (no duplicate notification)`
            );
            skipFcmForDeclined = true;
          }
        } else if (bestOrder.orderType === "restaurant") {
          const restaurantDeclinedCheck = (await hasuraClient.request(
            CHECK_SHOPPER_DECLINED_ORDER_RESTAURANT,
            {
              restaurant_order_id: bestOrder.id,
              shopper_id: user_id,
            }
          )) as any;
          if (
            restaurantDeclinedCheck.order_offers &&
            restaurantDeclinedCheck.order_offers.length > 0
          ) {
            console.log(
              `⏭️ Skipping FCM for restaurant order ${bestOrder.id} - shopper already declined this order (no duplicate notification)`
            );
            skipFcmForDeclined = true;
          }
        } else if (bestOrder.orderType === "business") {
          const businessDeclinedCheck = (await hasuraClient.request(
            CHECK_SHOPPER_DECLINED_ORDER_BUSINESS,
            {
              business_order_id: bestOrder.id,
              shopper_id: user_id,
            }
          )) as any;
          if (
            businessDeclinedCheck.order_offers &&
            businessDeclinedCheck.order_offers.length > 0
          ) {
            console.log(
              `⏭️ Skipping FCM for business order ${bestOrder.id} - shopper already declined this order (no duplicate notification)`
            );
            skipFcmForDeclined = true;
          }
        }

        // Order is still unassigned - safe to send notification (unless skipped for declined)
        if (!skipFcmForDeclined) {
          console.log(
            `✅ Verified order ${bestOrder.id} is still unassigned - sending notification`
          );

          // Send notification aligned with what the UI should display/accept
          await sendNewOrderNotification(user_id, {
            id: responseOrder.id,
            shopName: responseOrder.shopName,
            customerAddress: responseOrder.customerAddress,
            distance: responseOrder.distance,
            travelTimeMinutes: responseOrder.travelTimeMinutes,
            estimatedEarnings: responseOrder.estimatedEarnings,
            orderType: responseOrder.orderType,
            // Action-based system: no expiry. Omit to use server default (or ignore).
            expiresInMs: undefined,
            displayOrderId: responseOrder.displayOrderId,
            OrderID: responseOrder.OrderID,
            isCombinedOrder: responseOrder.isCombinedOrder,
            orderCount: responseOrder.orderCount,
            storeNames: responseOrder.storeNames,
            combinedOrderId: responseOrder.combinedOrderId,
            orderIds: responseOrder.orderIds,
          });

          console.log(
            "✅ FCM notification sent to shopper:",
            user_id,
            "for order:",
            bestOrder.id,
            responseOrder.isCombinedOrder
              ? `(Combined: ${responseOrder.orderCount} stores)`
              : "",
            "| No time limit - waiting for explicit action"
          );
        }
      } catch (fcmError) {
        console.error("Failed to send FCM notification:", fcmError);
        // Continue even if notification fails - shopper can still poll
      }
    } else {
      console.log(
        "⏭️ Skipping FCM notification - extending existing offer (preventing duplicate notification)"
      );
    }

    return res.status(200).json({
      success: true,
      order: responseOrder,
      message: isExtendingOffer
        ? "Offer refreshed - still waiting for shopper action"
        : "Exclusive offer created - shopper must accept or decline",
      offerId: offerId,
      round: offerRound,
      expiresIn: null, // No time limit
      wasExtended: isExtendingOffer,
      note: "Action-based system: offer stays until shopper accepts or declines",
    });
  } catch (error) {
    console.error("=== ERROR in Smart Assignment API ===");
    console.error("Error:", error);
    console.error(
      "Error message:",
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    logger.error("Error in smart assignment", "SmartAssignmentAPI", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    await logErrorToSlack("SmartAssignmentAPI", error, {
      method: req.method,
      userId: (req.body as any)?.user_id,
    });

    return res.status(500).json({
      error: "Failed to find order",
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
