import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

interface SessionUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

interface Session {
  user: SessionUser;
  expires: string;
}

// Generate a user-friendly product/service verification ID
// Format: PB + 6 alphanumeric characters for products (e.g., PB0384BD, PB59483CF, PB7K9M2N)
// Format: SP + 6 alphanumeric characters for services (e.g., SP0384BD, SP59483CF, SP7K9M2N)
function generateQueryId(type: "product" | "service" = "product"): string {
  const prefix = type === "service" ? "SP" : "PB";
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let id = prefix;

  // Generate 6 random alphanumeric characters (numbers and uppercase letters)
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return id;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as Session | null;

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get type from request body (defaults to "product" for backward compatibility)
    const { type } = req.body || {};
    const queryType = type === "service" ? "service" : "product";

    // Generate a unique query ID for product/service verification
    // Format: PB + 6 alphanumeric characters for products (e.g., PB0384BD, PB59483CF)
    // Format: SP + 6 alphanumeric characters for services (e.g., SP0384BD, SP59483CF)
    const queryId = generateQueryId(queryType);

    return res.status(200).json({
      success: true,
      queryId,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to generate query ID",
      message: error.message,
    });
  }
}
