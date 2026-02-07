import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { hasuraClient } from "@/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_ALL_RESTAURANT_ORDERS = gql`
  query GetAllRestaurantOrders {
    restaurant_orders(order_by: { created_at: desc }) {
      id
      OrderID
      user_id
      status
      created_at
      updated_at
      total
      delivery_fee
      restaurant_id
      shopper_id
      delivery_time
      delivery_notes
      pin
      orderedBy {
        id
        name
        email
        phone
      }
      Address {
        street
        city
        postal_code
      }
      Restaurant {
        id
        name
        logo
        phone
      }
      restaurant_order_items_aggregate {
        aggregate {
          count
        }
      }
      restaurant_order_items {
        id
        quantity
        price
        dish_id
      }
      shopper {
        id
        name
        shopper {
          full_name
          phone_number
        }
      }
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

    const data = await hasuraClient.request<{
      restaurant_orders: Array<{
        id: string;
        OrderID: string | number | null;
        user_id: string;
        status: string;
        created_at: string;
        updated_at: string | null;
        total: string;
        delivery_fee: string;
        restaurant_id: string;
        shopper_id: string | null;
        delivery_time: string | null;
        delivery_notes: string | null;
        pin: string | null;
        orderedBy: {
          id: string;
          name: string;
          email: string;
          phone: string;
        } | null;
        Address: {
          street: string;
          city: string;
          postal_code: string;
        } | null;
        Restaurant: {
          id: string;
          name: string;
          logo: string | null;
          phone: string | null;
        } | null;
        restaurant_order_items_aggregate?: {
          aggregate: { count: number } | null;
        };
        restaurant_order_items: Array<{ id: string; quantity: number; price: string; dish_id: string }>;
        shopper: {
          id: string;
          name?: string;
          shopper?: { full_name?: string; phone_number?: string } | null;
        } | null;
      }>;
    }>(GET_ALL_RESTAURANT_ORDERS);

    const orders = (data.restaurant_orders || []).map((o) => {
      const itemsCount = o.restaurant_order_items_aggregate?.aggregate?.count ?? o.restaurant_order_items?.length ?? 0;
      const unitsCount = o.restaurant_order_items?.reduce((s, i) => s + (Number(i.quantity) || 0), 0) ?? 0;
      return {
        id: o.id,
        OrderID: o.OrderID != null ? String(o.OrderID) : o.id,
        type: "restaurant" as const,
        status: o.status,
        total: o.total,
        created_at: o.created_at,
        updated_at: o.updated_at ?? o.created_at,
        user_id: o.user_id,
        orderedBy: o.orderedBy,
        Address: o.Address,
        Restaurant: o.Restaurant,
        restaurant_order_items: o.restaurant_order_items,
        itemsCount,
        unitsCount,
        shopper_id: o.shopper_id,
        shopper:
          o.shopper != null
            ? {
                id: o.shopper.id,
                name: o.shopper.name ?? o.shopper.shopper?.full_name ?? "",
                phone: o.shopper.shopper?.phone_number ?? "",
                email: "",
              }
            : undefined,
      };
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching restaurant orders", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurant orders" },
      { status: 500 }
    );
  }
}
