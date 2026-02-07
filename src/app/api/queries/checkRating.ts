import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const CHECK_ORDER_RATING = gql`
  query CheckOrderRating($orderId: uuid!) {
    Ratings(where: { order_id: { _eq: $orderId } }) {
      id
    }
  }
`;

const CHECK_REEL_ORDER_RATING = gql`
  query CheckReelOrderRating($reelOrderId: uuid!) {
    Ratings(where: { reel_order_id: { _eq: $reelOrderId } }) {
      id
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

  const { orderId, reelOrderId } = req.query;

  if (!orderId && !reelOrderId) {
    return res
      .status(400)
      .json({ message: "Either orderId or reelOrderId is required" });
  }

  if (!hasuraClient) {
    return res.status(500).json({ message: "Hasura client not initialized" });
  }

  try {
    let data;

    if (orderId) {
      // Check for regular order rating
      data = await hasuraClient.request(CHECK_ORDER_RATING, {
        orderId: orderId,
      });
    } else if (reelOrderId) {
      // Check for reel order rating
      data = await hasuraClient.request(CHECK_REEL_ORDER_RATING, {
        reelOrderId: reelOrderId,
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error checking rating:", error);
    return res.status(500).json({ message: "Error checking rating" });
  }
}
