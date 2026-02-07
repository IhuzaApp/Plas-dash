import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { logErrorToSlack } from "../../../src/lib/slackErrorReporter";

// GraphQL mutation to update invoice proof
const UPDATE_INVOICE_PROOF = gql`
  mutation UpdateInvoiceProof($invoice_id: uuid!, $Proof: String!) {
    update_Invoices(
      where: { id: { _eq: $invoice_id } }
      _set: { Proof: $Proof }
    ) {
      affected_rows
    }
  }
`;

// GraphQL mutation to update reel order proof
const UPDATE_REEL_ORDER_PROOF = gql`
  mutation UpdateReelOrderProof(
    $reel_order_id: uuid!
    $delivery_photo_url: String!
  ) {
    update_reel_orders_by_pk(
      pk_columns: { id: $reel_order_id }
      _set: { delivery_photo_url: $delivery_photo_url }
    ) {
      id
      delivery_photo_url
      OrderID
    }
  }
`;

// GraphQL query to get invoice details for verification
const GET_INVOICE_DETAILS = gql`
  query GetInvoiceDetails($invoice_id: uuid!) {
    Invoices_by_pk(id: $invoice_id) {
      id
      invoice_number
      order_id
      reel_order_id
      Order {
        id
        shopper_id
      }
    }
  }
`;

// GraphQL query to get reel order details for verification
const GET_REEL_ORDER_DETAILS = gql`
  query GetReelOrderDetails($reel_order_id: uuid!) {
    reel_orders_by_pk(id: $reel_order_id) {
      id
      OrderID
      shopper_id
    }
  }
`;

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
    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { invoice_id, proof_image, order_type } = req.body;

    if (!invoice_id || !proof_image) {
      return res.status(400).json({
        error: "Missing required fields: invoice_id and proof_image",
      });
    }

    if (!hasuraClient) {
      return res.status(500).json({
        error: "Database connection not available",
      });
    }

    let result;

    if (order_type === "reel") {
      // Handle reel order proof upload
      const reelOrderId = invoice_id.replace("reel-", ""); // Remove the "reel-" prefix

      // Verify the reel order exists and belongs to the authenticated shopper
      const reelOrderData = (await hasuraClient.request(
        GET_REEL_ORDER_DETAILS,
        {
          reel_order_id: reelOrderId,
        }
      )) as any;

      if (!reelOrderData.reel_orders_by_pk) {
        return res.status(404).json({ error: "Reel order not found" });
      }

      // Check if the reel order belongs to the authenticated shopper
      if (reelOrderData.reel_orders_by_pk.shopper_id !== session.user.id) {
        return res.status(403).json({
          error: "You can only upload proof for your own reel orders",
        });
      }

      // Update the reel order with the proof image
      result = (await hasuraClient.request(UPDATE_REEL_ORDER_PROOF, {
        reel_order_id: reelOrderId,
        delivery_photo_url: proof_image,
      })) as any;

      if (!result.update_reel_orders_by_pk) {
        return res.status(500).json({
          error: "Failed to update reel order proof",
        });
      }
    } else {
      // Handle regular order invoice proof upload
      // Verify the invoice exists and belongs to the authenticated shopper
      const invoiceData = (await hasuraClient.request(GET_INVOICE_DETAILS, {
        invoice_id,
      })) as any;

      if (!invoiceData.Invoices_by_pk) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // Check if the invoice belongs to the authenticated shopper
      const shopperId = invoiceData.Invoices_by_pk.Order?.shopper_id;
      if (shopperId !== session.user.id) {
        return res.status(403).json({
          error: "You can only upload proof for your own invoices",
        });
      }

      // Update the invoice with the proof image
      result = (await hasuraClient.request(UPDATE_INVOICE_PROOF, {
        invoice_id: invoiceData.Invoices_by_pk.id,
        Proof: proof_image,
      })) as any;

      if (
        !result.update_Invoices ||
        result.update_Invoices.affected_rows === 0
      ) {
        return res.status(500).json({
          error: "Failed to update invoice proof",
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Proof uploaded successfully",
      invoice:
        order_type === "reel"
          ? result.update_reel_orders_by_pk
          : { id: invoice_id },
    });
  } catch (error) {
    await logErrorToSlack("invoices/upload-proof", error, {
      invoice_id: req.body?.invoice_id,
      order_type: req.body?.order_type,
    });
    res.status(500).json({
      error: "Failed to upload proof",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
