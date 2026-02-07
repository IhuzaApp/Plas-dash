import type { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { logErrorToSlack } from "../../../src/lib/slackErrorReporter";

// Fetch daily earnings for a shopper for the selected period based on delivery completion time
const GET_DAILY_EARNINGS = gql`
  query GetDailyEarnings(
    $shopper_id: uuid!
    $start_date: timestamptz!
    $end_date: timestamptz!
  ) {
    Orders(
      where: {
        shopper_id: { _eq: $shopper_id }
        status: { _eq: "delivered" }
        updated_at: { _gte: $start_date, _lte: $end_date }
      }
    ) {
      id
      service_fee
      delivery_fee
      updated_at
    }
  }
`;

// Reel orders for the same period
const GET_DAILY_REEL_EARNINGS = gql`
  query GetDailyReelEarnings(
    $shopper_id: uuid!
    $start_date: timestamptz!
    $end_date: timestamptz!
  ) {
    reel_orders(
      where: {
        shopper_id: { _eq: $shopper_id }
        status: { _eq: "delivered" }
        updated_at: { _gte: $start_date, _lte: $end_date }
      }
    ) {
      id
      service_fee
      delivery_fee
      updated_at
    }
  }
`;

// Restaurant orders for the same period
const GET_DAILY_RESTAURANT_EARNINGS = gql`
  query GetDailyRestaurantEarnings(
    $shopper_id: uuid!
    $start_date: timestamptz!
    $end_date: timestamptz!
  ) {
    restaurant_orders(
      where: {
        shopper_id: { _eq: $shopper_id }
        status: { _eq: "delivered" }
        updated_at: { _gte: $start_date, _lte: $end_date }
      }
    ) {
      id
      delivery_fee
      updated_at
    }
  }
`;

interface OrderEarningRow {
  id: string;
  service_fee?: string | null;
  delivery_fee: string | null;
  updated_at: string;
}

interface OrdersResponse {
  Orders: Array<OrderEarningRow>;
}

interface ReelOrdersResponse {
  reel_orders: Array<OrderEarningRow>;
}

interface RestaurantOrdersResponse {
  restaurant_orders: Array<{
    id: string;
    delivery_fee: string | null;
    updated_at: string;
  }>;
}

// Calculate date ranges for different periods
const getDateRange = (period: string) => {
  const now = new Date();
  const startDate = new Date();
  const endDate = new Date();

  switch (period) {
    case "today":
      // Today (00:00 to 23:59)
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;

    case "this-week":
      // This week (Sunday to Saturday)
      const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
      startDate.setDate(now.getDate() - dayOfWeek); // Go back to Sunday
      startDate.setHours(0, 0, 0, 0);

      endDate.setTime(startDate.getTime());
      endDate.setDate(startDate.getDate() + 6); // Go forward to Saturday
      endDate.setHours(23, 59, 59, 999);
      break;

    case "last-week":
      // Last week (previous Sunday to Saturday)
      const lastWeekDay = now.getDay();
      startDate.setDate(now.getDate() - lastWeekDay - 7); // Go back to previous Sunday
      startDate.setHours(0, 0, 0, 0);

      endDate.setTime(startDate.getTime());
      endDate.setDate(startDate.getDate() + 6); // Go forward to previous Saturday
      endDate.setHours(23, 59, 59, 999);
      break;

    case "this-month":
      // This month (1st day to last day)
      startDate.setDate(1); // First day of current month
      startDate.setHours(0, 0, 0, 0);

      endDate.setMonth(now.getMonth() + 1, 0); // Last day of current month
      endDate.setHours(23, 59, 59, 999);
      break;

    case "last-month":
      // Last month (1st day to last day of previous month)
      startDate.setMonth(now.getMonth() - 1, 1); // First day of previous month
      startDate.setHours(0, 0, 0, 0);

      endDate.setDate(0); // Last day of previous month
      endDate.setHours(23, 59, 59, 999);
      break;

    default:
      // Default to this week
      const defaultDayOfWeek = now.getDay();
      startDate.setDate(now.getDate() - defaultDayOfWeek);
      startDate.setHours(0, 0, 0, 0);

      endDate.setTime(startDate.getTime());
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
};

// Get platform commission percentage (fetch once per request)
const getCommissionPercentage = async (): Promise<number> => {
  try {
    const systemConfigResponse = await hasuraClient!.request<{
      System_configuratioins: Array<{
        deliveryCommissionPercentage: string;
      }>;
    }>(gql`
      query GetSystemConfiguration {
        System_configuratioins {
          deliveryCommissionPercentage
        }
      }
    `);
    return parseFloat(
      systemConfigResponse.System_configuratioins[0]
        ?.deliveryCommissionPercentage || "20"
    );
  } catch (error) {
    console.error(
      "Error fetching commission percentage, using default 20%:",
      error
    );
    return 20;
  }
};

// Apply commission to raw earnings (sync)
const applyCommission = (rawTotal: number, commissionPct: number): number => {
  const platformFee = (rawTotal * commissionPct) / 100;
  return rawTotal - platformFee;
};

// Calculate net earnings from an order row (Orders or reel_orders)
const rowToNetEarnings = (
  order: OrderEarningRow,
  commissionPct: number
): number => {
  const serviceFee = parseFloat(order.service_fee || "0");
  const deliveryFee = parseFloat(order.delivery_fee || "0");
  return applyCommission(serviceFee + deliveryFee, commissionPct);
};

// Calculate net earnings from a restaurant order (delivery_fee only)
const restaurantRowToNetEarnings = (
  order: RestaurantOrdersResponse["restaurant_orders"][0],
  commissionPct: number
): number => {
  const deliveryFee = parseFloat(order.delivery_fee || "0");
  return applyCommission(deliveryFee, commissionPct);
};

// Unified item for chart aggregation (pre-computed earnings from Orders, reel_orders, restaurant_orders)
interface EarningsItem {
  updated_at: string;
  earnings: number;
}

// Format data for different period types
const formatEarningsData = (
  items: EarningsItem[],
  period: string
): Array<{ day: string; earnings: number }> => {
  // For 'today', we show hourly data
  if (period === "today") {
    const hourlyEarningsMap = new Map<number, number>();

    // Initialize all hours with zero earnings
    for (let i = 0; i < 24; i++) {
      hourlyEarningsMap.set(i, 0);
    }

    // Aggregate earnings by hour
    for (const item of items) {
      const deliveryDate = new Date(item.updated_at);
      const hourIndex = deliveryDate.getHours();
      const currentTotal = hourlyEarningsMap.get(hourIndex) || 0;
      hourlyEarningsMap.set(hourIndex, currentTotal + item.earnings);
    }

    // Format for display - only include hours with data or important hours
    return Array.from(hourlyEarningsMap.entries())
      .filter(([hour, earnings]) => hour % 3 === 0 || earnings > 0) // Show every 3rd hour or hours with earnings
      .map(([hour, earnings]) => ({
        day: `${hour}:00`,
        earnings,
      }))
      .sort((a, b) => {
        // Sort by hour
        return parseInt(a.day) - parseInt(b.day);
      });
  }

  // For 'this-week' or 'last-week', we show daily data
  else if (period === "this-week" || period === "last-week") {
    const dailyEarningsMap = new Map<number, number>();

    // Initialize all days of the week with zero earnings
    for (let i = 0; i < 7; i++) {
      dailyEarningsMap.set(i, 0);
    }

    // Aggregate earnings by day
    for (const item of items) {
      const deliveryDate = new Date(item.updated_at);
      const dayIndex = deliveryDate.getDay(); // 0 = Sunday, 6 = Saturday
      const currentTotal = dailyEarningsMap.get(dayIndex) || 0;
      dailyEarningsMap.set(dayIndex, currentTotal + item.earnings);
    }

    // Format the data for the chart
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return Array.from(dailyEarningsMap.entries())
      .map(([dayIndex, earnings]) => ({
        day: dayNames[dayIndex],
        earnings,
      }))
      .sort((a, b) => {
        // Sort by day of week (starting from Sunday)
        return dayNames.indexOf(a.day) - dayNames.indexOf(b.day);
      });
  }

  // For 'this-month' or 'last-month', we show weekly data
  else {
    const weeklyEarningsMap = new Map<number, number>();

    // Get the first day of the month from the first item or current date
    const firstItemDate =
      items.length > 0 ? new Date(items[0].updated_at) : new Date();
    const startOfMonth = new Date(
      firstItemDate.getFullYear(),
      firstItemDate.getMonth(),
      1
    );

    // Calculate number of weeks in the month
    const lastDay = new Date(
      startOfMonth.getFullYear(),
      startOfMonth.getMonth() + 1,
      0
    ).getDate();
    const numWeeks = Math.ceil(lastDay / 7);

    // Initialize all weeks with zero earnings
    for (let i = 0; i < numWeeks; i++) {
      weeklyEarningsMap.set(i, 0);
    }

    // Aggregate earnings by week
    for (const item of items) {
      const deliveryDate = new Date(item.updated_at);
      const weekIndex = Math.floor((deliveryDate.getDate() - 1) / 7);
      const currentTotal = weeklyEarningsMap.get(weekIndex) || 0;
      weeklyEarningsMap.set(weekIndex, currentTotal + item.earnings);
    }

    // Format the data for the chart
    return Array.from(weeklyEarningsMap.entries())
      .map(([weekIndex, earnings]) => ({
        day: `Week ${weekIndex + 1}`,
        earnings,
      }))
      .sort((a, b) => {
        // Sort by week number
        const aParts = a.day.split(" ");
        const bParts = b.day.split(" ");
        const aWeek = aParts.length > 1 ? parseInt(aParts[1]) : 0;
        const bWeek = bParts.length > 1 ? parseInt(bParts[1]) : 0;
        return aWeek - bWeek;
      });
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get session to identify the shopper
    const session = await getServerSession(req, res, authOptions as any);
    const shopperId = (session as any)?.user?.id;

    if (!shopperId) {
      return res
        .status(401)
        .json({ error: "You must be logged in as a shopper" });
    }

    // Check if user has shopper role
    const userRole = (session as any)?.user?.role;
    if (userRole !== "shopper") {
      return res.status(403).json({
        error: "Access denied. This endpoint is only for shoppers.",
      });
    }

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Get period from query params or use default
    const period = (req.query.period as string) || "this-week";

    // Calculate date range based on period
    const { startDate, endDate } = getDateRange(period);

    const vars = {
      shopper_id: shopperId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    };

    // Fetch Orders, reel_orders, and restaurant_orders in parallel
    const [ordersData, reelData, restaurantData] = await Promise.all([
      hasuraClient.request<OrdersResponse>(GET_DAILY_EARNINGS, vars),
      hasuraClient.request<ReelOrdersResponse>(GET_DAILY_REEL_EARNINGS, vars),
      hasuraClient.request<RestaurantOrdersResponse>(
        GET_DAILY_RESTAURANT_EARNINGS,
        vars
      ),
    ]);

    // Get commission percentage once for all order types
    const commissionPct = await getCommissionPercentage();

    // Build unified list of { updated_at, earnings } from all order types
    const allItems: EarningsItem[] = [
      ...ordersData.Orders.map((order) => ({
        updated_at: order.updated_at,
        earnings: rowToNetEarnings(order, commissionPct),
      })),
      ...reelData.reel_orders.map((order) => ({
        updated_at: order.updated_at,
        earnings: rowToNetEarnings(order, commissionPct),
      })),
      ...restaurantData.restaurant_orders.map((order) => ({
        updated_at: order.updated_at,
        earnings: restaurantRowToNetEarnings(order, commissionPct),
      })),
    ];

    // Format data based on the selected period
    const formattedData = formatEarningsData(allItems, period);

    // Total net earnings (Orders + reel_orders + restaurant_orders, after commission)
    const totalEarnings = allItems.reduce(
      (sum, item) => sum + item.earnings,
      0
    );
    const totalOrderCount =
      ordersData.Orders.length +
      reelData.reel_orders.length +
      restaurantData.restaurant_orders.length;

    // Create a response that includes the earnings structure expected by the Sidebar
    return res.status(200).json({
      success: true,
      data: formattedData,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        type: period,
      },
      earnings: {
        active: 0,
        completed: totalEarnings,
        total: totalEarnings,
      },
      orderCounts: {
        active: 0,
        completed: totalOrderCount,
        total: totalOrderCount,
      },
    });
  } catch (error) {
    console.error("Error fetching daily earnings:", error);
    await logErrorToSlack("api/shopper/dailyEarnings", error, {
      period: (req.query.period as string) || "this-week",
    });
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch daily earnings",
    });
  }
}
