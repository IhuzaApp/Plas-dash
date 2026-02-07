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

// GraphQL query to fetch month's completed delivery earnings
const GET_MONTH_COMPLETED_EARNINGS = gql`
  query GetMonthCompletedEarnings(
    $shopper_id: uuid!
    $month_start: timestamptz!
    $month_end: timestamptz!
  ) {
    Orders(
      where: {
        shopper_id: { _eq: $shopper_id }
        status: { _eq: "delivered" }
        updated_at: { _gte: $month_start, _lte: $month_end }
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

    // Calculate this month's date range in UTC
    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
    );
    const monthEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)
    );

    // Fetch orders for this month
    const data = await hasuraClient.request<GraphQLResponse>(
      GET_MONTH_COMPLETED_EARNINGS,
      {
        shopper_id: userId,
        month_start: monthStart.toISOString(),
        month_end: monthEnd.toISOString(),
      }
    );

    console.log(`🔍 Month query for user ${userId}:`, {
      monthStart: monthStart.toISOString(),
      monthEnd: monthEnd.toISOString(),
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

    // Group orders by week
    const weeklyData: Record<string, { count: number; earnings: number }> = {};
    completedOrders.forEach((order) => {
      const orderDate = new Date(order.completed_at);
      const weekStart = new Date(orderDate);
      weekStart.setDate(orderDate.getDate() - orderDate.getDay() + 1); // Monday
      const weekKey = `Week ${Math.ceil(
        (orderDate.getDate() + orderDate.getDay()) / 7
      )}`;

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { count: 0, earnings: 0 };
      }
      weeklyData[weekKey].count++;
      weeklyData[weekKey].earnings += order.earnings;
    });

    return res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        orderCount: completedOrders.length,
        orders: completedOrders,
        weeklyData,
        monthStart: monthStart.toISOString(),
        monthEnd: monthEnd.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching month's completed earnings:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch month's completed earnings",
    });
  }
}
