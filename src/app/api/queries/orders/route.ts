import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { hasuraClient } from "@/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_ORDERS = gql`
  query GetOrders($user_id: uuid!) {
    Orders(
      where: { user_id: { _eq: $user_id } }
      order_by: { created_at: desc }
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

const GET_SHOPS_BY_IDS = gql`
  query GetShopsByIds($ids: [uuid!]!) {
    Shops(where: { id: { _in: $ids } }) {
      id
      name
      address
      image
    }
  }
`;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json(
        { error: "Missing user ID in session" },
        { status: 400 }
      );
    }

    const data = await hasuraClient.request<{
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
        Order_Items_aggregate: {
          aggregate: {
            count: number;
            sum: { quantity: number | null } | null;
          } | null;
        };
      }>;
    }>(GET_ORDERS, { user_id: userId });
    const orders = data.Orders || [];

    if (orders.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    const shopIds = Array.from(new Set(orders.map((o) => o.shop_id))).filter(
      Boolean
    );

    if (shopIds.length === 0) {
      const enriched = orders.map((o) => ({
        id: o.id,
        OrderID: o.OrderID,
        user_id: o.user_id,
        status: o.status,
        created_at: o.created_at,
        delivery_time: o.delivery_time,
        total:
          parseFloat(o.total || "0") +
          parseFloat(o.service_fee || "0") +
          parseFloat(o.delivery_fee || "0"),
        shop_id: o.shop_id,
        shopper_id: o.shopper_id,
        shop: null,
        itemsCount: o.Order_Items_aggregate?.aggregate?.count ?? 0,
        unitsCount: o.Order_Items_aggregate?.aggregate?.sum?.quantity ?? 0,
      }));
      return NextResponse.json({ orders: enriched });
    }

    const shopsData = await hasuraClient.request<{
      Shops: Array<{ id: string; name: string; address: string; image: string }>;
    }>(GET_SHOPS_BY_IDS, { ids: shopIds });
    const shopMap = new Map(shopsData.Shops.map((s) => [s.id, s]));

    const enriched = orders.map((o) => {
      const agg = o.Order_Items_aggregate?.aggregate;
      const itemsCount = agg?.count ?? 0;
      const unitsCount = agg?.sum?.quantity ?? 0;
      const baseTotal = parseFloat(o.total || "0");
      const serviceFee = parseFloat(o.service_fee || "0");
      const deliveryFee = parseFloat(o.delivery_fee || "0");
      const grandTotal = baseTotal + serviceFee + deliveryFee;
      return {
        id: o.id,
        OrderID: o.OrderID,
        user_id: o.user_id,
        status: o.status,
        created_at: o.created_at,
        delivery_time: o.delivery_time,
        total: grandTotal,
        shop_id: o.shop_id,
        shopper_id: o.shopper_id,
        shop: shopMap.get(o.shop_id) || null,
        itemsCount,
        unitsCount,
      };
    });

    return NextResponse.json({ orders: enriched });
  } catch (error) {
    console.error("Error fetching orders", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
