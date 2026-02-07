import type { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

// GraphQL query to get all orders (regardless of status or shopper)
const GET_ALL_ORDERS = gql`
  query GetAllOrders {
    Orders {
      id
      created_at
      status
    }
  }
`;

interface Order {
  id: string;
  created_at: string;
  status: string;
}

interface GraphQLResponse {
  Orders: Order[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const data = await hasuraClient.request<GraphQLResponse>(GET_ALL_ORDERS);
    const orders = data.Orders;

    // Initialize 2D array for activity data (24 hours x 7 days)
    // Each cell will contain the count of orders created during that hour and day
    const activityData: number[][] = Array(24)
      .fill(0)
      .map(() => Array(7).fill(0));

    // Count orders by hour and day
    orders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      const hour = orderDate.getHours();
      // Convert JavaScript's 0-6 day (Sunday-Saturday) to 0-6 (Monday-Sunday)
      const day = (orderDate.getDay() + 6) % 7; // 0 is Monday, 6 is Sunday
      activityData[hour][day]++;
    });

    // Find the maximum count to normalize the data
    let maxCount = 0;
    for (let h = 0; h < 24; h++) {
      for (let d = 0; d < 7; d++) {
        maxCount = Math.max(maxCount, activityData[h][d]);
      }
    }

    // Normalize the data to scale 0-3 for heatmap intensity
    const normalizedActivityData: number[][] = activityData.map((hourData) =>
      hourData.map((count) => {
        if (count === 0) return 0;
        if (maxCount === 0) return 0;

        // Convert raw counts to intensity levels 0-3
        const intensity = Math.ceil((count / maxCount) * 3);
        return Math.min(Math.max(intensity, 0), 3); // Ensure between 0-3
      })
    );

    // Calculate summary statistics
    const totalOrders = orders.length;
    const ordersByDay = Array(7).fill(0);
    const ordersByHour = Array(24).fill(0);

    // Count orders by day and hour for summary
    orders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      const hour = orderDate.getHours();
      const day = (orderDate.getDay() + 6) % 7; // 0 is Monday, 6 is Sunday
      ordersByDay[day]++;
      ordersByHour[hour]++;
    });

    // Find busiest day and hour
    let busiestDayIndex = 0;
    let busiestHourIndex = 0;

    for (let d = 0; d < 7; d++) {
      if (ordersByDay[d] > ordersByDay[busiestDayIndex]) {
        busiestDayIndex = d;
      }
    }

    for (let h = 0; h < 24; h++) {
      if (ordersByHour[h] > ordersByHour[busiestHourIndex]) {
        busiestHourIndex = h;
      }
    }

    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    const summary = {
      totalOrders,
      busiestDay: days[busiestDayIndex],
      busiestDayCount: ordersByDay[busiestDayIndex],
      busiestHour: `${busiestHourIndex}:00`,
      busiestHourCount: ordersByHour[busiestHourIndex],
      ordersByDay,
      ordersByHour,
    };

    return res.status(200).json({
      success: true,
      activityData: normalizedActivityData,
      rawActivityData: activityData,
      summary,
    });
  } catch (error) {
    console.error("Error fetching activity heatmap data:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch activity heatmap data",
    });
  }
}
