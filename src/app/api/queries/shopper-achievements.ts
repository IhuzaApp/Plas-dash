import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]";

const GET_ACHIEVEMENT_DATA = gql`
  query GetAchievementData($shopperId: uuid!) {
    # Get all regular orders for the shopper
    Orders(where: { shopper_id: { _eq: $shopperId } }) {
      id
      created_at
      updated_at
      service_fee
      delivery_fee
      status
      delivery_photo_url
    }

    # Get all reel orders for the shopper
    reel_orders(where: { shopper_id: { _eq: $shopperId } }) {
      id
      created_at
      updated_at
      service_fee
      delivery_fee
      status
      delivery_photo_url
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
  }
`;

// Achievement thresholds
const ACHIEVEMENT_THRESHOLDS = {
  earnings: [
    { level: "bronze", target: 50000, badge: "Bronze Earner" },
    { level: "silver", target: 100000, badge: "Silver Earner" },
    { level: "gold", target: 200000, badge: "Gold Earner" },
    { level: "platinum", target: 350000, badge: "Platinum Earner" },
  ],
  orders: [
    { level: "bronze", target: 20, badge: "Order Starter" },
    { level: "silver", target: 50, badge: "Order Warrior" },
    { level: "gold", target: 100, badge: "Order Master" },
    { level: "platinum", target: 150, badge: "Order Legend" },
  ],
  ratings: [
    { level: "bronze", target: 4.0, badge: "Quality Shopper" },
    { level: "silver", target: 4.5, badge: "Excellent Service" },
    { level: "gold", target: 4.8, badge: "Perfect Rating" },
    { level: "platinum", target: 5.0, badge: "Rating Champion" },
  ],
};

// Helper function to calculate monthly earnings
const calculateMonthlyEarnings = (
  regularOrders: any[],
  reelOrders: any[]
): number => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const monthlyRegularEarnings = regularOrders
    .filter((order) => new Date(order.created_at) >= thirtyDaysAgo)
    .reduce((total, order) => {
      return (
        total +
        parseFloat(order.service_fee || "0") +
        parseFloat(order.delivery_fee || "0")
      );
    }, 0);

  const monthlyReelEarnings = reelOrders
    .filter((order) => new Date(order.created_at) >= thirtyDaysAgo)
    .reduce((total, order) => {
      return (
        total +
        parseFloat(order.service_fee || "0") +
        parseFloat(order.delivery_fee || "0")
      );
    }, 0);

  return monthlyRegularEarnings + monthlyReelEarnings;
};

// Helper function to calculate monthly order count
const calculateMonthlyOrderCount = (
  regularOrders: any[],
  reelOrders: any[]
): number => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const monthlyRegularCount = regularOrders.filter(
    (order) =>
      new Date(order.created_at) >= thirtyDaysAgo &&
      order.status === "delivered"
  ).length;

  const monthlyReelCount = reelOrders.filter(
    (order) =>
      new Date(order.created_at) >= thirtyDaysAgo &&
      order.status === "delivered"
  ).length;

  return monthlyRegularCount + monthlyReelCount;
};

// Helper function to check achievements
const checkAchievements = (
  monthlyEarnings: number,
  monthlyOrderCount: number,
  monthlyRating: number,
  ratingCount: number
) => {
  const achievements: any[] = [];

  // Check earning achievements
  ACHIEVEMENT_THRESHOLDS.earnings.forEach((threshold) => {
    const achieved = monthlyEarnings >= threshold.target;
    const progress = Math.min(
      100,
      Math.round((monthlyEarnings / threshold.target) * 100)
    );

    achievements.push({
      type: "earnings",
      level: threshold.level,
      badgeName: threshold.badge,
      description: `Earn RWF ${threshold.target.toLocaleString()}+ in a month`,
      achieved,
      progress,
      target: threshold.target,
      current: monthlyEarnings,
      streakCount: achieved ? 1 : 0,
    });
  });

  // Check order count achievements
  ACHIEVEMENT_THRESHOLDS.orders.forEach((threshold) => {
    const achieved = monthlyOrderCount >= threshold.target;
    const progress = Math.min(
      100,
      Math.round((monthlyOrderCount / threshold.target) * 100)
    );

    achievements.push({
      type: "orders",
      level: threshold.level,
      badgeName: threshold.badge,
      description: `Complete ${threshold.target}+ orders in a month`,
      achieved,
      progress,
      target: threshold.target,
      current: monthlyOrderCount,
      streakCount: achieved ? 1 : 0,
    });
  });

  // Check rating achievements (only if shopper has ratings)
  if (ratingCount > 0) {
    ACHIEVEMENT_THRESHOLDS.ratings.forEach((threshold) => {
      const achieved = monthlyRating >= threshold.target;
      const progress = Math.min(
        100,
        Math.round((monthlyRating / threshold.target) * 100)
      );

      achievements.push({
        type: "ratings",
        level: threshold.level,
        badgeName: threshold.badge,
        description: `Maintain ${threshold.target}+ rating in a month`,
        achieved,
        progress,
        target: threshold.target,
        current: monthlyRating,
        streakCount: achieved ? 1 : 0,
      });
    });
  }

  return achievements;
};

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

    const data = (await hasuraClient.request(GET_ACHIEVEMENT_DATA, {
      shopperId: userId,
    })) as any;

    // Calculate achievement data
    const monthlyEarnings = calculateMonthlyEarnings(
      data.Orders || [],
      data.reel_orders || []
    );
    const monthlyOrderCount = calculateMonthlyOrderCount(
      data.Orders || [],
      data.reel_orders || []
    );
    const monthlyRating =
      parseFloat(data.Ratings_aggregate.aggregate.avg?.rating?.toFixed(2)) || 0;
    const ratingCount = data.Ratings_aggregate.aggregate.count || 0;

    // Check achievements
    const achievements = checkAchievements(
      monthlyEarnings,
      monthlyOrderCount,
      monthlyRating,
      ratingCount
    );

    // Separate achieved and pending achievements
    const achievedBadges = achievements.filter((a: any) => a.achieved);
    const pendingBadges = achievements.filter((a: any) => !a.achieved);

    return res.status(200).json({
      success: true,
      achievements: {
        achieved: achievedBadges,
        pending: pendingBadges,
        summary: {
          totalAchieved: achievedBadges.length,
          totalPending: pendingBadges.length,
          monthlyEarnings,
          monthlyOrderCount,
          monthlyRating,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to fetch achievements",
    });
  }
}
