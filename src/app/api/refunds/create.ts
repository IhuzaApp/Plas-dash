import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { gql } from "graphql-request";
import { hasuraClient } from "../../../src/lib/hasuraClient";

// GraphQL mutation to create refund record
const CREATE_REFUND = gql`
  mutation CreateRefund($refund: Refunds_insert_input!) {
    insert_Refunds_one(object: $refund) {
      id
      amount
      order_id
      status
      reason
      generated_by
      created_at
    }
  }
`;

// GraphQL query to get order details and items
const GET_ORDER_DETAILS = gql`
  query GetOrderDetailsForRefund($order_id: uuid!) {
    Orders_by_pk(id: $order_id) {
      id
      OrderID
      user_id
      shopper_id
      total
      Shop {
        id
        name
      }
      Order_Items {
        id
        product_id
        quantity
        price
        found
        foundQuantity
        Product {
          name
        }
      }
    }
  }
`;

// Interface for refund response
interface RefundResponse {
  insert_Refunds_one: {
    id: string;
    amount: string;
    order_id: string;
    status: string;
    reason: string;
    generated_by: string;
    created_at: string;
  };
}

// Interface for order details response
interface OrderDetailsResponse {
  Orders_by_pk: {
    id: string;
    OrderID: string;
    user_id: string;
    shopper_id: string;
    total: string;
    Shop: {
      id: string;
      name: string;
    };
    Order_Items: Array<{
      id: string;
      product_id: string;
      quantity: number;
      price: string;
      found: boolean;
      foundQuantity?: number;
      Product: {
        name: string;
      };
    }>;
  } | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get request data
    const { orderId, refundAmount, reason } = req.body;

    // Validate required fields
    if (!orderId || refundAmount === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Format refund amount to ensure consistent handling
    const formattedRefundAmount = parseFloat(Number(refundAmount).toFixed(2));

    if (formattedRefundAmount <= 0) {
      return res
        .status(400)
        .json({ error: "Refund amount must be greater than 0" });
    }

    console.log(
      `Creating refund record for order ${orderId}, amount: ${formattedRefundAmount}`
    );

    // If no custom reason is provided, get order details to generate a detailed reason
    let detailedReason = reason;
    let userId = null;

    if (!detailedReason && hasuraClient) {
      // Get order details to create a detailed refund reason
      const orderResponse = await hasuraClient.request<OrderDetailsResponse>(
        GET_ORDER_DETAILS,
        {
          order_id: orderId,
        }
      );

      const order = orderResponse.Orders_by_pk;

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      userId = order.user_id;

      // Get shop name
      const shopName = order.Shop?.name || "Unknown Shop";

      // Get information about found and not found items
      const foundItems = order.Order_Items.filter((item) => item.found);
      const notFoundItems = order.Order_Items.filter((item) => !item.found);

      // Calculate original total
      const originalTotal = parseFloat(order.total);

      // Create detailed reason with found/not found items
      detailedReason = `Refund for items not found during shopping at ${shopName}. `;

      if (foundItems.length > 0) {
        detailedReason += `Found items: ${foundItems
          .map(
            (item) =>
              `${item.Product.ProductName?.name || "Unknown Product"} (${
                item.foundQuantity || item.quantity
              })`
          )
          .join(", ")}. `;
      }

      if (notFoundItems.length > 0) {
        detailedReason += `Not found items: ${notFoundItems
          .map(
            (item) =>
              `${item.Product.ProductName?.name || "Unknown Product"} (${
                item.quantity
              })`
          )
          .join(", ")}.`;
      }

      detailedReason += ` Original total: ${originalTotal}, found items total: ${
        originalTotal - formattedRefundAmount
      }.`;
    }

    // Check if hasuraClient is available
    if (!hasuraClient) {
      return res.status(500).json({ error: "Database client not available" });
    }

    // Create refund record
    const refundRecord = {
      order_id: orderId,
      amount: formattedRefundAmount.toString(),
      status: "pending",
      reason: detailedReason || "Refund for items not found during shopping",
      generated_by: "System",
      user_id: userId,
      paid: false,
    };

    const response = await hasuraClient.request<RefundResponse>(CREATE_REFUND, {
      refund: refundRecord,
    });

    return res.status(201).json({
      success: true,
      message: "Refund record created successfully",
      refund: response.insert_Refunds_one,
    });
  } catch (error) {
    console.error("Error creating refund record:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
