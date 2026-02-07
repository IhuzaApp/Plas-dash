import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getShopperLocation } from "../../../src/lib/redisClient";

// ============================================================================
// ACCEPT BATCH WITH OFFER VERIFICATION + DISTANCE RE-VALIDATION
// ============================================================================
// This API now implements atomic offer verification and order assignment:
// 1. Verify the offer exists and belongs to this shopper
// 2. Verify the offer hasn't expired
// 3. RE-VALIDATE: Verify shopper is still nearby (critical anti-cheat)
// 4. Update order_offers.status = ACCEPTED
// 5. Update order.shopper_id and order.status = accepted
// ============================================================================

// Max allowed distance for acceptance (in kilometers)
// This should match or be slightly larger than the max offer radius
const MAX_ACCEPTANCE_DISTANCE_KM = 10;

const ACCEPT_BATCH_MUTATION = gql`
  mutation AcceptBatch(
    $orderId: uuid!
    $shopperId: uuid!
    $assigned_at: timestamptz!
  ) {
    update_Orders_by_pk(
      pk_columns: { id: $orderId }
      _set: {
        shopper_id: $shopperId
        status: "accepted"
        updated_at: "now()"
        assigned_at: $assigned_at
      }
    ) {
      id
      status
      shopper_id
      updated_at
      assigned_at
    }
  }
`;

const ACCEPT_REEL_BATCH_MUTATION = gql`
  mutation AcceptReelBatch(
    $orderId: uuid!
    $shopperId: uuid!
    $assigned_at: timestamptz!
  ) {
    update_reel_orders_by_pk(
      pk_columns: { id: $orderId }
      _set: {
        shopper_id: $shopperId
        status: "accepted"
        updated_at: "now()"
        assigned_at: $assigned_at
      }
    ) {
      id
      status
      shopper_id
      updated_at
      assigned_at
    }
  }
`;

const ACCEPT_RESTAURANT_BATCH_MUTATION = gql`
  mutation AcceptRestaurantBatch(
    $orderId: uuid!
    $shopperId: uuid!
    $assigned_at: timestamptz!
  ) {
    update_restaurant_orders_by_pk(
      pk_columns: { id: $orderId }
      _set: {
        shopper_id: $shopperId
        status: "accepted"
        updated_at: "now()"
        assigned_at: $assigned_at
      }
    ) {
      id
      status
      shopper_id
      updated_at
      assigned_at
    }
  }
`;

const ACCEPT_BUSINESS_BATCH_MUTATION = gql`
  mutation AcceptBusinessBatch($orderId: uuid!, $shopperId: uuid!) {
    update_businessProductOrders_by_pk(
      pk_columns: { id: $orderId }
      _set: { shopper_id: $shopperId }
    ) {
      id
      status
      shopper_id
    }
  }
`;

const CHECK_ORDER_EXISTS = gql`
  query CheckOrderExists($orderId: uuid!) {
    Orders(where: { id: { _eq: $orderId } }) {
      id
      status
      shopper_id
      Address {
        latitude
        longitude
      }
    }

    reel_orders(where: { id: { _eq: $orderId } }) {
      id
      status
      shopper_id
      address: Address {
        latitude
        longitude
      }
    }

    restaurant_orders(where: { id: { _eq: $orderId } }) {
      id
      status
      shopper_id
      address: Address {
        latitude
        longitude
      }
    }

    businessProductOrders(where: { id: { _eq: $orderId } }) {
      id
      status
      shopper_id
      latitude
      longitude
      business_store {
        latitude
        longitude
      }
    }
  }
`;

// Query to verify the offer belongs to this shopper and is still valid
// Note: Action-based system - offers stay until accept/decline (matches decline-offer.ts)
const VERIFY_ORDER_OFFER = gql`
  query VerifyOrderOffer($orderId: uuid!, $shopperId: uuid!) {
    order_offers(
      where: {
        _and: [
          {
            _or: [
              { order_id: { _eq: $orderId } }
              { reel_order_id: { _eq: $orderId } }
              { restaurant_order_id: { _eq: $orderId } }
              { business_order_id: { _eq: $orderId } }
            ]
          }
          { shopper_id: { _eq: $shopperId } }
          { status: { _eq: "OFFERED" } }
        ]
      }
      order_by: { offered_at: desc }
      limit: 1
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

// Combined order helpers (regular Orders only)
const GET_COMBINED_ORDER_IDS = gql`
  query GetCombinedOrderIds($combined_order_id: uuid!) {
    Orders(where: { combined_order_id: { _eq: $combined_order_id } }) {
      id
      status
      shopper_id
      Address {
        latitude
        longitude
      }
      address: Address {
        latitude
        longitude
      }
    }
  }
