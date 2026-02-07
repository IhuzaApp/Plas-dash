import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import type { Session } from "next-auth";
import { logger } from "../../../src/utils/logger";

// Default and max limits for pagination
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Fetch regular orders and reel orders for a specific user with pagination
const GET_USER_ORDERS = gql`
  query GetUserOrders($user_id: uuid!, $limit: Int!, $offset: Int!) {
    Orders(
      where: { user_id: { _eq: $user_id } }
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      OrderID
      user_id
      status
      created_at
      total
      service_fee
      delivery_fee
      shop_id
      shopper_id
      delivery_time
      pin
      combined_order_id
      Order_Items_aggregate {
        aggregate {
          count
          sum {
            quantity
          }
        }
      }
    }
    reel_orders(
      where: { user_id: { _eq: $user_id } }
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      OrderID
      user_id
      status
      created_at
      total
      service_fee
      delivery_fee
      delivery_time
      quantity
      discount
      voucher_code
      combined_order_id
      pin
      reel: Reel {
        id
        title
        description
        Price
        Product
        type
        video_url
        shop_id
        Shops {
          id
          name
          address
          image
          logo
        }
      }
    }
    restaurant_orders(
      where: { user_id: { _eq: $user_id } }
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      OrderID
      user_id
      status
      created_at
      total
      delivery_fee
      delivery_time
      combined_order_id
      restaurant_id
      pin
      Restaurant {
        id
        name
        location
        logo
      }
      restaurant_order_items_aggregate {
        aggregate {
          count
        }
      }
    }
    # Get total counts for pagination metadata
    Orders_aggregate(where: { user_id: { _eq: $user_id } }) {
      aggregate {
        count
      }
    }
    reel_orders_aggregate(where: { user_id: { _eq: $user_id } }) {
      aggregate {
        count
      }
    }
    restaurant_orders_aggregate(where: { user_id: { _eq: $user_id } }) {
      aggregate {
        count
      }
    }
    businessProductOrders(
      where: { ordered_by: { _eq: $user_id } }
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      store_id
      total
      transportation_fee
      service_fee
      status
      created_at
      delivered_time
      timeRange
      units
      pin
      business_store {
        id
        name
        image
      }
      allProducts
    }
    businessProductOrders_aggregate(where: { ordered_by: { _eq: $user_id } }) {
      aggregate {
        count
      }
    }
  }
`;

// Fetch shop details by IDs
const GET_SHOPS_BY_IDS = gql`
  query GetShopsByIds($ids: [uuid!]!) {
    Shops(where: { id: { _in: $ids } }) {
      id
      name
      address
      image
      logo
      category_id
    }
  }
`;

