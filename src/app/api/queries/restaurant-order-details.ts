import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import type { Session } from "next-auth";
import { logger } from "../../../src/utils/logger";

// Fetch restaurant order details with all related data
// Schema: restaurant_order_items -> restaurant_dishes -> dishes (nested)
const GET_RESTAURANT_ORDER_DETAILS = gql`
  query GetRestaurantOrderDetails($order_id: uuid!) {
    restaurant_orders(where: { id: { _eq: $order_id } }) {
      id
      OrderID
      user_id
      status
      created_at
      total
      delivery_fee
      restaurant_id
      shopper_id
      delivery_time
      delivery_notes
      discount
      voucher_code
      found
      restaurant_order_items {
        quantity
        price
        dish_id
        id
        order_id
        created_at
        restaurant_dishes {
          id
          price
          preparingTime
          is_active
          dishes {
            name
            ingredients
            image
            category
            description
            id
            created_at
          }
        }
      }
      combined_order_id
      delivery_address_id
      delivery_photo_url
      updated_at
      orderedBy {
        created_at
        email
        id
        is_active
        name
        phone
        updated_at
      }
      Address {
        city
        created_at
        id
        is_default
        latitude
        longitude
        postal_code
        street
        updated_at
        user_id
      }
      Restaurant {
        created_at
        is_active
        email
        id
        lat
        location
        logo
        long
        name
        phone
        profile
        relatedTo
        tin
        ussd
        verified
      }
    }
  }
`;

