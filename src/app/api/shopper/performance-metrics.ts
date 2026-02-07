import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { logger } from "../../../src/utils/logger";

// GraphQL query to get comprehensive performance data
const GET_PERFORMANCE_METRICS = gql`
  query GetPerformanceMetrics($shopperId: uuid!, $thirtyDaysAgo: timestamptz!) {
    # Get all regular orders for this shopper (including completed and assigned)
    Orders(where: { shopper_id: { _eq: $shopperId } }) {
      id
      created_at
      updated_at
      delivery_time
      status
      shopper_id
      delivery_photo_url
      Shop {
        name
        latitude
        longitude
      }
    }

    # Get all reel orders for this shopper
    reel_orders(where: { shopper_id: { _eq: $shopperId } }) {
      id
      created_at
      updated_at
      status
      shopper_id
      delivery_photo_url
      Reel {
        title
        Price
        Restaurant {
          name
          latitude
          longitude
        }
      }
    }

    # Get completed regular orders with delivery photos
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

    # Get all assigned regular orders (for acceptance rate calculation)
    AssignedOrders: Orders_aggregate(
      where: {
        shopper_id: { _eq: $shopperId }
        created_at: { _gte: $thirtyDaysAgo }
      }
    ) {
      aggregate {
        count
      }
    }

    # Get all assigned reel orders (for acceptance rate calculation)
    AssignedReelOrders: reel_orders_aggregate(
      where: {
        shopper_id: { _eq: $shopperId }
        created_at: { _gte: $thirtyDaysAgo }
      }
    ) {
      aggregate {
        count
      }
    }

    # Get ratings data (includes ratings for both regular and reel orders)
    Ratings_aggregate(where: { shopper_id: { _eq: $shopperId } }) {
      aggregate {
        avg {
          rating
          delivery_experience
          packaging_quality
          professionalism
        }
        count
      }
    }

    # Get recent performance (last 7 days) - regular orders
    RecentOrders: Orders(
      where: {
        shopper_id: { _eq: $shopperId }
        created_at: { _gte: $sevenDaysAgo }
      }
    ) {
      id
      created_at
      updated_at
      delivery_time
      status
      delivery_photo_url
    }

    # Get recent performance (last 7 days) - reel orders
    RecentReelOrders: reel_orders(
      where: {
        shopper_id: { _eq: $shopperId }
        created_at: { _gte: $sevenDaysAgo }
      }
    ) {
      id
      created_at
      updated_at
      status
      delivery_photo_url
    }
  }
`;

interface PerformanceMetrics {
  customerRating: number;
  ratingCount: number;
  onTimeDelivery: number;
  responseTime: number; // in seconds
  acceptanceRate: number;
  cancellationRate: number;
  orderAccuracy: number;
  totalOrders: number;
  completedOrders: number;
  recentPerformance: {
    last7Days: number;
    last30Days: number;
  };
  performanceScore: number;
  breakdown: {
    deliveryExperience: number;
    packagingQuality: number;
    professionalism: number;
  };
}

// Helper function to calculate delivery time performance (for regular orders only)
const calculateDeliveryTimePerformance = (orders: any[]): number => {
  const deliveredOrders = orders.filter(
    (order) =>
      order.status === "delivered" &&
      order.delivery_photo_url &&
      order.delivery_time // Regular orders have delivery_time
  );

  if (deliveredOrders.length === 0) return 100; // Default to 100% if no deliveries

  const onTimeDeliveries = deliveredOrders.filter((order) => {
    try {
      const estimatedDelivery = new Date(order.delivery_time);
      const actualDelivery = new Date(order.updated_at);

      // Consider "on time" if delivered within 15 minutes of estimated time
      const timeDifference = Math.abs(
        actualDelivery.getTime() - estimatedDelivery.getTime()
      );
      return timeDifference <= 15 * 60 * 1000; // 15 minutes in milliseconds
    } catch (error) {
      logger.error("Error calculating delivery time", "PerformanceMetrics", {
        error,
        orderId: order.id,
      });
      return false;
    }
  });

  return Math.round((onTimeDeliveries.length / deliveredOrders.length) * 100);
};

