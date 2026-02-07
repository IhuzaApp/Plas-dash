import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { gql } from "graphql-request";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { formatCurrency } from "../../../src/lib/formatCurrency";

// GraphQL query to get wallet information
const GET_WALLET_BY_SHOPPER_ID = gql`
  query GetWalletByShopperId($shopper_id: uuid!) {
    Wallets(where: { shopper_id: { _eq: $shopper_id } }) {
      id
      available_balance
      reserved_balance
      shopper_id
    }
  }
`;

// GraphQL query to get order details
const GET_ORDER_DETAILS = gql`
  query GetOrderDetailsForPayment($order_id: uuid!) {
    Orders_by_pk(id: $order_id) {
      id
      OrderID
      user_id
      total
      Shop {
        id
        name
      }
      Order_Items {
        id
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

// GraphQL mutation to update wallet balances
const UPDATE_WALLET_BALANCES = gql`
  mutation UpdateWalletBalances($wallet_id: uuid!, $reserved_balance: String!) {
    update_Wallets_by_pk(
      pk_columns: { id: $wallet_id }
      _set: { reserved_balance: $reserved_balance }
    ) {
      id
      reserved_balance
    }
  }
`;

// GraphQL mutation to create wallet transactions
const CREATE_WALLET_TRANSACTIONS = gql`
  mutation createMultipleWalletTransactions(
    $transactions: [Wallet_Transactions_insert_input!]!
  ) {
    insert_Wallet_Transactions(objects: $transactions) {
      returning {
        id
        amount
        type
        status
        created_at
        wallet_id
        related_order_id
      }
      affected_rows
    }
  }
