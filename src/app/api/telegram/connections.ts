import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

// Import connections from webhook (in production, this would be from database)
import { telegramConnections } from "./webhook";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = (await getServerSession(req, res, authOptions as any)) as {
      user?: { id?: string };
    } | null;

    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Convert Map to object for JSON response
    const connections: Record<string, string> = {};
    telegramConnections.forEach((chatId, shopperId) => {
      connections[shopperId] = chatId;
    });

    return res.status(200).json({
      success: true,
      connections,
      count: Object.keys(connections).length,
    });
  } catch (error) {
    console.error("Error fetching connections:", error);
    return res.status(500).json({
      error: "Failed to fetch connections",
    });
  }
}
