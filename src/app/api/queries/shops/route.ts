import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { hasuraClient } from "@/lib/hasuraClient";
import { gql } from "graphql-request";

// Admin dashboard: fetches all shops with category, aggregates, and recent orders.
const GET_SHOPS = gql`
  query GetShops {
    Shops(order_by: { created_at: desc }) {
      id
      name
      description
      created_at
      address
      category_id
      image
      logo
      is_active
      latitude
      longitude
      operating_hours
      updated_at
      phone
      relatedTo
      Category {
        id
        name
      }
      Products_aggregate {
        aggregate {
          count
        }
      }
      Orders_aggregate {
        aggregate {
          count
        }
      }
      Orders(order_by: { created_at: desc }, limit: 50) {
        id
        OrderID
        status
        total
        created_at
        delivery_fee
        service_fee
        updated_at
        user_id
        shop_id
        orderedBy {
          id
          name
          email
          updated_at
          role
          phone
          profile_picture
        }
        Order_Items {
          id
          quantity
          price
          created_at
          order_id
          product_id
          Product {
            ProductName {
              name
              id
              image
              barcode
              create_at
              description
              sku
            }
          }
        }
      }
    }
  }
`;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as { id?: string }).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }
    const data = await hasuraClient.request<{
      Shops: Array<{
        id: string;
        name: string;
        description?: string;
        created_at?: string;
        address?: string;
        category_id?: string;
        image?: string;
        logo?: string | null;
        is_active?: boolean;
        latitude?: string;
        longitude?: string;
        operating_hours?: unknown;
        updated_at?: string;
        Category?: { id: string; name: string } | null;
        Products_aggregate?: { aggregate: { count: number } };
        Orders_aggregate?: { aggregate: { count: number } };
        Orders?: Array<{
          id: string;
          OrderID: string;
          status: string;
          total: string;
          created_at: string;
          delivery_fee: string;
          service_fee: string;
          orderedBy?: { id: string; name: string; email: string } | null;
          Order_Items?: Array<{
            id: string;
            quantity: number;
            price: string;
            Product?: { ProductName?: { name: string } | null } | null;
          }>;
        }>;
      }>;
    }>(GET_SHOPS);

    // Normalize for frontend: orderedBy -> User, Category -> category (component expects order.User)
    const shops = (data.Shops || []).map((shop) => ({
      ...shop,
      category: shop.Category ?? null,
      Products_aggregate: shop.Products_aggregate ?? { aggregate: { count: 0 } },
      Orders_aggregate: shop.Orders_aggregate ?? { aggregate: { count: 0 } },
      Orders: (shop.Orders ?? []).map((order) => ({
        ...order,
        User: order.orderedBy ?? null,
        Order_Items: (order.Order_Items ?? []).map((item) => ({
          ...item,
          Product: item.Product
            ? {
                name: item.Product?.ProductName?.name ?? undefined,
                ProductName: item.Product?.ProductName ?? undefined,
              }
            : undefined,
        })),
      })),
    }));

    return NextResponse.json({ shops });
  } catch (error) {
    console.error("Error fetching shops:", error);
    return NextResponse.json(
      { error: "Failed to fetch shops" },
      { status: 500 }
    );
  }
}