`;

const VERIFY_COMBINED_OFFERS = gql`
  query VerifyCombinedOffers($orderIds: [uuid!]!, $shopperId: uuid!) {
    order_offers(
      where: {
        _and: [
          { order_id: { _in: $orderIds } }
          { shopper_id: { _eq: $shopperId } }
          { status: { _eq: "OFFERED" } }
          { expires_at: { _gt: "now()" } }
        ]
      }
    ) {
      id
      order_id
      shopper_id
      status
      expires_at
    }
  }
`;

const ACCEPT_COMBINED_OFFERS = gql`
  mutation AcceptCombinedOffers($offerIds: [uuid!]!) {
    update_order_offers(
      where: { id: { _in: $offerIds } }
      _set: { status: "ACCEPTED", updated_at: "now()" }
    ) {
      affected_rows
    }
  }
`;

const ASSIGN_COMBINED_ORDERS = gql`
  mutation AssignCombinedOrders(
    $orderIds: [uuid!]!
    $shopperId: uuid!
    $assigned_at: timestamptz!
  ) {
    update_Orders(
      where: { id: { _in: $orderIds } }
      _set: {
        shopper_id: $shopperId
        status: "accepted"
        updated_at: "now()"
        assigned_at: $assigned_at
      }
    ) {
      affected_rows
    }
  }
`;

// Mutation to mark offer as accepted
const ACCEPT_ORDER_OFFER = gql`
  mutation AcceptOrderOffer($offerId: uuid!) {
    update_order_offers_by_pk(
      pk_columns: { id: $offerId }
      _set: { status: "ACCEPTED", updated_at: "now()" }
    ) {
      id
      status
      shopper_id
    }
  }
