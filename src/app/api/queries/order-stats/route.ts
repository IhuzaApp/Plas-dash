import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { hasuraClient } from "@/lib/hasuraClient";
import { gql } from "graphql-request";

// Admin dashboard: platform-wide order counts (all Orders, reel_orders, restaurant_orders, businessProductOrders).
const GET_ORDER_STATS = gql`
  query GetOrderStats($month_start: timestamptz!) {
    # Regular orders (all)
    Orders_aggregate {
      aggregate {
        count
      }
    }
    Orders_monthly: Orders_aggregate(where: { created_at: { _gte: $month_start } }) {
      aggregate {
        count
      }
    }
    Orders_pending: Orders_aggregate(where: { status: { _neq: "delivered" } }) {
      aggregate {
        count
      }
    }

    reel_orders_aggregate {
      aggregate {
        count
      }
    }
    reel_orders_monthly: reel_orders_aggregate(
      where: { created_at: { _gte: $month_start } }
    ) {
      aggregate {
        count
      }
    }
    reel_orders_pending: reel_orders_aggregate(
      where: { status: { _neq: "delivered" } }
    ) {
      aggregate {
        count
      }
    }

    restaurant_orders_aggregate {
      aggregate {
        count
      }
    }
    restaurant_orders_monthly: restaurant_orders_aggregate(
      where: { created_at: { _gte: $month_start } }
    ) {
      aggregate {
        count
      }
    }
    restaurant_orders_pending: restaurant_orders_aggregate(
      where: { status: { _neq: "delivered" } }
    ) {
      aggregate {
        count
      }
    }

    businessProductOrders_aggregate {
      aggregate {
        count
      }
    }
    businessProductOrders_monthly: businessProductOrders_aggregate(
      where: { created_at: { _gte: $month_start } }
    ) {
      aggregate {
        count
      }
    }
    businessProductOrders_pending: businessProductOrders_aggregate(
      where: { status: { _neq: "delivered" } }
    ) {
      aggregate {
        count
      }
    }
  }
`;

function getMonthStart(): string {
  const now = new Date();
  now.setDate(1);
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const month_start = getMonthStart();
    const data = await hasuraClient.request<{
      Orders_aggregate: { aggregate: { count: number } };
      Orders_monthly: { aggregate: { count: number } };
      Orders_pending: { aggregate: { count: number } };
      reel_orders_aggregate: { aggregate: { count: number } };
      reel_orders_monthly: { aggregate: { count: number } };
      reel_orders_pending: { aggregate: { count: number } };
      restaurant_orders_aggregate: { aggregate: { count: number } };
      restaurant_orders_monthly: { aggregate: { count: number } };
      restaurant_orders_pending: { aggregate: { count: number } };
      businessProductOrders_aggregate: { aggregate: { count: number } };
      businessProductOrders_monthly: { aggregate: { count: number } };
      businessProductOrders_pending: { aggregate: { count: number } };
    }>(GET_ORDER_STATS, { month_start });

    const totalOrders =
      (data.Orders_aggregate?.aggregate?.count ?? 0) +
      (data.reel_orders_aggregate?.aggregate?.count ?? 0) +
      (data.restaurant_orders_aggregate?.aggregate?.count ?? 0) +
      (data.businessProductOrders_aggregate?.aggregate?.count ?? 0);

    const monthlyOrders =
      (data.Orders_monthly?.aggregate?.count ?? 0) +
      (data.reel_orders_monthly?.aggregate?.count ?? 0) +
      (data.restaurant_orders_monthly?.aggregate?.count ?? 0) +
      (data.businessProductOrders_monthly?.aggregate?.count ?? 0);

    const pendingOrders =
      (data.Orders_pending?.aggregate?.count ?? 0) +
      (data.reel_orders_pending?.aggregate?.count ?? 0) +
      (data.restaurant_orders_pending?.aggregate?.count ?? 0) +
      (data.businessProductOrders_pending?.aggregate?.count ?? 0);

    return NextResponse.json({
      totalOrders,
      monthlyOrders,
      pendingOrders,
      breakdown: {
        regular:
          data.Orders_aggregate?.aggregate?.count ?? 0,
        reel: data.reel_orders_aggregate?.aggregate?.count ?? 0,
        restaurant: data.restaurant_orders_aggregate?.aggregate?.count ?? 0,
        business: data.businessProductOrders_aggregate?.aggregate?.count ?? 0,
      },
      monthlyBreakdown: {
        regular: data.Orders_monthly?.aggregate?.count ?? 0,
        reel: data.reel_orders_monthly?.aggregate?.count ?? 0,
        restaurant: data.restaurant_orders_monthly?.aggregate?.count ?? 0,
        business: data.businessProductOrders_monthly?.aggregate?.count ?? 0,
      },
    });
  } catch (error) {
    console.error("Error fetching order stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch order stats" },
      { status: 500 }
    );
  }
}
