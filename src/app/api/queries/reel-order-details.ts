import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import type { Session } from "next-auth";
import { logger } from "../../../src/utils/logger";

// Fetch reel order details
const GET_REEL_ORDER_DETAILS = gql`
  query GetReelOrderDetails($order_id: uuid!) {
    reel_orders_by_pk(id: $order_id) {
      id
      OrderID
      user_id
      status
      created_at
      total
      service_fee
      delivery_fee
      discount
      voucher_code
      delivery_time
      delivery_note
      quantity
      found
      shopper_id
      pin
      Reel {
        id
        title
        description
        Price
        Product
        type
        video_url
        user_id
        created_on
        likes
        isLiked
        category
        delivery_time
        restaurant_id
        Restaurant {
          id
          name
          location
        }
      }
      User {
        id
        name
        email
        phone
      }
      Shoppers {
        id
        name
        email
        phone
        Ratings {
          created_at
          customer_id
          delivery_experience
          id
          order_id
          packaging_quality
          professionalism
          rating
          reel_order_id
          review
          reviewed_at
          shopper_id
          updated_at
        }
        gender
        profile_picture
      }
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Get the user ID from the session
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as Session | null;
    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.query;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Order ID is required" });
    }

    logger.info("Fetching reel order details", "ReelOrderDetailsAPI", {
      orderId: id,
    });

    // Fetch reel order details
    const data = await hasuraClient.request<{
      reel_orders_by_pk: {
        id: string;
        OrderID: string;
        user_id: string;
        status: string;
        created_at: string;
        total: string;
        service_fee: string;
        delivery_fee: string;
        discount: string | null;
        voucher_code: string | null;
        delivery_time: string;
        delivery_note: string;
        quantity: string;
        found: boolean;
        shopper_id: string | null;
        Reel: {
          id: string;
          title: string;
          description: string;
          Price: string;
          Product: string;
          type: string;
          video_url: string;
          user_id: string;
          created_on: string;
          likes: number;
          isLiked: boolean;
          category: string;
          delivery_time: string;
          restaurant_id: string;
          Restaurant: {
            id: string;
            name: string;
            location: string;
          };
        };
        User: {
          id: string;
          name: string;
          email: string;
          phone: string;
        };
        Shoppers: {
          id: string;
          name: string;
          email: string;
          phone: string;
          gender: string | null;
          profile_picture: string | null;
          Ratings: Array<{
            created_at: string;
            customer_id: string;
            delivery_experience: string;
            id: string;
            order_id: string | null;
            packaging_quality: string;
            professionalism: string;
            rating: string;
            reel_order_id: string | null;
            review: string | null;
            reviewed_at: string | null;
            shopper_id: string;
            updated_at: string;
          }>;
        } | null;
      } | null;
    }>(GET_REEL_ORDER_DETAILS, { order_id: id });

    const orderData = data.reel_orders_by_pk;
    if (!orderData) {
      return res.status(404).json({ error: "Reel order not found" });
    }

    // If there's an assigned shopper, fetch their complete stats
    let shopperStats = null;
    if (orderData.Shoppers) {
      const shopperId = orderData.Shoppers.id;

      // Query to get all ratings for this shopper and count of delivered orders
      const GET_SHOPPER_STATS = gql`
        query GetShopperStats($shopperId: uuid!) {
          # Get all ratings for this shopper
          Ratings(where: { shopper_id: { _eq: $shopperId } }) {
            rating
          }
          # Get recent reviews (5 most recent with reviews)
          RecentReviews: Ratings(
            where: {
              shopper_id: { _eq: $shopperId }
              _and: [{ review: { _is_null: false } }, { review: { _neq: "" } }]
            }
            order_by: { reviewed_at: desc_nulls_last }
            limit: 5
          ) {
            id
            rating
            review
            reviewed_at
            customer_id
            User {
              id
              name
              profile_picture
            }
          }
          # Count delivered regular orders
          Orders_aggregate(
            where: {
              shopper_id: { _eq: $shopperId }
              status: { _eq: "delivered" }
            }
          ) {
            aggregate {
              count
            }
          }
          # Count delivered reel orders
          reel_orders_aggregate(
            where: {
              shopper_id: { _eq: $shopperId }
              status: { _eq: "delivered" }
            }
          ) {
            aggregate {
              count
            }
          }
          # Count delivered restaurant orders
          restaurant_orders_aggregate(
            where: {
              shopper_id: { _eq: $shopperId }
              status: { _eq: "delivered" }
            }
          ) {
            aggregate {
              count
            }
          }
        }
      `;

      const statsData = await hasuraClient.request<{
        Ratings: Array<{ rating: string }>;
        RecentReviews: Array<{
          id: string;
          rating: number;
          review: string;
          reviewed_at: string | null;
          customer_id: string;
          User: {
            id: string;
            name: string;
            profile_picture: string | null;
          };
        }>;
        Orders_aggregate: { aggregate: { count: number } };
        reel_orders_aggregate: { aggregate: { count: number } };
        restaurant_orders_aggregate: { aggregate: { count: number } };
      }>(GET_SHOPPER_STATS, { shopperId });

      // Calculate average rating from all ratings
      const averageRating =
        statsData.Ratings.length > 0
          ? statsData.Ratings.reduce(
              (sum, rating) => sum + parseFloat(rating.rating || "0"),
              0
            ) / statsData.Ratings.length
          : 0;

      // Count total delivered orders (regular + reel + restaurant)
      const regularOrdersCount =
        statsData.Orders_aggregate?.aggregate?.count || 0;
      const reelOrdersCount =
        statsData.reel_orders_aggregate?.aggregate?.count || 0;
      const restaurantOrdersCount =
        statsData.restaurant_orders_aggregate?.aggregate?.count || 0;
      const totalDeliveredOrders =
        regularOrdersCount + reelOrdersCount + restaurantOrdersCount;

      // Debug logging
      console.log("Shopper Stats for", shopperId, {
        ratingsCount: statsData.Ratings.length,
        averageRating,
        regularOrdersCount,
        reelOrdersCount,
        restaurantOrdersCount,
        totalDeliveredOrders,
      });

      shopperStats = {
        rating: averageRating,
        orders_aggregate: {
          aggregate: {
            count: totalDeliveredOrders,
          },
        },
        recentReviews: statsData.RecentReviews || [],
      };
    }

    // Format the order data for the frontend
    const formattedOrder = {
      id: orderData.id,
      OrderID: orderData.OrderID,
      status: orderData.status,
      created_at: orderData.created_at,
      placedAt: new Date(orderData.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      total: parseFloat(orderData.total),
      service_fee: parseFloat(orderData.service_fee),
      delivery_fee: parseFloat(orderData.delivery_fee),
      discount: orderData.discount ? parseFloat(orderData.discount) : 0,
      voucher_code: orderData.voucher_code,
      delivery_time: orderData.delivery_time,
      estimatedDelivery: orderData.delivery_time,
      delivery_note: orderData.delivery_note,
      quantity: parseInt(orderData.quantity),
      found: orderData.found,
      pin:
        orderData.pin != null && String(orderData.pin).trim() !== ""
          ? String(orderData.pin)
          : orderData.OrderID != null
          ? String(orderData.OrderID).padStart(4, "0").slice(-4)
          : orderData.id
          ? orderData.id.slice(0, 4).toUpperCase()
          : "",
      orderType: "reel" as const,
      reel: orderData.Reel,
      assignedTo: orderData.Shoppers
        ? {
            id: orderData.Shoppers.id,
            name: orderData.Shoppers.name,
            phone: orderData.Shoppers.phone,
            email: orderData.Shoppers.email,
            profile_photo: orderData.Shoppers.profile_picture,
            gender: orderData.Shoppers.gender,
            rating: shopperStats?.rating || 0,
            orders_aggregate: shopperStats?.orders_aggregate || {
              aggregate: {
                count: 0,
              },
            },
            recentReviews: shopperStats?.recentReviews || [],
          }
        : null,
    };

    res.status(200).json({ order: formattedOrder });
  } catch (error) {
    logger.error(
      "Error fetching reel order details",
      "ReelOrderDetailsAPI",
      error
    );
    res.status(500).json({ error: "Failed to fetch reel order details" });
  }
}