interface RestaurantOrderDetailsResponse {
  restaurant_orders: Array<{
    id: string;
    OrderID: number | null;
    user_id: string;
    status: string;
    created_at: string;
    total: string;
    delivery_fee: string;
    restaurant_id: string;
    shopper_id: string | null;
    delivery_time: string;
    delivery_notes: string | null;
    discount: string | null;
    voucher_code: string | null;
    found: boolean;
    restaurant_order_items: Array<{
      quantity: string;
      price: string;
      dish_id: string;
      id: string;
      order_id: string;
      created_at: string;
      restaurant_dishes: {
        id: string;
        price: string;
        preparingTime: string | null;
        is_active: boolean;
        dishes: {
          name: string | null;
          ingredients: unknown;
          image: string | null;
          category: string | null;
          description: string | null;
          id: string;
          created_at: string;
        } | null;
      } | null;
    }>;
    combined_order_id: string | null;
    delivery_address_id: string;
    delivery_photo_url: string | null;
    updated_at: string | null;
    orderedBy: {
      created_at: string;
      email: string;
      id: string;
      is_active: boolean;
      name: string;
      phone: string;
      updated_at: string;
    };
    Address: {
      city: string;
      created_at: string;
      id: string;
      is_default: boolean;
      latitude: string;
      longitude: string;
      postal_code: string | null;
      street: string;
      updated_at: string;
      user_id: string;
    };
    Restaurant: {
      created_at: string;
      is_active: boolean;
      email: string;
      id: string;
      lat: string;
      location: string;
      logo: string | null;
      long: string;
      name: string;
      phone: string;
      profile: string;
      relatedTo: string;
      tin: string;
      ussd: string;
      verified: boolean;
    };
  }>;
}

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

    // Extract user ID from session
    const userId = (session.user as any).id;
    if (!userId) {
      return res.status(400).json({ error: "Missing user ID in session" });
    }

    const { id: orderId } = req.query;
    if (!orderId || typeof orderId !== "string") {
      return res.status(400).json({ error: "Order ID is required" });
    }

    logger.info(
      "Fetching restaurant order details",
      "RestaurantOrderDetailsAPI",
      { orderId, userId }
    );

    // Fetch restaurant order details
    const orderData =
      await hasuraClient.request<RestaurantOrderDetailsResponse>(
        GET_RESTAURANT_ORDER_DETAILS,
        { order_id: orderId }
      );

    const restaurantOrder = orderData.restaurant_orders[0];

    if (!restaurantOrder) {
      return res.status(404).json({ error: "Restaurant order not found" });
    }

    // Verify that the order belongs to the current user
    if (restaurantOrder.user_id !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Enrich the order data
    const itemsCount = restaurantOrder.restaurant_order_items?.length ?? 0;
    const unitsCount =
      restaurantOrder.restaurant_order_items?.reduce((sum, item) => {
        return sum + parseInt(item.quantity || "0");
      }, 0) ?? 0;

    const baseTotal = parseFloat(restaurantOrder.total || "0");
    const deliveryFee = parseFloat(restaurantOrder.delivery_fee || "0");
    const discountAmount = parseFloat(restaurantOrder.discount || "0");

    // Calculate subtotal (dishes total excluding delivery fee)
    const dishesTotal = baseTotal - deliveryFee;
    // Calculate tax (18% of dishes total)
    const tax = dishesTotal * 0.18;
    // Calculate pre-tax subtotal (dishes total - tax)
    const subtotal = dishesTotal - tax;
    // The total is what customer paid (already includes everything)
    const grandTotal = baseTotal;

    const enrichedOrder = {
      id: restaurantOrder.id,
      OrderID:
        restaurantOrder.OrderID != null
          ? String(restaurantOrder.OrderID)
          : restaurantOrder.id,
      user_id: restaurantOrder.user_id,
      status: restaurantOrder.status,
      created_at: restaurantOrder.created_at,
      delivery_time: restaurantOrder.delivery_time,
      total: grandTotal,
      subtotal: subtotal,
      tax: tax,
      shopper_id: restaurantOrder.shopper_id,
      shop: restaurantOrder.Restaurant
        ? {
            id: restaurantOrder.Restaurant.id,
            name: restaurantOrder.Restaurant.name,
            address: restaurantOrder.Restaurant.location,
            image: restaurantOrder.Restaurant.profile,
          }
        : null,
      itemsCount,
      unitsCount,
      orderType: "restaurant" as const,
      delivery_note: restaurantOrder.delivery_notes,
      delivery_fee: deliveryFee,
      discount: discountAmount,
      voucher_code: restaurantOrder.voucher_code,
      found: restaurantOrder.found,
      // Additional restaurant order specific fields
      combined_order_id: restaurantOrder.combined_order_id,
      delivery_photo_url: restaurantOrder.delivery_photo_url,
      updated_at: restaurantOrder.updated_at,
      orderedBy: restaurantOrder.orderedBy,
      Address: restaurantOrder.Address,
      Restaurant: restaurantOrder.Restaurant,
      // Include dish orders with dish details (restaurant_dishes -> dishes)
      restaurant_order_items: restaurantOrder.restaurant_order_items.map(
        (item) => {
          const rd = item.restaurant_dishes;
          const d = rd?.dishes ?? null;
          const dish = rd
            ? {
                id: rd.id,
                name: d?.name ?? "Unnamed Dish",
                description: d?.description ?? "",
                price: rd.price,
                image: d?.image ?? null,
                preparingTime: rd.preparingTime ?? "",
                ingredients: d?.ingredients ?? null,
                category: d?.category ?? null,
                is_active: rd.is_active,
              }
            : null;

          return {
            ...item,
            dish,
          };
        }
      ),
    };

    res.status(200).json({ order: enrichedOrder });
  } catch (error: unknown) {
    const err = error as {
      message?: string;
      response?: { errors?: Array<{ message?: string }> };
    };
    const message = err?.message ?? "Unknown error";
    const graphqlErrors = err?.response?.errors;
    const detail = graphqlErrors?.length
      ? graphqlErrors
          .map((e) => e?.message ?? "")
          .filter(Boolean)
          .join("; ")
      : message;
    logger.error(
      "Error fetching restaurant order details",
      "RestaurantOrderDetailsAPI",
      { error, detail, graphqlErrors }
    );
    res.status(500).json({
      error: "Failed to fetch restaurant order details",
      detail,
    });
  }
}
