import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { processWalletOperation } from "../../../src/lib/walletOperations";
import { logErrorToSlack } from "../../../src/lib/slackErrorReporter";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Authenticate the shopper
  const session = await getServerSession(req, res, authOptions as any);
  const userId = (session as any)?.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const {
    orderId,
    operation,
    isReelOrder = false,
    isRestaurantOrder = false,
    isBusinessOrder = false,
  } = req.body;

  if (!orderId || !operation) {
    return res
      .status(400)
      .json({ error: "Missing required fields: orderId and operation" });
  }

  // Validate operation type
  const validOperations = ["shopping", "delivered", "cancelled"];
  if (!validOperations.includes(operation)) {
    return res.status(400).json({ error: "Invalid operation type" });
  }

  try {
    const result = await processWalletOperation(
      userId,
      orderId,
      operation,
      isReelOrder,
      isRestaurantOrder,
      isBusinessOrder,
      req
    );

    return res.status(200).json({
      success: true,
      operation,
      orderId,
      ...result,
    });
  } catch (error) {
    await logErrorToSlack("shopper/walletOperations", error, {
      orderId,
      operation,
      isReelOrder,
      isRestaurantOrder,
      isBusinessOrder,
    });
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to process wallet operation",
    });
  }
}
