import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { hasuraClient } from "@/lib/hasuraClient";
import { gql } from "graphql-request";

// Single shop by id – same fields as GET_SHOP_BY_ID including phone, tin, ssd, relatedTo (server-side so data is present).
const GET_SHOP_BY_ID = gql`
  query GetShopById($id: uuid!) {
    Shops_by_pk(id: $id) {
      id
      name
      description
      address
      phone
      relatedTo
      ssd
      tin
      operating_hours
      latitude
      longitude
      image
      logo
      is_active
      created_at
      updated_at
      category_id
      Category {
        id
        name
      }
      Products {
        id
        productName_id
        price
        final_price
        quantity
        measurement_unit
        supplier
        reorder_point
        is_active
        created_at
        updated_at
        ProductName {
          id
          name
          description
          barcode
          sku
          image
          create_at
        }
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
      Orders(order_by: { created_at: desc }) {
        id
        OrderID
        status
        total
        created_at
        updated_at
        delivery_fee
        service_fee
        orderedBy {
          id
          name
          email
          phone
        }
        Order_Items {
          id
          quantity
          price
          Product {
            ProductName {
              name
              image
            }
          }
        }
        Address {
          street
          city
          postal_code
        }
      }
    }
  }
`;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as { id?: string }).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Shop ID required" }, { status: 400 });
  }

  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }
    const data = await hasuraClient.request<{
      Shops_by_pk: Record<string, unknown> | null;
    }>(GET_SHOP_BY_ID, { id });
    const raw = data.Shops_by_pk;
    if (!raw) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }
    const r = raw as Record<string, unknown>;
    const shop = {
      ...raw,
      category: r.Category ?? null,
      phone: r.phone ?? null,
      tin: r.tin ?? null,
      ssd: r.ssd ?? null,
      relatedTo: r.relatedTo ?? null,
    };
    return NextResponse.json({ shop });
  } catch (error) {
    console.error("Error fetching shop by id:", error);
    return NextResponse.json(
      { error: "Failed to fetch shop" },
      { status: 500 }
    );
  }
}
