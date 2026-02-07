import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { generateInvoice } from "../../../src/lib/walletTransactions";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Authenticate the user
  const session = await getServerSession(req, res, authOptions as any);
  const userId = (session as any)?.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { orderId } = req.query;

  if (!orderId || typeof orderId !== "string") {
    return res.status(400).json({
      error: "Missing required parameter: orderId",
    });
  }

  try {
    // Check if the user is authorized to access this order
    const CHECK_ORDER_ACCESS = gql`
      query CheckOrderAccess($orderId: uuid!, $userId: uuid!) {
        Orders(
          where: {
            id: { _eq: $orderId }
            _or: [
              { user_id: { _eq: $userId } }
              { shopper_id: { _eq: $userId } }
            ]
          }
        ) {
          id
        }
      }
    `;

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const accessCheck = await hasuraClient.request<{
      Orders: Array<{ id: string }>;
    }>(CHECK_ORDER_ACCESS, {
      orderId,
      userId,
    });

    if (!accessCheck.Orders || accessCheck.Orders.length === 0) {
      return res.status(403).json({
        error: "You don't have permission to access this order",
      });
    }

    // Generate the invoice
    const invoiceData = await generateInvoice(orderId);

    return res.status(200).json({
      success: true,
      invoice: invoiceData,
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to generate invoice",
    });
  }
}