// Helper function to calculate delivery time performance for both regular and reel orders
const calculateCombinedDeliveryTimePerformance = (
  regularOrders: any[],
  reelOrders: any[]
): number => {
  // For regular orders, use delivery_time vs updated_at
  const deliveredRegularOrders = regularOrders.filter(
    (order) =>
      order.status === "delivered" &&
      order.delivery_photo_url &&
      order.delivery_time
  );

  // For reel orders, we don't have delivery_time, so we'll use a different approach
  // We'll consider them "on time" if they were delivered within a reasonable timeframe
  const deliveredReelOrders = reelOrders.filter(
    (order) => order.status === "delivered" && order.delivery_photo_url
  );

  const totalDelivered =
    deliveredRegularOrders.length + deliveredReelOrders.length;
  if (totalDelivered === 0) return 100;

  // Calculate on-time deliveries for regular orders
  const onTimeRegularDeliveries = deliveredRegularOrders.filter((order) => {
    try {
      const estimatedDelivery = new Date(order.delivery_time);
      const actualDelivery = new Date(order.updated_at);
      const timeDifference = Math.abs(
        actualDelivery.getTime() - estimatedDelivery.getTime()
      );
      return timeDifference <= 15 * 60 * 1000; // 15 minutes
    } catch (error) {
      logger.error(
        "Error calculating regular order delivery time",
        "PerformanceMetrics",
        { error, orderId: order.id }
      );
      return false;
    }
  });

  // For reel orders, assume they're on time if delivered (since we don't have delivery_time)
  // This is a simplified approach - in a real implementation, you might want to track estimated vs actual delivery times
  const onTimeReelDeliveries = deliveredReelOrders.length; // Assume all completed reel orders are "on time"

  const totalOnTime = onTimeRegularDeliveries.length + onTimeReelDeliveries;
  return Math.round((totalOnTime / totalDelivered) * 100);
};

// Helper function to calculate average response time
const calculateResponseTime = (orders: any[]): number => {
  const acceptedOrders = orders.filter(
    (order) =>
      order.shopper_id &&
      order.status !== "PENDING" &&
      order.created_at &&
      order.updated_at
  );

  if (acceptedOrders.length === 0) return 0;

  const responseTimes = acceptedOrders.map((order) => {
    try {
      const assignedTime = new Date(order.created_at);
      const acceptedTime = new Date(order.updated_at);
      return Math.max(
        0,
        (acceptedTime.getTime() - assignedTime.getTime()) / 1000
      ); // seconds
    } catch (error) {
      logger.error("Error calculating response time", "PerformanceMetrics", {
        error,
        orderId: order.id,
      });
      return 0;
    }
  });

  return Math.round(
    responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
  );
};

// Helper function to calculate cancellation rate
const calculateCancellationRate = (orders: any[]): number => {
  const assignedOrders = orders.filter((order) => order.shopper_id);
  const completedOrders = orders.filter(
    (order) => order.status === "delivered"
  );
  const cancelledOrders = assignedOrders.filter(
    (order) =>
      !["delivered", "shopping", "packing", "on_the_way"].includes(order.status)
  );

  return assignedOrders.length > 0
    ? Math.round((cancelledOrders.length / assignedOrders.length) * 100)
    : 0;
};

