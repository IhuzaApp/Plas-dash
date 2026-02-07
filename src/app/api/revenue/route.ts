import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { hasuraClient } from "@/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_REVENUE = gql`
  query GetRevenue {
    Revenue {
      type
      shopper_id
      shop_id
      products
      order_id
      id
      created_at
      commission_percentage
      amount
      Order {
        total
      }
      businessProductOrders {
        total
      }
      reel_orders {
        total
      }
      restaurant_orders {
        total
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

    const data = await hasuraClient.request<{ Revenue: any[] }>(GET_REVENUE);

    const revenueData = (data.Revenue || []).map((rev: any) => {
      const orderTotal = rev.Order?.total
        ? parseFloat(rev.Order.total)
        : rev.businessProductOrders?.total
          ? parseFloat(String(rev.businessProductOrders.total))
          : rev.reel_orders?.total
            ? parseFloat(String(rev.reel_orders.total))
            : rev.restaurant_orders?.total
              ? parseFloat(String(rev.restaurant_orders.total))
              : 0;
      const amountNum = parseFloat(rev.amount || "0");
      const calculated_commission_percentage =
        orderTotal > 0 ? ((amountNum / orderTotal) * 100).toFixed(2) : "0.00";
      return {
        ...rev,
        calculated_commission_percentage,
      };
    });

    return NextResponse.json(revenueData);
  } catch (err: any) {
    console.error("Revenue fetch error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch revenue data" },
      { status: 500 }
    );
  }
}