`;

// GraphQL mutation to create refund
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

// Type definition for wallet data
interface WalletData {
  Wallets: Array<{
    id: string;
    available_balance: string;
    reserved_balance: string;
    shopper_id: string;
  }>;
}

interface OrderDetailsData {
  Orders_by_pk: {
    id: string;
    OrderID: string;
    user_id: string;
    total: string;
    Shop: {
      id: string;
      name: string;
    };
    Order_Items: Array<{
      id: string;
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      shopperId,
      orderId,
      orderAmount,
      originalOrderTotal,
      momoReferenceId,
      momoSuccess,
    } = req.body;

    // Validate required fields
    if (!shopperId || !orderId || orderAmount === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify the authenticated user matches the shopperId
    if (session.user.id !== shopperId) {
      return res.status(403).json({
        error: "Not authorized to record transactions for this shopper",
      });
    }

    // Check if hasuraClient is available (it should be on server side)
    if (!hasuraClient) {
      return res.status(500).json({ error: "Database client not available" });
    }

    // Get wallet information
    const walletResponse = await hasuraClient.request<WalletData>(
      GET_WALLET_BY_SHOPPER_ID,
      {
        shopper_id: shopperId,
      }
    );

    if (!walletResponse.Wallets || walletResponse.Wallets.length === 0) {
      return res
        .status(404)
        .json({ error: "Wallet not found for this shopper" });
    }

    const wallet = walletResponse.Wallets[0];
    const walletId = wallet.id;

    // Calculate new reserved balance
    const currentReserved = parseFloat(wallet.reserved_balance);

    // Format both values to 2 decimal places to avoid floating point issues
    const formattedReservedBalance = parseFloat(currentReserved.toFixed(2));
    const formattedOrderAmount = parseFloat(orderAmount.toFixed(2));

    console.log(`Available balance: ${wallet.available_balance}`);
    console.log(
      `Reserved balance: ${formattedReservedBalance} (raw: ${currentReserved})`
    );
    console.log(`Order amount: ${formattedOrderAmount} (raw: ${orderAmount})`);
    console.log(
      `Is reserved balance sufficient: ${
        formattedReservedBalance >= formattedOrderAmount
      }`
    );

    // Check if the formatted reserved balance is less than the order amount
    if (formattedReservedBalance < formattedOrderAmount) {
      console.error(
        `Insufficient reserved balance: ${formattedReservedBalance} < ${formattedOrderAmount}`
      );
      return res.status(400).json({
        error: `Insufficient reserved balance. You have ${formatCurrency(
          formattedReservedBalance
        )} but the order requires ${formatCurrency(formattedOrderAmount)}.`,
      });
    }

    // Get order details to determine if refund is needed
    let orderData;
    let refundAmount = 0;
    let refundNeeded = false;
    let refundReason = "";

    try {
      // Get order details
      const orderResponse = await hasuraClient.request<OrderDetailsData>(
        GET_ORDER_DETAILS,
        { order_id: orderId }
      );

      orderData = orderResponse.Orders_by_pk;

      if (orderData) {
        // Check if refund is needed
        // If originalOrderTotal is provided, use it; otherwise get from orderData
        const totalOrderValue =
          originalOrderTotal || parseFloat(orderData.total);

        // Calculate if there's a difference between original total and found items total
        if (totalOrderValue > formattedOrderAmount) {
          refundAmount = parseFloat(
            (totalOrderValue - formattedOrderAmount).toFixed(2)
          );
          refundNeeded = true;

          // Get shop name
          const shopName = orderData.Shop?.name || "Unknown Shop";

          // Get information about found and not found items
          const foundItems = orderData.Order_Items.filter((item) => item.found);
          const notFoundItems = orderData.Order_Items.filter(
            (item) => !item.found
          );

          // Create detailed reason with found/not found items
          refundReason = `Refund for items not found during shopping at ${shopName}. `;

          if (foundItems.length > 0) {
            refundReason += `Found items: ${foundItems
              .map(
                (item) =>
                  `${item.Product.name} (${
                    item.foundQuantity || item.quantity
                  })`
              )
              .join(", ")}. `;
          }

          if (notFoundItems.length > 0) {
            refundReason += `Not found items: ${notFoundItems
              .map((item) => `${item.Product.name} (${item.quantity})`)
              .join(", ")}.`;
          }

          refundReason += ` Original total: ${totalOrderValue}, found items total: ${formattedOrderAmount}.`;
        }
      }
    } catch (orderError) {
      console.error("Error getting order details:", orderError);
      // Continue without refund if we can't get order details
    }

    // Calculate the new reserved balance after deducting the FULL original amount
    // This is different from before - we deduct the full original amount, not just the found items amount
    const newReserved =
      currentReserved - (originalOrderTotal || formattedOrderAmount);
    console.log(
      `Updating reserved balance: ${currentReserved} - ${
        originalOrderTotal || formattedOrderAmount
      } = ${newReserved}`
    );

    // Update the wallet balances - only change the reserved balance
    await hasuraClient.request(UPDATE_WALLET_BALANCES, {
      wallet_id: walletId,
      reserved_balance: newReserved.toString(),
    });

    // Create wallet transaction records for payment
    // Build description with MoMo payment details
    let description =
      "Payment for found order items (excluding service and delivery fees)";

    if (momoReferenceId && momoSuccess !== undefined) {
      const momoStatus = momoSuccess ? "SUCCESSFUL" : "FAILED";
      description += ` | MoMo Payment: ${momoStatus} | Reference ID: ${momoReferenceId}`;
    }

    const transactions = [
      {
        wallet_id: walletId,
        amount: formattedOrderAmount.toFixed(2),
        type: "payment",
        status: "completed",
        related_order_id: orderId,
        related_reel_orderId: null,
        related_restaurant_order_id: null,
        description: description,
      },
    ];

    console.log(
      `Recording transaction for order ${orderId}, amount: ${formattedOrderAmount.toFixed(
        2
      )} (found items only)`
    );
    const response = await hasuraClient.request(CREATE_WALLET_TRANSACTIONS, {
      transactions,
    });

    // Handle refund if needed
    let refundResponse = null;
    if (refundNeeded && refundAmount > 0 && orderData) {
      try {
        console.log(`Creating refund record for amount: ${refundAmount}`);

        // Create refund record
        const refundRecord = {
          order_id: orderId,
          amount: refundAmount.toString(),
          status: "pending",
          reason: refundReason,
          generated_by: "System",
          user_id: orderData.user_id,
          paid: false,
        };

        refundResponse = await hasuraClient.request<RefundResponse>(
          CREATE_REFUND,
          {
            refund: refundRecord,
          }
        );

        console.log("Refund record created:", refundResponse);
      } catch (refundError) {
        console.error("Error creating refund record:", refundError);
        // Don't fail the transaction if refund creation fails, just log it
      }
    }

    return res.status(200).json({
      success: true,
      message: "Transaction recorded and wallet balance updated successfully",
      data: response,
      refund: refundResponse ? refundResponse.insert_Refunds_one : null,
      refundAmount: refundNeeded ? refundAmount : 0,
      newBalance: {
        reserved: newReserved,
      },
    });
  } catch (error) {
    console.error("Error recording transaction:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
