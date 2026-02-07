import type { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

// Define types for the GraphQL response
interface Order {
  id: string;
  service_fee: string | null;
  delivery_fee: string | null;
  updated_at: string;
  Shop: {
    name: string;
  } | null;
}

interface GraphQLResponse {
  Orders: Order[];
}

// GraphQL query to fetch week's completed delivery earnings
const GET_WEEK_COMPLETED_EARNINGS = gql`
  query GetWeekCompletedEarnings(
    $shopper_id: uuid!
    $week_start: timestamptz!
    $week_end: timestamptz!
  ) {
    Orders(
      where: {
        shopper_id: { _eq: $shopper_id }
        status: { _eq: "delivered" }
        updated_at: { _gte: $week_start, _lte: $week_end }
      }
      order_by: { updated_at: desc }
    ) {
      id
      service_fee
      delivery_fee
      updated_at
      Shop {
        name
      }
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Calculate this week's date range (Monday to Sunday) in UTC
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Days to go back to Monday

    const weekStart = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - daysToMonday,
        0,
        0,
        0
      )
    );
    const weekEnd = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - daysToMonday + 6,
        23,
        59,
        59,
        999
      )
    );

    // Fetch orders for this week
    const data = await hasuraClient.request<GraphQLResponse>(
      GET_WEEK_COMPLETED_EARNINGS,
      {
        shopper_id: userId,
        week_start: weekStart.toISOString(),
        week_end: weekEnd.toISOString(),
      }
    );

    console.log(`🔍 Week query for user ${userId}:`, {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      ordersFound: data.Orders.length,
    });

    // Calculate net earnings after commission and get order details
    const calculateOrderNetEarnings = async (order: Order): Promise<number> => {
      const serviceFee = parseFloat(order.service_fee || "0");
      const deliveryFee = parseFloat(order.delivery_fee || "0");
      const totalEarnings = serviceFee + deliveryFee;

      // Get platform commission percentage
      try {
        const systemConfigResponse = await hasuraClient.request<{
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

        const deliveryCommissionPercentage = parseFloat(
          systemConfigResponse.System_configuratioins[0]
            ?.deliveryCommissionPercentage || "20"
        );

        // Calculate platform fee and net earnings
        const platformFee =
          (totalEarnings * deliveryCommissionPercentage) / 100;
        const netEarnings = totalEarnings - platformFee;

        return netEarnings;
      } catch (error) {
        console.error(
          "Error fetching commission percentage, using default 20%:",
          error
        );
        // Fallback: deduct 20% commission
        const platformFee = (totalEarnings * 20) / 100;
        return totalEarnings - platformFee;
      }
    };

    let totalEarnings = 0;
    const completedOrders = await Promise.all(
      data.Orders.map(async (order) => {
        const netEarnings = await calculateOrderNetEarnings(order);
        totalEarnings += netEarnings;

        return {
          id: order.id,
          shopName: order.Shop?.name || "Unknown Shop",
          earnings: netEarnings,
          completed_at: order.updated_at,
        };
      })
    );

    // Group orders by day
    const dailyData: Record<string, { count: number; earnings: number }> = {};
    completedOrders.forEach((order) => {
      const day = new Date(order.completed_at).toLocaleDateString("en-US", {
        weekday: "short",
      });
      if (!dailyData[day]) {
        dailyData[day] = { count: 0, earnings: 0 };
      }
      dailyData[day].count++;
      dailyData[day].earnings += order.earnings;
    });

    return res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        orderCount: completedOrders.length,
        orders: completedOrders,
        dailyData,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching week's completed earnings:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch week's completed earnings",
    });
  }
}