interface OrdersResponse {
  Orders: Array<{
    id: string;
    OrderID: string;
    user_id: string;
    status: string;
    created_at: string;
    total: string;
    service_fee: string;
    delivery_fee: string;
    shop_id: string;
    shopper_id: string | null;
    delivery_time: string;
    pin: string;
    combined_order_id: string | null;
    Order_Items_aggregate: {
      aggregate: {
        count: number;
        sum: {
          quantity: number | null;
        } | null;
      } | null;
    };
  }>;
  reel_orders: Array<{
    id: string;
    OrderID: string;
    user_id: string;
    status: string;
    created_at: string;
    total: string;
    service_fee: string;
    delivery_fee: string;
    delivery_time: string;
    quantity: string;
    discount: string | null;
    voucher_code: string | null;
    combined_order_id: string | null;
    pin?: string | number | null;
    reel: {
      id: string;
      title: string;
      description: string | null;
      Price: string;
      Product: string;
      type: string;
      video_url: string;
      shop_id: string | null;
      Shops: {
        id: string;
        name: string;
        address: string;
        image: string;
        logo: string;
      } | null;
    } | null;
  }>;
  restaurant_orders: Array<{
    id: string;
    OrderID: string | null;
    user_id: string;
    status: string;
    created_at: string;
    total: string;
    delivery_fee: string;
    delivery_time: string;
    combined_order_id: string | null;
    restaurant_id: string;
    pin?: string | null;
    Restaurant: {
      id: string;
      name: string;
      location: string;
      logo: string | null;
    } | null;
    restaurant_order_items_aggregate?: {
      aggregate: { count: number } | null;
    } | null;
  }>;
  Orders_aggregate: {
    aggregate: { count: number } | null;
  };
  reel_orders_aggregate: {
    aggregate: { count: number } | null;
  };
  restaurant_orders_aggregate: {
    aggregate: { count: number } | null;
  };
  businessProductOrders: Array<{
    id: string;
    store_id: string;
    total: string;
    transportation_fee: string;
    service_fee: string;
    status: string | null;
    created_at: string;
    delivered_time: string | null;
    timeRange: string | null;
    units: string;
    pin?: number | null;
    business_store: {
      id: string;
      name: string;
      address: string | null;
      image: string | null;
      logo: string | null;
    } | null;
    allProducts: any;
  }>;
  businessProductOrders_aggregate: {
    aggregate: { count: number } | null;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Get the user ID from the session (works for both guest and regular users)
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as Session | null;

    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = (session.user as any).id;

    if (!userId) {
      return res.status(400).json({ error: "User ID not found in session" });
    }

    // Parse pagination params from query string
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(req.query.limit as string, 10) || DEFAULT_LIMIT)
    );
    const offset = (page - 1) * limit;
    const minimal = req.query.minimal === "1" || req.query.minimal === "true";

    // Fetch orders for this specific user only with pagination
    const data = await hasuraClient.request<OrdersResponse>(GET_USER_ORDERS, {
      user_id: userId,
      limit,
      offset,
    });
    const orders = data.Orders;
    const reelOrders = data.reel_orders || [];
    const restaurantOrders = data.restaurant_orders || [];
    const businessOrders = data.businessProductOrders || [];

    // Get total counts for pagination
    const totalOrders = data.Orders_aggregate?.aggregate?.count || 0;
    const totalReelOrders = data.reel_orders_aggregate?.aggregate?.count || 0;
    const totalRestaurantOrders =
      data.restaurant_orders_aggregate?.aggregate?.count || 0;
    const totalBusinessOrders =
      data.businessProductOrders_aggregate?.aggregate?.count || 0;
    const totalCount =
      totalOrders +
      totalReelOrders +
      totalRestaurantOrders +
      totalBusinessOrders;

    // If no orders of any type, return empty array
    if (
      (!orders || orders.length === 0) &&
      reelOrders.length === 0 &&
      restaurantOrders.length === 0 &&
      businessOrders.length === 0
    ) {
      console.log("📭 No orders found for this user");
      return res.status(200).json({ orders: [] });
    }

    // Collect all shop IDs from regular orders and reel orders (via reel.Shops)
    const regularShopIds = orders.map((o) => o.shop_id);
    const reelShopIds = reelOrders
      .map((r) => r.reel?.Shops?.id)
      .filter(Boolean) as string[];
    // restaurant orders use Restaurant as the "shop-like" entity but we don't
    // join them through Shops; we'll embed restaurant data directly below
    const shopIds = Array.from(
      new Set([...regularShopIds, ...reelShopIds])
    ).filter(Boolean);

    // Fetch shop data if we have any shop IDs
    const shopsData = shopIds.length
      ? await hasuraClient.request<{
          Shops: Array<{
            id: string;
            name: string;
            address: string;
            image: string;
            logo: string;
            category_id: string;
          }>;
        }>(GET_SHOPS_BY_IDS, { ids: shopIds })
      : { Shops: [] };

    const shopMap = new Map(shopsData.Shops.map((s) => [s.id, s]));

    // Enrich regular orders with shop details and item counts
    const regularEnriched = orders.map((o) => {
      const agg = o.Order_Items_aggregate.aggregate;
      const itemsCount = agg?.count ?? 0;
      const unitsCount = agg?.sum?.quantity ?? 0;
      // Compute grand total including fees
      const baseTotal = parseFloat(o.total || "0");
      const serviceFee = parseFloat(o.service_fee || "0");
      const deliveryFee = parseFloat(o.delivery_fee || "0");
      const grandTotal = baseTotal + serviceFee + deliveryFee;
      return {
        orderType: "regular" as const,
        id: o.id,
        OrderID: o.OrderID,
        user_id: o.user_id,
        status: o.status,
        created_at: o.created_at,
        delivery_time: o.delivery_time,
        pin: o.pin,
        combined_order_id: o.combined_order_id,
        total: grandTotal,
        shop_id: o.shop_id,
        shopper_id: o.shopper_id,
        shop: shopMap.get(o.shop_id) || null,
        itemsCount,
        unitsCount,
      };
    });
    // Enrich reel orders into same shape
    const reelEnriched = reelOrders.map((r) => {
      const baseTotal = parseFloat(r.total || "0");
      const serviceFee = parseFloat(r.service_fee || "0");
      const deliveryFee = parseFloat(r.delivery_fee || "0");
      const grandTotal = baseTotal + serviceFee + deliveryFee;

      const reelShopId = r.reel?.Shops?.id || r.reel?.shop_id || "";
      const reelShop =
        (reelShopId && shopMap.get(reelShopId)) ||
        (r.reel?.Shops
          ? {
              id: r.reel.Shops.id,
              name: r.reel.Shops.name,
              address: r.reel.Shops.address,
              image: r.reel.Shops.image,
              logo: r.reel.Shops.logo,
              category_id: "",
            }
          : null);

      return {
        orderType: "reel" as const,
        id: r.id,
        OrderID: r.OrderID,
        user_id: r.user_id,
        status: r.status,
        created_at: r.created_at,
        delivery_time: r.delivery_time,
        pin:
          r.pin != null && String(r.pin).trim() !== ""
            ? String(r.pin)
            : r.OrderID != null
            ? String(r.OrderID).padStart(4, "0").slice(-4)
            : r.id
            ? r.id.slice(0, 4).toUpperCase()
            : "",
        combined_order_id: r.combined_order_id,
        total: grandTotal,
        shop_id: reelShopId,
        shopper_id: null,
        shop: reelShop,
        itemsCount: 1,
        unitsCount: parseInt(r.quantity || "0", 10) || 0,
        reel: r.reel
          ? {
              id: r.reel.id,
              title: r.reel.title,
              description: r.reel.description,
              Price: r.reel.Price,
              Product: r.reel.Product,
              type: r.reel.type,
              video_url: r.reel.video_url,
            }
          : null,
        quantity: parseInt(r.quantity || "0", 10) || 0,
        discount: r.discount ? parseFloat(r.discount) : 0,
        voucher_code: r.voucher_code,
      };
    });

    // Enrich restaurant orders into same shape
    const restaurantEnriched = restaurantOrders.map((ro) => {
      const baseTotal = parseFloat(ro.total || "0");
      const deliveryFee = parseFloat(ro.delivery_fee || "0");
      const grandTotal = baseTotal + deliveryFee;
      const itemsCount =
        ro.restaurant_order_items_aggregate?.aggregate?.count ?? 0;

      return {
        orderType: "restaurant" as const,
        id: ro.id,
        OrderID: ro.OrderID || ro.id,
        user_id: ro.user_id,
        status: ro.status,
        created_at: ro.created_at,
        delivery_time: ro.delivery_time,
        pin: ro.pin ?? "",
        combined_order_id: ro.combined_order_id,
        total: grandTotal,
        shop_id: ro.restaurant_id,
        shopper_id: null,
        // Map restaurant to a "shop-like" object so UI can render logo & name
        shop: ro.Restaurant
          ? {
              id: ro.Restaurant.id,
              name: ro.Restaurant.name,
              address: ro.Restaurant.location,
              image: "",
              logo: ro.Restaurant.logo || "",
              category_id: "",
            }
          : null,
        itemsCount: itemsCount || 1,
        unitsCount: itemsCount,
        reel: null,
        quantity: itemsCount,
        discount: 0,
        voucher_code: null,
      };
    });

    // Enrich business (store) orders into same shape for CurrentPendingOrders
    const businessEnriched = businessOrders.map((bo) => {
      const baseTotal = parseFloat(bo.total || "0");
      const transportFee = parseFloat(bo.transportation_fee || "0");
      const serviceFee = parseFloat(bo.service_fee || "0");
      const grandTotal = baseTotal + transportFee + serviceFee;
      const products = Array.isArray(bo.allProducts) ? bo.allProducts : [];
      const itemsCount = products.length;
      const unitsCount = products.reduce(
        (sum: number, p: any) => sum + (parseInt(p.quantity, 10) || 0),
        0
      );
      const status =
        (bo.status || "").toLowerCase() === "delivered"
          ? "delivered"
          : bo.status || "Pending";
      const bs = bo.business_store;
      return {
        orderType: "business" as const,
        id: bo.id,
        OrderID: bo.id.substring(0, 8).toUpperCase(),
        user_id: null,
        status,
        created_at: bo.created_at,
        delivery_time: bo.delivered_time || bo.created_at,
        pin: bo.pin != null ? String(bo.pin) : "",
        combined_order_id: null,
        total: grandTotal,
        shop_id: bo.store_id,
        shopper_id: null,
        shop: bs
          ? {
              id: bs.id,
              name: bs.name,
              address: "",
              image: bs.image || "",
              logo: (bs as any).logo || "",
              category_id: "",
            }
          : null,
        itemsCount: itemsCount || 1,
        unitsCount: unitsCount || 0,
        reel: null,
        quantity: unitsCount,
        discount: 0,
        voucher_code: null,
      };
    });

    // Merge and sort all orders by created_at (newest first)
    let allEnriched = [
      ...regularEnriched,
      ...reelEnriched,
      ...restaurantEnriched,
      ...businessEnriched,
    ].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // For sidebar/badge: return minimal payload to stay under 4MB and respond quickly
    const ordersToSend = minimal
      ? (allEnriched as any[]).map((o: any) => ({
          id: o.id,
          OrderID: o.OrderID,
          status: o.status,
          created_at: o.created_at,
          orderType: o.orderType,
          total: o.total,
          itemsCount: o.itemsCount ?? 0,
          unitsCount: o.unitsCount ?? 0,
          shop: o.shop ? { id: o.shop.id, name: o.shop.name } : null,
        }))
      : allEnriched;

    // Calculate pagination metadata
    const currentPageCount = ordersToSend.length;
    const hasMore =
      orders.length === limit ||
      reelOrders.length === limit ||
      restaurantOrders.length === limit ||
      businessOrders.length === limit;

    res.status(200).json({
      orders: ordersToSend,
      pagination: {
        page,
        limit,
        offset,
        totalCount,
        totalOrders,
        totalReelOrders,
        totalRestaurantOrders,
        totalBusinessOrders,
        currentPageCount,
        hasMore,
      },
    });
  } catch (error) {
    logger.error("Error fetching user orders", "UserOrdersAPI", error);
    res.status(500).json({ error: "Failed to fetch user orders" });
  }
}
