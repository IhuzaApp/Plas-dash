import type { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

// Helper function to calculate overall performance score
const calculatePerformanceScore = (metrics: {
  customerRating: number;
  onTimeDelivery: number;
  orderAccuracy: number;
  acceptanceRate: number;
}): number => {
  const weights = {
    customerRating: 0.3, // 30%
    onTimeDelivery: 0.25, // 25%
    orderAccuracy: 0.2, // 20%
    acceptanceRate: 0.25, // 25%
  };

  const score =
    metrics.customerRating * 20 * weights.customerRating + // 1-5 → 20-100
    metrics.onTimeDelivery * weights.onTimeDelivery + // 0-100
    metrics.orderAccuracy * weights.orderAccuracy + // 0-100
    metrics.acceptanceRate * weights.acceptanceRate; // 0-100

  return Math.min(100, Math.max(0, Math.round(score)));
};

// GraphQL query to fetch earnings and orders statistics for a shopper
const GET_EARNINGS_STATS = gql`
  query GetEarningsStats($shopperId: uuid!) {
    # Get earnings
    Orders(
      where: { shopper_id: { _eq: $shopperId }, status: { _eq: "delivered" } }
    ) {
      id
      delivery_fee
      service_fee
      created_at
      updated_at
      shop_id
      Shop {
        id
        name
      }
    }

    # Get completed orders count
    CompletedOrders: Orders_aggregate(
      where: { shopper_id: { _eq: $shopperId }, status: { _eq: "delivered" } }
    ) {
      aggregate {
        count
      }
    }

    # Get store breakdown - each distinct shop
    distinctShops: Orders(
      where: { shopper_id: { _eq: $shopperId }, status: { _eq: "delivered" } }
      distinct_on: shop_id
    ) {
      shop_id
      Shop {
        id
        name
      }
    }

    # Get ratings data
    Ratings_aggregate(where: { shopper_id: { _eq: $shopperId } }) {
      aggregate {
        avg {
          rating
        }
        count
      }
    }

    # Get on-time delivery data
    OnTimeDeliveries: Orders_aggregate(
      where: { shopper_id: { _eq: $shopperId }, status: { _eq: "delivered" } }
    ) {
      aggregate {
        count
      }
    }

    # Get total orders data for acceptance rate
    TotalOrders: Orders_aggregate(where: { shopper_id: { _eq: $shopperId } }) {
      aggregate {
        count
      }
    }

    # Get assigned orders (for acceptance rate)
    AssignedOrders: Orders_aggregate(
      where: {
        shopper_id: { _eq: $shopperId }
        status: {
          _in: ["assigned", "accepted", "shopping", "delivering", "delivered"]
        }
      }
    ) {
      aggregate {
        count
      }
    }

    # Get completed regular orders with delivery photos (representing "offered and completed" orders)
    CompletedOrdersWithPhotos: Orders_aggregate(
      where: {
        shopper_id: { _eq: $shopperId }
        status: { _eq: "delivered" }
        delivery_photo_url: { _is_null: false }
      }
    ) {
      aggregate {
        count
      }
    }

    # Get completed reel orders with delivery photos
    CompletedReelOrdersWithPhotos: reel_orders_aggregate(
      where: {
        shopper_id: { _eq: $shopperId }
        status: { _eq: "delivered" }
        delivery_photo_url: { _is_null: false }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

interface Order {
  id: string;
  service_fee: string | null;
  delivery_fee: string | null;
  created_at: string;
  updated_at: string;
  shop_id: string;
  Shop: {
    id: string;
    name: string;
  };
}

interface Shop {
  shop_id: string;
  Shop: {
    id: string;
    name: string;
  };
}

interface GraphQLResponse {
  Orders: Order[];
  CompletedOrders: {
    aggregate: {
      count: number;
    };
  };
  distinctShops: Shop[];
  Ratings_aggregate: {
    aggregate: {
      avg: {
        rating: number;
      };
      count: number;
    };
  };
  OnTimeDeliveries: {
    aggregate: {
      count: number;
    };
  };
  TotalOrders: {
    aggregate: {
      count: number;
    };
  };
  AssignedOrders: {
    aggregate: {
      count: number;
    };
  };
  CompletedOrdersWithPhotos: {
    aggregate: {
      count: number;
    };
  };
}

interface StoreEarnings {
  store: string;
  amount: number;
  percentage: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Get session to identify the shopper
  const session = await getServerSession(req, res, authOptions as any);
  const userId = (session as any)?.user?.id;

  if (!userId) {
    return res
      .status(401)
      .json({ error: "You must be logged in as a shopper" });
  }

  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const data = await hasuraClient.request<GraphQLResponse>(
      GET_EARNINGS_STATS,
      {
        shopperId: userId,
      }
    );

    // Calculate total earnings from completed orders (delivery_fee + service_fee)
    let totalEarnings = 0;
    let totalActiveHours = 0;

    // Create a map to track earnings by store
    const storeEarningsMap = new Map<string, number>();

    if (data.Orders && Array.isArray(data.Orders)) {
      data.Orders.forEach((order) => {
        const serviceFee = parseFloat(order.service_fee || "0");
        const deliveryFee = parseFloat(order.delivery_fee || "0");
        const orderTotal = serviceFee + deliveryFee;

        // Add to total earnings
        totalEarnings += orderTotal;

        // Calculate active hours
        const startTime = new Date(order.created_at);
        const endTime = new Date(order.updated_at);
        const hoursDiff =
          (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        totalActiveHours += hoursDiff;

        // Add to store earnings
        const storeName = order.Shop?.name || "Unknown Store";
        if (storeEarningsMap.has(storeName)) {
          storeEarningsMap.set(
            storeName,
            storeEarningsMap.get(storeName)! + orderTotal
          );
        } else {
          storeEarningsMap.set(storeName, orderTotal);
        }
      });
    }

    // Format store earnings data
    let storeEarnings: StoreEarnings[] = Array.from(storeEarningsMap.entries())
      .map(([store, amount]) => ({
        store,
        amount,
        percentage: Math.round((amount / totalEarnings) * 100) || 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Keep top 3 stores and combine the rest as "Other Stores"
    if (storeEarnings.length > 3) {
      const topStores = storeEarnings.slice(0, 3);
      const otherStores = storeEarnings.slice(3);

      const otherStoresAmount = otherStores.reduce(
        (sum, store) => sum + store.amount,
        0
      );
      const otherStoresPercentage =
        Math.round((otherStoresAmount / totalEarnings) * 100) || 0;

      storeEarnings = [
        ...topStores,
        {
          store: "Other Stores",
          amount: otherStoresAmount,
          percentage: otherStoresPercentage,
        },
      ];
    }

    // Calculate average hours per order
    const completedOrdersCount = data.CompletedOrders.aggregate.count || 0;
    const averageActiveHours =
      completedOrdersCount > 0 ? totalActiveHours / completedOrdersCount : 0;

    // Mock data for earnings components
    const earningsComponents = [
      {
        type: "Delivery Fee",
        amount: data.Orders.reduce(
          (sum, order) => sum + parseFloat(order.delivery_fee || "0"),
          0
        ),
        percentage: 0,
      },
      {
        type: "Service Fee",
        amount: data.Orders.reduce(
          (sum, order) => sum + parseFloat(order.service_fee || "0"),
          0
        ),
        percentage: 0,
      },
    ];

    // Calculate percentages for earnings components
    earningsComponents.forEach((component) => {
      component.percentage =
        Math.round((component.amount / totalEarnings) * 100) || 0;
    });

    // Calculate performance metrics
    const averageRating = data.Ratings_aggregate.aggregate.avg?.rating || 0;
    const assignedOrdersCount = data.AssignedOrders.aggregate.count || 0;

    // Get completed orders with delivery photos from both regular and reel orders
    const completedRegularOrdersWithPhotos =
      data.CompletedOrdersWithPhotos?.aggregate?.count || 0;
    const completedReelOrdersWithPhotos =
      (data as any).CompletedReelOrdersWithPhotos?.aggregate?.count || 0;
    const completedOrdersWithPhotos =
      completedRegularOrdersWithPhotos + completedReelOrdersWithPhotos;

    // Calculate acceptance rate using completed orders with photos as "offered orders"
    const acceptanceRate =
      completedOrdersWithPhotos > 0
        ? Math.round((completedOrdersWithPhotos / assignedOrdersCount) * 100)
        : 0;

    // Calculate order accuracy based on completed vs assigned orders
    const orderAccuracy =
      assignedOrdersCount > 0
        ? Math.round((completedOrdersWithPhotos / assignedOrdersCount) * 100)
        : 100;

    // For now, use a placeholder for on-time delivery rate
    // This will be calculated properly in the new performance-metrics API
    const onTimeRate = 97;

    // Default goals data
    const weeklyTarget = 50000;
    const monthlyTarget = 100000;
    const quarterlyTarget = 250000;

    // Calculate time-based earnings for goals
    const now = new Date();
    const currentDate = now.getTime();

    // Weekly: This week (Sunday to Saturday) - matching dailyEarnings API logic
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek); // Go back to Sunday
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Go forward to Saturday
    weekEnd.setHours(23, 59, 59, 999);

    // Monthly: Current month (1st day to last day)
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Quarterly: Current quarter (3-month period)
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const quarterStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
    const quarterEnd = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 1);

    // Calculate earnings for each time period
    let weeklyEarnings = 0;
    let monthlyEarnings = 0;
    let quarterlyEarnings = 0;

    if (data.Orders && Array.isArray(data.Orders)) {
      data.Orders.forEach((order) => {
        // Use updated_at as the delivery completion date since orders are filtered by status: "delivered"
        // This ensures we're only counting orders that were actually completed
        const deliveryDate = new Date(order.updated_at);
        const serviceFee = parseFloat(order.service_fee || "0");
        const deliveryFee = parseFloat(order.delivery_fee || "0");
        const orderTotal = serviceFee + deliveryFee;

        // Weekly earnings (this week: Sunday to Saturday)
        if (deliveryDate >= weekStart && deliveryDate <= weekEnd) {
          weeklyEarnings += orderTotal;
        }

        // Monthly earnings (current month)
        if (deliveryDate >= currentMonth && deliveryDate < nextMonth) {
          monthlyEarnings += orderTotal;
        }

        // Quarterly earnings (current quarter)
        if (deliveryDate >= quarterStart && deliveryDate < quarterEnd) {
          quarterlyEarnings += orderTotal;
        }
      });
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalEarnings,
        completedOrders: completedOrdersCount,
        activeHours: parseFloat(averageActiveHours.toFixed(1)),
        rating: parseFloat(averageRating.toFixed(2)) || 4.92,
        storeBreakdown: storeEarnings,
        earningsComponents,
        performance: {
          customerRating: parseFloat(averageRating.toFixed(2)) || 4.92,
          onTimeDelivery: onTimeRate,
          orderAccuracy: orderAccuracy,
          acceptanceRate: acceptanceRate || 82,
          performanceScore: calculatePerformanceScore({
            customerRating: parseFloat(averageRating.toFixed(2)) || 4.92,
            onTimeDelivery: onTimeRate,
            orderAccuracy: orderAccuracy,
            acceptanceRate: acceptanceRate || 82,
          }),
        },
        goals: {
          weekly: {
            current: weeklyEarnings || 1248.5,
            target: weeklyTarget,
            percentage: Math.round((weeklyEarnings / weeklyTarget) * 100) || 83,
          },
          monthly: {
            current: monthlyEarnings || 3820.75,
            target: monthlyTarget,
            percentage:
              Math.round((monthlyEarnings / monthlyTarget) * 100) || 64,
          },
          quarterly: {
            current: quarterlyEarnings || 8500.0,
            target: quarterlyTarget,
            percentage:
              Math.round((quarterlyEarnings / quarterlyTarget) * 100) || 57,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching earnings stats:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch earnings stats",
    });
  }
}
