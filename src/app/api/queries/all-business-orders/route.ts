import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { hasuraClient } from "@/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_ALL_BUSINESS_ORDERS = gql`
  query GetAllBusinessProductOrders {
    businessProductOrders(order_by: { created_at: desc }) {
      id
      OrderID
      allProducts
      combined_order_id
      comment
      created_at
      delivered_time
      deliveryAddress
      delivery_proof
      latitude
      longitude
      ordered_by
      pin
      service_fee
      shopper_id
      status
      store_id
      timeRange
      total
      transportation_fee
      units
      orderedBy {
        id
        name
        email
        phone
      }
      business_store {
        id
        name
        address
        description
        image
      }
      shopper {
        id
        name
        phone
        email
      }
    }
  }
`;

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const data = await hasuraClient.request<{
      businessProductOrders: Array<{
        id: string;
        OrderID: string | null;
        allProducts: any;
        total: string;
        transportation_fee: string;
        service_fee: string;
        units: string;
        status: string | null;
        shopper_id: string | null;
        created_at: string;
        ordered_by: string;
        orderedBy: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string;
        } | null;
        business_store: {
          id?: string;
          name?: string;
          address?: string;
          description?: string | null;
          image?: string | null;
        } | null;
        shopper: {
          id: string;
          name?: string;
          phone?: string;
          email?: string;
        } | null;
      }>;
    }>(GET_ALL_BUSINESS_ORDERS);

    const orders = (data.businessProductOrders || []).map((o) => ({
      id: o.id,
      OrderID: o.OrderID ?? o.id,
      type: "business" as const,
      status: o.status ?? "PENDING",
      total: o.total,
      created_at: o.created_at,
      updated_at: o.created_at,
      ordered_by: o.ordered_by,
      orderedBy: o.orderedBy,
      allProducts: o.allProducts,
      units: o.units,
      business_store: o.business_store,
      shopper_id: o.shopper_id,
      shopper: o.shopper
        ? {
            id: o.shopper.id,
            name: o.shopper.name ?? "",
            phone: o.shopper.phone ?? "",
            email: o.shopper.email ?? "",
          }
        : undefined,
    }));

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching business orders", error);
    return NextResponse.json(
      { error: "Failed to fetch business orders" },
      { status: 500 }
    );
  }
}
