import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

// GraphQL query to fetch a single order with nested details
const GET_ORDER_DETAILS = gql`
  query GetOrderDetails($id: uuid!) {
    Orders(where: { id: { _eq: $id } }, limit: 1) {
      id
      OrderID
      placedAt: created_at
      estimatedDelivery: delivery_time
      deliveryNotes: delivery_notes
      total
      serviceFee: service_fee
      deliveryFee: delivery_fee
      status
      deliveryPhotoUrl: delivery_photo_url
      discount
      combinedOrderId: combined_order_id
      voucherCode: voucher_code
      shop_id
      pin
      shop: Shop {
        id
        name
        address
        image
        phone
        latitude
        longitude
        operating_hours
      }
      Order_Items {
        id
        product_id
        quantity
        price
        product: Product {
          id
          price
          final_price
          measurement_unit
          category
          quantity
          sku
          image
          productName_id
          ProductName {
            barcode
            create_at
            description
            id
            image
            name
            sku
          }
          created_at
          is_active
          reorder_point
          shop_id
          supplier
          updated_at
        }
        order_id
      }
      Shoppers {
        id
        name
        email
        phone
        profile_picture
        shopper {
          id
          full_name
          profile_photo
          phone_number
          address
          Employment_id
        }
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
      }
      address: Address {
        id
        street
        city
        postal_code
        latitude
        longitude
        is_default
      }
      delivery_address_id
      shopper_id
      updated_at
      user_id
      assigned_at
      orderedBy {
        created_at
        email
        gender
        id
        is_active
        is_guest
        name
        password_hash
        profile_picture
        phone
        updated_at
        role
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

  const { id } = req.query;
  if (!id || (Array.isArray(id) && id.length === 0)) {
    return res.status(400).json({ error: "Missing order ID" });
  }

  // Ensure we have a single string ID
  const orderId = Array.isArray(id) ? id[0] : id;

  // Validate the UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(orderId)) {
    return res.status(400).json({ error: "Invalid order ID format" });
  }

  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const data = await hasuraClient.request<{
      Orders: Array<{
        id: string;
        OrderID: string;
        placedAt: string;
        estimatedDelivery: string | null;
        deliveryNotes: string | null;
        total: string;
        serviceFee: string;
        deliveryFee: string;
        status: string;
        deliveryPhotoUrl: string | null;
        discount: string | null;
        combinedOrderId: string | null;
        voucherCode: string | null;
        pin: string;
        shop_id: string;
        shop: {
          id: string;
          name: string;
          address: string;
          image: string | null;
          phone: string;
          latitude: number;
          longitude: number;
          operating_hours: string | null;
        };
        Order_Items: Array<{
          id: string;
          product_id: string;
          quantity: number;
          price: string;
          product: {
            id: string;
            price: string;
            final_price: string;
            measurement_unit: string;
            category: string;
            quantity: number;
            sku: string;
            image: string | null;
            productName_id: string;
            ProductName: {
              barcode: string | null;
              create_at: string;
              description: string | null;
              id: string;
              image: string | null;
              name: string;
              sku: string | null;
            };
            created_at: string;
            is_active: boolean;
            reorder_point: number;
            shop_id: string;
            supplier: string | null;
            updated_at: string;
          };
          order_id: string;
        }>;
        assignedTo: {
          id: string;
          name: string;
          email: string;
          phone: string;
          profile_picture: string | null;
          shopper: {
            id: string;
            full_name: string;
            profile_photo: string | null;
            phone_number: string | null;
            address: string | null;
            Employment_id: string | null;
          } | null;
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
        address: {
          id: string;
          street: string;
          city: string;
          postal_code: string;
          latitude: number;
          longitude: number;
          is_default: boolean;
        } | null;
        delivery_address_id: string | null;
        shopper_id: string | null;
        updated_at: string;
        user_id: string;
        assigned_at: string | null;
        orderedBy: {
          created_at: string;
          email: string;
          gender: string | null;
          id: string;
          is_active: boolean;
          is_guest: boolean;
          name: string;
          password_hash: string;
          profile_picture: string | null;
          phone: string;
          updated_at: string;
          role: string;
        };
      }>;
    }>(GET_ORDER_DETAILS, { id: orderId });

    // Check if order exists
    if (!data.Orders || data.Orders.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = data.Orders[0];

    // If there's an assigned shopper, fetch their complete stats
    let shopperStats = null;
    if (order.assignedTo) {
      const shopperId = order.assignedTo.id;

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

    // Format timestamps to human-readable strings
    const formattedOrder = {
      ...order,
      placedAt: new Date(order.placedAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      // Handle case where estimatedDelivery might be null
      estimatedDelivery: order.estimatedDelivery
        ? new Date(order.estimatedDelivery).toISOString()
        : null,
      // Use calculated shopper stats if available
      assignedTo:
        order.Shoppers && shopperStats
          ? {
              ...order.Shoppers,
              rating: shopperStats.rating,
              orders_aggregate: shopperStats.orders_aggregate,
              recentReviews: shopperStats.recentReviews,
            }
          : order.Shoppers
          ? {
              ...order.Shoppers,
              rating: 0,
              orders_aggregate: {
                aggregate: {
                  count: 0,
                },
              },
              recentReviews: [],
            }
          : null,
    };

    res.status(200).json({ order: formattedOrder });
  } catch (error) {
    console.error("❌ Order Details API Error:", error);
    console.error(
      "❌ Error details:",
      error instanceof Error ? error.message : "Unknown error"
    );
    res.status(500).json({
      error: "Failed to fetch order details",
      details: error instanceof Error ? error.message : "Unknown error",
      fullError: JSON.stringify(error, null, 2),
    });
  }
}
