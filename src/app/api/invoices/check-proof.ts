import type { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

// Query to check if invoice exists for an order
const CHECK_INVOICE_EXISTS = gql`
  query CheckInvoiceExists($orderId: uuid!) {
    Invoices(
      where: {
        _or: [
          { order_id: { _eq: $orderId } }
          { reel_order_id: { _eq: $orderId } }
        ]
      }
      limit: 1
    ) {
      id
      invoice_number
      created_at
      Proof
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET method
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { orderId } = req.query;

    // Validate required fields
    if (!orderId || typeof orderId !== "string") {
      return res.status(400).json({ error: "Missing or invalid orderId" });
    }

    // Check if hasuraClient is available
    if (!hasuraClient) {
      return res.status(500).json({ error: "Database client not available" });
    }

    // Query for invoice
    const result = await hasuraClient.request<{
      Invoices: Array<{
        id: string;
        invoice_number: string;
        created_at: string;
        Proof: string | null;
      }>;
    }>(CHECK_INVOICE_EXISTS, {
      orderId,
    });

    // Check if invoice exists
    const hasProof = result.Invoices && result.Invoices.length > 0;

    return res.status(200).json({
      success: true,
      hasProof,
      invoiceId: hasProof ? result.Invoices[0].id : null,
      invoiceNumber: hasProof ? result.Invoices[0].invoice_number : null,
      proofUrl: hasProof ? result.Invoices[0].Proof : null,
    });
  } catch (error) {
    console.error("Error checking invoice proof:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