// Helper function to calculate overall performance score
const calculateOverallScore = (
  metrics: Partial<PerformanceMetrics>
): number => {
  const weights = {
    customerRating: 0.3, // 30%
    onTimeDelivery: 0.25, // 25%
    orderAccuracy: 0.2, // 20%
    acceptanceRate: 0.25, // 25%
  };

  const customerRatingScore =
    (metrics.customerRating || 0) * 20 * weights.customerRating;
  const onTimeDeliveryScore =
    (metrics.onTimeDelivery || 0) * weights.onTimeDelivery;
  const orderAccuracyScore =
    (metrics.orderAccuracy || 0) * weights.orderAccuracy;
  const acceptanceRateScore =
    (metrics.acceptanceRate || 0) * weights.acceptanceRate;

  const totalScore =
    customerRatingScore +
    onTimeDeliveryScore +
    orderAccuracyScore +
    acceptanceRateScore;

  console.log(
    "Performance score calculation breakdown",
    "PerformanceMetricsAPI",
    {
      customerRating: metrics.customerRating,
      customerRatingScore,
      onTimeDelivery: metrics.onTimeDelivery,
      onTimeDeliveryScore,
      orderAccuracy: metrics.orderAccuracy,
      orderAccuracyScore,
      acceptanceRate: metrics.acceptanceRate,
      acceptanceRateScore,
      totalScore,
      finalScore: Math.min(100, Math.max(0, Math.round(totalScore))),
    }
  );

  return Math.min(100, Math.max(0, Math.round(totalScore)));
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const shopperId = session.user.id;

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Calculate date ranges
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    logger.info("Fetching performance metrics", "PerformanceMetricsAPI", {
      shopperId,
      thirtyDaysAgo,
      sevenDaysAgo,
    });

    // Fetch performance data
    const data = (await hasuraClient.request(GET_PERFORMANCE_METRICS, {
      shopperId,
      thirtyDaysAgo,
      sevenDaysAgo,
    })) as any;

    const regularOrders = data.Orders || [];
    const reelOrders = data.reel_orders || [];
    const allOrders = [...regularOrders, ...reelOrders]; // Combine both types

    const ratings = data.Ratings_aggregate?.aggregate || {};

    // Combine completed orders from both regular and reel orders
    const completedRegularOrdersWithPhotos =
      data.CompletedOrdersWithPhotos?.aggregate?.count || 0;
    const completedReelOrdersWithPhotos =
      data.CompletedReelOrdersWithPhotos?.aggregate?.count || 0;
    const completedOrdersWithPhotos =
      completedRegularOrdersWithPhotos + completedReelOrdersWithPhotos;

    // Combine assigned orders from both regular and reel orders
    const assignedRegularOrders = data.AssignedOrders?.aggregate?.count || 0;
    const assignedReelOrders = data.AssignedReelOrders?.aggregate?.count || 0;
    const assignedOrders = assignedRegularOrders + assignedReelOrders;

    const recentOrders = data.RecentOrders || [];
    const recentReelOrders = data.RecentReelOrders || [];
    const allRecentOrders = [...recentOrders, ...recentReelOrders];

    // Calculate performance metrics
    const customerRating = parseFloat(ratings.avg?.rating?.toFixed(2)) || 0;
    const ratingCount = ratings.count || 0;
    const onTimeDelivery = calculateCombinedDeliveryTimePerformance(
      regularOrders,
      reelOrders
    );
    const responseTime = calculateResponseTime(allOrders);
    const cancellationRate = calculateCancellationRate(allOrders);

    // Calculate acceptance rate using completed orders with photos as "offered orders"
    const acceptanceRate =
      completedOrdersWithPhotos > 0
        ? Math.round((completedOrdersWithPhotos / assignedOrders) * 100)
        : 0;

    // Calculate order accuracy (simplified - based on completed orders vs assigned)
    const orderAccuracy =
      assignedOrders > 0
        ? Math.round((completedOrdersWithPhotos / assignedOrders) * 100)
        : 100;

    // Calculate recent performance
    const recentPerformance = {
      last7Days: allRecentOrders.filter(
        (order: any) => order.status === "delivered"
      ).length,
      last30Days: allOrders.filter((order: any) => order.status === "delivered")
        .length,
    };

    // Create performance metrics object
    const performanceMetrics: PerformanceMetrics = {
      customerRating,
      ratingCount,
      onTimeDelivery,
      responseTime,
      acceptanceRate,
      cancellationRate,
      orderAccuracy,
      totalOrders: assignedOrders,
      completedOrders: completedOrdersWithPhotos,
      recentPerformance,
      performanceScore: 0, // Will be calculated below
      breakdown: {
        deliveryExperience:
          parseFloat(ratings.avg?.delivery_experience?.toFixed(2)) || 0,
        packagingQuality:
          parseFloat(ratings.avg?.packaging_quality?.toFixed(2)) || 0,
        professionalism:
          parseFloat(ratings.avg?.professionalism?.toFixed(2)) || 0,
      },
    };

    // Calculate overall performance score
    logger.info(
      "Performance metrics before calculation",
      "PerformanceMetricsAPI",
      {
        shopperId,
        customerRating: performanceMetrics.customerRating,
        onTimeDelivery: performanceMetrics.onTimeDelivery,
        orderAccuracy: performanceMetrics.orderAccuracy,
        acceptanceRate: performanceMetrics.acceptanceRate,
      }
    );

    performanceMetrics.performanceScore =
      calculateOverallScore(performanceMetrics);

    logger.info("Performance metrics calculated", "PerformanceMetricsAPI", {
      shopperId,
      performanceScore: performanceMetrics.performanceScore,
      customerRating: performanceMetrics.customerRating,
      onTimeDelivery: performanceMetrics.onTimeDelivery,
      acceptanceRate: performanceMetrics.acceptanceRate,
      totalOrders: performanceMetrics.totalOrders,
      completedOrders: performanceMetrics.completedOrders,
    });

    return res.status(200).json({
      success: true,
      performance: performanceMetrics,
    });
  } catch (error) {
    logger.error(
      "Error fetching performance metrics",
      "PerformanceMetricsAPI",
      error
    );
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch performance metrics",
    });
  }
}
