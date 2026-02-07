import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import {
  setShopperLocation,
  ShopperLocation,
} from "../../../src/lib/redisClient";

// ============================================================================
// LOCATION HEARTBEAT API
// ============================================================================
// Purpose: Store shopper's real-time location in Redis
// - Called every 10-15 seconds when shopper is "Go-Live"
// - TTL: 45 seconds (if not refreshed, shopper is offline)
// - Used by dispatch system for distance gating
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify authentication
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { userId, lat, lng, accuracy } = req.body;

    // Validation
    if (!userId || lat === undefined || lng === undefined) {
      return res.status(400).json({
        error: "Missing required fields: userId, lat, lng",
      });
    }

    // Security check: user can only update their own location
    if (userId !== session.user.id) {
      return res.status(403).json({
        error: "You can only update your own location",
      });
    }

    // Validate coordinates
    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return res.status(400).json({
        error: "Invalid coordinates",
      });
    }

    // Store in Redis with TTL
    const location: ShopperLocation = {
      lat,
      lng,
      accuracy: accuracy || undefined,
      updatedAt: Date.now(),
    };

    const success = await setShopperLocation(userId, location);

    if (!success) {
      // Redis unavailable - not critical, system can still work
      console.warn("⚠️ Failed to store location in Redis");
      return res.status(200).json({
        success: true,
        message: "Location received (Redis unavailable, degraded mode)",
        storedInRedis: false,
      });
    }

    console.log(`📍 Location updated for shopper ${userId}: (${lat}, ${lng})`);

    return res.status(200).json({
      success: true,
      message: "Location updated successfully",
      storedInRedis: true,
      ttl: 45, // seconds
    });
  } catch (error) {
    console.error("Error in location heartbeat:", error);
    return res.status(500).json({
      error: "Failed to update location",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
