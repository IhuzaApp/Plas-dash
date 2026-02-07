import { NextApiRequest, NextApiResponse } from "next";
import { gql } from "graphql-request";
import { hasuraClient } from "../../../src/lib/hasuraClient";

const CHECK_INVOICE_EXISTENCE_BY_ID = gql`
  query CheckInvoiceExistenceById($invoiceId: uuid!) {
    Invoices(where: { id: { _eq: $invoiceId } }, limit: 1) {
      id
      invoice_number
      status
      created_at
      order_id
      reel_order_id
    }
  }
`;

const CHECK_INVOICE_EXISTENCE_BY_ORDER = gql`
  query CheckInvoiceExistenceByOrder($orderId: uuid!) {
    Invoices(where: { order_id: { _eq: $orderId } }, limit: 1) {
      id
      invoice_number
      status
      created_at
      order_id
      reel_order_id
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    if (!hasuraClient) {
      return res
        .status(500)
        .json({ message: "Database connection not available" });
    }

    const { invoiceId, orderId } = req.query;

    let data: any;
    const client = hasuraClient; // Store reference to avoid null check issues

    // Prioritize checking by invoice ID (primary method for QR code verification)
    if (invoiceId && typeof invoiceId === "string") {
      // Check by invoice ID (primary method)
      data = await client.request(CHECK_INVOICE_EXISTENCE_BY_ID, {
        invoiceId: invoiceId,
      });
    } else if (orderId && typeof orderId === "string") {
      // If only orderId is provided, try as invoice ID first (since QR codes use invoice ID)
      // Then fallback to order ID if not found
      try {
        data = await client.request(CHECK_INVOICE_EXISTENCE_BY_ID, {
          invoiceId: orderId,
        });
        // If no result as invoice ID, try as order ID
        if (!data.Invoices || data.Invoices.length === 0) {
          data = await client.request(CHECK_INVOICE_EXISTENCE_BY_ORDER, {
            orderId: orderId,
          });
        }
      } catch (error) {
        // If invoice ID check fails, try as order ID
        data = await client.request(CHECK_INVOICE_EXISTENCE_BY_ORDER, {
          orderId: orderId,
        });
      }
    } else {
      return res
        .status(400)
        .json({ message: "Invoice ID or Order ID is required" });
    }

    const invoice =
      data.Invoices && data.Invoices.length > 0 ? data.Invoices[0] : null;

    return res.status(200).json({
      hasInvoice: !!invoice,
      invoice: invoice
        ? {
            id: invoice.id,
            invoiceNumber: invoice.invoice_number,
            status: invoice.status,
            createdAt: invoice.created_at,
          }
        : null,
    });
  } catch (error) {
    console.error("Error checking invoice existence:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
