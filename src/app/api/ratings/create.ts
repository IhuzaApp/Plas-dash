import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { notifyNewReviewToSlack } from "../../../src/lib/slackSystemNotifier";

const CREATE_RATING = gql`
  mutation CreateRating($rating: Ratings_insert_input!) {
    insert_Ratings_one(object: $rating) {
      id
      rating
      review
      delivery_experience
      packaging_quality
      professionalism
      order_id
      reel_order_id
      created_at
    }
  }
`;

const GET_ORDER_FOR_REVIEW = gql`
  query GetOrderForReview($order_id: uuid!) {
    Orders_by_pk(id: $order_id) {
      OrderID
      Shop {
        name
      }
      Shoppers {
        name
        shopper {
          full_name
        }
      }
    }
  }
`;

const GET_REEL_ORDER_FOR_REVIEW = gql`
  query GetReelOrderForReview($reel_order_id: uuid!) {
    reel_orders_by_pk(id: $reel_order_id) {
      OrderID
      Reel {
        title
      }
      Shoppers {
        name
      }
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Get user session
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as any;
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      order_id,
      reel_order_id,
      shopper_id,
      rating,
      review,
      delivery_experience,
      packaging_quality,
      professionalism,
    } = req.body;

    // Validate required fields
    if (!shopper_id || !rating) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate that either order_id or reel_order_id is provided
    if (!order_id && !reel_order_id) {
      return res
        .status(400)
        .json({ error: "Either order_id or reel_order_id is required" });
    }

    // Create rating record
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const ratingData = {
      order_id: order_id || null,
      reel_order_id: reel_order_id || null,
      shopper_id,
      customer_id: session.user.id,
      rating,
      review: review || "",
      delivery_experience,
      packaging_quality,
      professionalism,
      reviewed_at: new Date().toISOString(),
    };

    const data = await hasuraClient.request(CREATE_RATING, {
      rating: ratingData,
    });

    // Add type checking for the response data
    if (data && typeof data === "object" && "insert_Ratings_one" in data) {
      // Fetch order details for Slack "new review" notification
      let orderNumber = "—";
      let storeName: string | undefined;
      let shopperName: string | undefined;

      if (order_id && hasuraClient) {
        try {
          const orderRes = await hasuraClient.request<{
            Orders_by_pk: {
              OrderID: number;
              Shop: { name: string } | null;
              Shoppers: {
                name: string;
                shopper: { full_name: string } | null;
              } | null;
            } | null;
          }>(GET_ORDER_FOR_REVIEW, { order_id });
          const o = orderRes?.Orders_by_pk;
          if (o) {
            orderNumber =
              o.OrderID != null ? String(o.OrderID).padStart(4, "0") : "—";
            storeName = o.Shop?.name;
            shopperName = o.Shoppers?.shopper?.full_name ?? o.Shoppers?.name;
          }
        } catch (e) {
          console.error("Failed to fetch order for review notification", e);
        }
      } else if (reel_order_id && hasuraClient) {
        try {
          const reelRes = await hasuraClient.request<{
            reel_orders_by_pk: {
              OrderID: number;
              Reel: { title: string } | null;
              Shoppers: { name: string } | null;
            } | null;
          }>(GET_REEL_ORDER_FOR_REVIEW, { reel_order_id: reel_order_id });
          const r = reelRes?.reel_orders_by_pk;
          if (r) {
            orderNumber =
              r.OrderID != null ? String(r.OrderID).padStart(4, "0") : "—";
            storeName = r.Reel?.title ?? "Reel order";
            shopperName = r.Shoppers?.name;
          }
        } catch (e) {
          console.error(
            "Failed to fetch reel order for review notification",
            e
          );
        }
      }

      await notifyNewReviewToSlack({
        orderNumber,
        overallRating: parseFloat(String(rating)) || 0,
        shopperName,
        storeName,
        comment: review || undefined,
      });

      return res.status(201).json(data.insert_Ratings_one);
    }

    throw new Error("Invalid response data");
  } catch (error) {
    console.error("Error creating rating:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create rating",
    });
  }
}
