import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { logger } from "../../../src/utils/logger";

// ============================================================================
// DECLINE OFFER
// ============================================================================
// This API marks an offer as DECLINED in the order_offers table
// 1. Verify the offer exists and belongs to this shopper
// 2. Verify the offer is in OFFERED state
// 3. Update order_offers.status = DECLINED
// 4. System will automatically rotate to next shopper via smart-assign-order
// ============================================================================

// Query to verify the offer belongs to this shopper and is still valid
// Note: In action-based system, offers don't expire - they stay until accepted/declined
// So we only check for OFFERED status, not expiration
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
      order_id
      reel_order_id
      restaurant_order_id
      order_type
    }
  }
`;

// Mutation to mark offer as declined
const DECLINE_ORDER_OFFER = gql`
  mutation DeclineOrderOffer($offerId: uuid!) {
    update_order_offers_by_pk(
      pk_columns: { id: $offerId }
      _set: { status: "DECLINED", updated_at: "now()" }
    ) {
      id
      status
      shopper_id
    }
  }
`;

// Combined order support (regular Orders only)
const GET_COMBINED_ORDER_IDS = gql`
  query GetCombinedOrderIds($combined_order_id: uuid!) {
    Orders(where: { combined_order_id: { _eq: $combined_order_id } }) {
      id
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
        ]
      }
    ) {
      id
      order_id
      status
      offered_at
      round_number
    }
  }
`;

const DECLINE_COMBINED_OFFERS = gql`
  mutation DeclineCombinedOffers($offerIds: [uuid!]!) {
    update_order_offers(
      where: { id: { _in: $offerIds } }
      _set: { status: "DECLINED", updated_at: "now()" }
    ) {
      affected_rows
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

  const { orderId, shopperId } = req.body;

  if (!orderId || !shopperId) {
    return res.status(400).json({
      error: "Order ID and Shopper ID are required",
    });
  }

  if (shopperId !== session.user.id) {
    return res
      .status(403)
      .json({ error: "You can only decline offers for yourself" });
  }

  try {
    if (!hasuraClient) {
      return res
        .status(500)
        .json({ error: "Database connection not available" });
    }

    // ========================================================================
    // STEP 1: Verify the offer exists and belongs to this shopper
    // ========================================================================
    // This is the critical security check:
    // - Offer must exist for this order
    // - Offer must belong to this shopper (shopper_id = shopperId)
    // - Offer must be in OFFERED state
    // Note: In action-based system, offers don't expire - they stay until
    // accepted or declined, so we don't check expires_at
    // ========================================================================

    console.log(
      "Verifying offer for decline - order:",
      orderId,
      "shopper:",
      shopperId
    );

    const offerResponse = (await hasuraClient.request(VERIFY_ORDER_OFFER, {
      orderId,
      shopperId: shopperId,
    })) as any;

    const offer = offerResponse.order_offers?.[0];

    if (!offer) {
      // If orderId is actually a combined_order_id, decline ALL offers in that group
      const combinedResp = (await hasuraClient.request(GET_COMBINED_ORDER_IDS, {
        combined_order_id: orderId,
      })) as any;
      const combinedOrders = combinedResp.Orders || [];
      if (combinedOrders.length > 0) {
        const combinedOrderIds = combinedOrders.map((o: any) => o.id);
        const combinedOffersResp = (await hasuraClient.request(
          VERIFY_COMBINED_OFFERS,
          {
            orderIds: combinedOrderIds,
            shopperId: shopperId,
          }
        )) as any;

        const combinedOffers = combinedOffersResp.order_offers || [];
        if (combinedOffers.length === combinedOrderIds.length) {
          await hasuraClient.request(DECLINE_COMBINED_OFFERS, {
            offerIds: combinedOffers.map((o: any) => o.id),
          });

          return res.status(200).json({
            success: true,
            message: "Combined offer declined successfully",
            combined_order_id: orderId,
            orderIds: combinedOrderIds,
            offerIds: combinedOffers.map((o: any) => o.id),
            note: "Combined order will be rotated as a group to the next eligible shopper",
          });
        }
      }

      // Check if there are any offers for this order/shopper combination (any status)
      const CHECK_ANY_OFFER = gql`
        query CheckAnyOffer($orderId: uuid!, $shopperId: uuid!) {
          order_offers(
            where: {
              _and: [
                {
                  _or: [
                    { order_id: { _eq: $orderId } }
                    { reel_order_id: { _eq: $orderId } }
                    { restaurant_order_id: { _eq: $orderId } }
                  ]
                }
                { shopper_id: { _eq: $shopperId } }
              ]
            }
            order_by: { offered_at: desc }
            limit: 5
          ) {
            id
            status
            offered_at
            expires_at
            round_number
            order_id
            reel_order_id
            restaurant_order_id
          }
        }
      `;

      const anyOfferResponse = (await hasuraClient.request(CHECK_ANY_OFFER, {
        orderId,
        shopperId: shopperId,
      })) as any;

      const anyOffers = anyOfferResponse.order_offers || [];

      console.warn(
        "❌ Offer verification failed - no valid OFFERED offer found for order:",
        orderId,
        "shopper:",
        shopperId,
        "Found offers with other statuses:",
        anyOffers.map((o: any) => ({
          id: o.id,
          status: o.status,
          round: o.round_number,
        }))
      );

      if (anyOffers.length > 0) {
        const statuses = anyOffers.map((o: any) => o.status).join(", ");
        return res.status(403).json({
          error: `You don't have an active offer for this order. Found offers with status: ${statuses}. The offer may have already been accepted, declined, or expired.`,
          code: "NO_VALID_OFFER",
          foundOffers: anyOffers.map((o: any) => ({
            id: o.id,
            status: o.status,
            round: o.round_number,
          })),
        });
      }

      return res.status(403).json({
        error:
          "You don't have an active offer for this order. It may have already been accepted, declined, or assigned to another shopper.",
        code: "NO_VALID_OFFER",
      });
    }

    console.log("✅ Offer verified for decline:", {
      offerId: offer.id,
      round: offer.round_number,
      expiresAt: offer.expires_at,
      orderType: offer.order_type,
    });

    // ========================================================================
    // STEP 2: Mark the offer as DECLINED
    // ========================================================================

    console.log("Declining offer...");

    const declineResponse = (await hasuraClient.request(DECLINE_ORDER_OFFER, {
      offerId: offer.id,
    })) as any;

    if (!declineResponse.update_order_offers_by_pk) {
      console.error("❌ Failed to decline offer");
      return res.status(500).json({
        error: "Failed to decline offer",
        code: "OFFER_UPDATE_FAILED",
      });
    }

    console.log(
      `✅ Offer ${offer.id} declined by shopper ${shopperId} (order ${orderId}, round ${offer.round_number})`
    );

    // ========================================================================
    // STEP 3: Return success response
    // ========================================================================
    // Note: The smart-assign-order system will automatically rotate this order
    // to the next eligible shopper when it runs its next check
    // ========================================================================

    return res.status(200).json({
      success: true,
      message: "Offer declined successfully",
      orderId,
      shopperId: shopperId,
      offerId: offer.id,
      roundNumber: offer.round_number,
      orderType: offer.order_type,
      note: "Order will be rotated to next eligible shopper automatically",
    });
  } catch (error) {
    console.error("Error declining offer:", error);
    logger.error("Error declining offer", "DeclineOfferAPI", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return res.status(500).json({
      error: "Failed to decline offer",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