`;

// Query to check if shopper already has active orders
const CHECK_ACTIVE_ORDERS = gql`
  query CheckActiveOrders($shopper_id: uuid!) {
    Orders(
      where: { shopper_id: { _eq: $shopper_id }, status: { _neq: "delivered" } }
    ) {
      id
      status
    }
    reel_orders(
      where: { shopper_id: { _eq: $shopper_id }, status: { _neq: "delivered" } }
    ) {
      id
      status
    }
    restaurant_orders(
      where: { shopper_id: { _eq: $shopper_id }, status: { _neq: "delivered" } }
    ) {
      id
      status
    }
    businessProductOrders(
      where: { shopper_id: { _eq: $shopper_id }, status: { _neq: "delivered" } }
    ) {
      id
      status
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { orderId, userId, orderType: clientOrderType } = req.body;

  if (!orderId || !userId) {
    return res.status(400).json({ error: "Order ID and User ID are required" });
  }

  if (userId !== session.user.id) {
    return res
      .status(403)
      .json({ error: "You can only accept batches for yourself" });
  }

  try {
    if (!hasuraClient) {
      return res
        .status(500)
        .json({ error: "Database connection not available" });
    }

    // ========================================================================
    // STEP 0: Determine whether this is a single orderId or a combined_order_id
    // ========================================================================
    // Because both are UUIDs, we detect by:
    // 1) Try as a normal order/reel/restaurant id
    // 2) If not found, treat as combined_order_id (regular Orders only)
    // ========================================================================

    const checkResponse = (await hasuraClient.request(CHECK_ORDER_EXISTS, {
      orderId,
    })) as any;

    const regularOrder = checkResponse.Orders?.[0];
    const reelOrder = checkResponse.reel_orders?.[0];
    const restaurantOrder = checkResponse.restaurant_orders?.[0];
    const businessOrder = checkResponse.businessProductOrders?.[0];

    const isReelOrder = !!reelOrder;
    const isRestaurantOrder = !!restaurantOrder;
    const isBusinessOrder = !!businessOrder;

    const isSingleOrder =
      !!regularOrder || !!reelOrder || !!restaurantOrder || !!businessOrder;

    // Handle combined regular orders (accept all linked orders at once)
    if (!isSingleOrder) {
      // Fetch all orders in the combined group
      const combinedResp = (await hasuraClient.request(GET_COMBINED_ORDER_IDS, {
        combined_order_id: orderId,
      })) as any;

      const combinedOrders = combinedResp.Orders || [];
      if (combinedOrders.length === 0) {
        return res.status(404).json({ error: "Order not found" });
      }

      const combinedOrderIds: string[] = combinedOrders.map((o: any) => o.id);

      // Verify shopper max active orders first (same rule)
      const activeOrdersData = (await hasuraClient.request(
        CHECK_ACTIVE_ORDERS,
        {
          shopper_id: userId,
        }
      )) as any;
      const activeOrders = [
        ...(activeOrdersData.Orders || []),
        ...(activeOrdersData.reel_orders || []),
        ...(activeOrdersData.restaurant_orders || []),
        ...(activeOrdersData.businessProductOrders || []),
      ];
      const activeOrderCount = activeOrders.length;
      if (activeOrderCount >= 2) {
        return res.status(403).json({
          error: `You already have ${activeOrderCount} active orders. Please deliver at least one before accepting more.`,
          code: "MAX_ACTIVE_ORDERS_REACHED",
          activeOrderCount,
        });
      }

      // Verify ALL offers exist for this shopper
      const offersResp = (await hasuraClient.request(VERIFY_COMBINED_OFFERS, {
        orderIds: combinedOrderIds,
        shopperId: userId,
      })) as any;

      const offers = offersResp.order_offers || [];
      if (offers.length !== combinedOrderIds.length) {
        return res.status(403).json({
          error:
            "You don't have active offers for all orders in this combined batch, or some offers expired",
          code: "NO_VALID_OFFER",
        });
      }

      // Check all orders are still available
      for (const o of combinedOrders) {
        if (o.shopper_id && o.shopper_id !== userId) {
          return res.status(409).json({
            error: "This batch has already been assigned to another shopper",
            code: "ALREADY_ASSIGNED",
          });
        }
        if (o.status !== "PENDING") {
          return res.status(409).json({
            error: "This batch is no longer available for assignment",
            code: "INVALID_STATUS",
          });
        }
      }

      // Distance re-validation (use the delivery address; combined orders share it)
      const shopperLocation = await getShopperLocation(userId);
      if (shopperLocation) {
        const first = combinedOrders[0];
        const orderLat = parseFloat(
          first.Address?.latitude || first.address?.latitude || "0"
        );
        const orderLng = parseFloat(
          first.Address?.longitude || first.address?.longitude || "0"
        );

        const calculateDistance = (
          lat1: number,
          lon1: number,
          lat2: number,
          lon2: number
        ): number => {
          const R = 6371;
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
        };

        const distance = calculateDistance(
          shopperLocation.lat,
          shopperLocation.lng,
          orderLat,
          orderLng
        );

        if (distance > MAX_ACCEPTANCE_DISTANCE_KM) {
          return res.status(403).json({
            error: `You are too far from the order location (${distance.toFixed(
              1
            )}km away)`,
            code: "TOO_FAR",
            distance: distance.toFixed(2),
            maxDistance: MAX_ACCEPTANCE_DISTANCE_KM,
          });
        }
      }

      const assignedAt = new Date().toISOString();

      // Accept all offers then assign all orders
      const offerIds = offers.map((o: any) => o.id);
      await hasuraClient.request(ACCEPT_COMBINED_OFFERS, { offerIds });
      const assignResp = (await hasuraClient.request(ASSIGN_COMBINED_ORDERS, {
        orderIds: combinedOrderIds,
        shopperId: userId,
        assigned_at: assignedAt,
      })) as any;

      return res.status(200).json({
        success: true,
        message: `Combined batch accepted (${combinedOrderIds.length} orders)`,
        combined_order_id: orderId,
        orderIds: combinedOrderIds,
        assignedAt,
      });
    }

    // ========================================================================
    // STEP 1: Verify the offer exists and belongs to this shopper
    // ========================================================================
    // This is the critical security check:
    // - Offer must exist for this order
    // - Offer must belong to this shopper (shopper_id = userId)
    // - Offer must be in OFFERED state
    // - Offer must not have expired (expires_at > now())
    // ========================================================================

    console.log("Verifying offer for order:", orderId, "shopper:", userId);

    const offerResponse = (await hasuraClient.request(VERIFY_ORDER_OFFER, {
      orderId,
      shopperId: userId,
    })) as any;

    const offer = offerResponse.order_offers?.[0];

    if (!offer) {
      console.warn(
        "❌ Offer verification failed - no valid offer found for order:",
        orderId,
        "shopper:",
        userId
      );
      return res.status(403).json({
        error:
          "You don't have an active offer for this order, or the offer has expired",
        code: "NO_VALID_OFFER",
      });
    }

    console.log("✅ Offer verified:", {
      offerId: offer.id,
      round: offer.round_number,
      expiresAt: offer.expires_at,
    });

    // ========================================================================
    // STEP 1.2: Check if shopper already has max active orders
    // ========================================================================
    // Shoppers can work on up to 2 orders at a time
    // ========================================================================

    const activeOrdersData = (await hasuraClient.request(CHECK_ACTIVE_ORDERS, {
      shopper_id: userId,
    })) as any;

    const activeOrders = [
      ...(activeOrdersData.Orders || []),
      ...(activeOrdersData.reel_orders || []),
      ...(activeOrdersData.restaurant_orders || []),
      ...(activeOrdersData.businessProductOrders || []),
    ];
    const activeOrderCount = activeOrders.length;

    if (activeOrderCount >= 2) {
      console.warn(
        "❌ Acceptance blocked - shopper already has 2 active orders:",
        userId
      );
      return res.status(403).json({
        error: `You already have ${activeOrderCount} active orders. Please deliver at least one before accepting more.`,
        code: "MAX_ACTIVE_ORDERS_REACHED",
        activeOrderCount,
      });
    }

    // ========================================================================
    // STEP 1.5: DISTANCE RE-VALIDATION (Critical Anti-Cheat)
    // ========================================================================
    // Professional systems re-validate location on accept to prevent:
    // - Spoofed locations
    // - Shoppers accepting from far away
    // - Race conditions with movement
    // ========================================================================

    const shopperLocation = await getShopperLocation(userId);

    if (!shopperLocation) {
      console.warn(
        "⚠️ No location found for shopper at acceptance time:",
        userId
      );
      console.warn("   This could mean:");
      console.warn("   - Redis unavailable (degraded mode)");
      console.warn("   - Shopper went offline");
      console.warn("   - Location TTL expired");
      console.warn("   Proceeding with acceptance (graceful degradation)");
    }

    // ========================================================================
    // STEP 2: Check if the order exists and is still available
    // ========================================================================
    // (Already fetched above as checkResponse)

    const order = regularOrder || reelOrder || restaurantOrder || businessOrder;

    // Check if order is already assigned to someone else
    if (order.shopper_id && order.shopper_id !== userId) {
      console.warn(
        "❌ Order already assigned to another shopper:",
        order.shopper_id
      );
      return res.status(409).json({
        error: "This batch has already been assigned to another shopper",
        code: "ALREADY_ASSIGNED",
      });
    }

    // Check if order is in valid state for acceptance
    // Regular/reel/restaurant use PENDING; business uses "Ready for Pickup"
    const validStatusForAccept = isBusinessOrder
      ? "Ready for Pickup"
      : "PENDING";
    if (order.status !== validStatusForAccept) {
      console.warn(
        "❌ Order is not in valid state for acceptance:",
        order.status
      );
      return res.status(409).json({
        error: "This batch is no longer available for assignment",
        code: "INVALID_STATUS",
      });
    }

    // ========================================================================
    // STEP 2.5: DISTANCE RE-VALIDATION CHECK
    // ========================================================================
    // Verify shopper is still nearby (prevents location spoofing)
    // ========================================================================

    if (shopperLocation) {
      // Get order location (pickup/store for distance validation)
      const orderLat = isBusinessOrder
        ? parseFloat(order.business_store?.latitude || order.latitude || "0")
        : parseFloat(order.Address?.latitude || order.address?.latitude || "0");
      const orderLng = isBusinessOrder
        ? parseFloat(order.business_store?.longitude || order.longitude || "0")
        : parseFloat(
            order.Address?.longitude || order.address?.longitude || "0"
          );

      // Calculate distance using Haversine formula
      const calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
      ): number => {
        const R = 6371; // Earth radius in km
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
      };

      const distance = calculateDistance(
        shopperLocation.lat,
        shopperLocation.lng,
        orderLat,
        orderLng
      );

      console.log(
        `📍 Distance re-validation: ${distance.toFixed(
          2
        )}km (max: ${MAX_ACCEPTANCE_DISTANCE_KM}km)`
      );

      if (distance > MAX_ACCEPTANCE_DISTANCE_KM) {
        console.error(
          `❌ DISTANCE RE-VALIDATION FAILED: Shopper is ${distance.toFixed(
            2
          )}km away (max: ${MAX_ACCEPTANCE_DISTANCE_KM}km)`
        );
        return res.status(403).json({
          error: `You are too far from the order location (${distance.toFixed(
            1
          )}km away)`,
          code: "TOO_FAR",
          distance: distance.toFixed(2),
          maxDistance: MAX_ACCEPTANCE_DISTANCE_KM,
        });
      }

      console.log(`✅ Distance re-validation passed: ${distance.toFixed(2)}km`);
    } else {
      console.log(
        "⚠️ Skipping distance re-validation (Redis unavailable or location expired)"
      );
    }

    // ========================================================================
    // STEP 3: Atomic Transaction - Accept Offer + Assign Order
    // ========================================================================
    // This must be atomic to prevent race conditions
    // ========================================================================

    const assignedAt = new Date().toISOString();

    console.log("Accepting offer and assigning order atomically...");

    // First, mark the offer as ACCEPTED
    const acceptOfferResponse = (await hasuraClient.request(
      ACCEPT_ORDER_OFFER,
      {
        offerId: offer.id,
      }
    )) as any;

    if (!acceptOfferResponse.update_order_offers_by_pk) {
      console.error("❌ Failed to accept offer");
      return res.status(500).json({
        error: "Failed to accept offer",
        code: "OFFER_UPDATE_FAILED",
      });
    }

    // Then, assign the order to the shopper
    let acceptResponse;

    if (isBusinessOrder) {
      acceptResponse = (await hasuraClient.request(
        ACCEPT_BUSINESS_BATCH_MUTATION,
        {
          orderId,
          shopperId: userId,
        }
      )) as any;
    } else if (isRestaurantOrder) {
      // Restaurant orders: update restaurant_orders row and set status to "accepted"
      acceptResponse = (await hasuraClient.request(
        ACCEPT_RESTAURANT_BATCH_MUTATION,
        {
          orderId,
          shopperId: userId,
          assigned_at: assignedAt,
        }
      )) as any;
    } else if (isReelOrder) {
      // Reel orders: update reel_orders row and set status to "accepted"
      acceptResponse = (await hasuraClient.request(ACCEPT_REEL_BATCH_MUTATION, {
        orderId,
        shopperId: userId,
        assigned_at: assignedAt,
      })) as any;
    } else {
      acceptResponse = (await hasuraClient.request(ACCEPT_BATCH_MUTATION, {
        orderId,
        shopperId: userId,
        assigned_at: assignedAt,
      })) as any;
    }

    if (
      acceptResponse.update_Orders_by_pk ||
      acceptResponse.update_reel_orders_by_pk ||
      acceptResponse.update_restaurant_orders_by_pk ||
      acceptResponse.update_businessProductOrders_by_pk
    ) {
      console.log(
        `✅ Batch ${orderId} accepted by shopper ${userId} (offer ${offer.id}, round ${offer.round_number})`
      );

      return res.status(200).json({
        success: true,
        message: "Batch accepted successfully",
        orderId,
        shopperId: userId,
        offerId: offer.id,
        roundNumber: offer.round_number,
        orderType: isBusinessOrder
          ? "business"
          : isRestaurantOrder
          ? "restaurant"
          : isReelOrder
          ? "reel"
          : "regular",
      });
    } else {
      console.error("❌ Failed to assign order after accepting offer");
      return res.status(500).json({
        error: "Failed to accept batch",
        code: "ORDER_UPDATE_FAILED",
      });
    }
  } catch (error) {
    console.error("Error accepting batch:", error);
    return res.status(500).json({
      error: "Failed to accept batch",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
