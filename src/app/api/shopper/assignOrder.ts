import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

// GraphQL mutation to assign a shopper and update status for regular orders
const ASSIGN_ORDER = gql`
  mutation AssignOrder(
    $id: uuid!
    $shopper_id: uuid!
    $updated_at: timestamptz!
    $assigned_at: timestamptz!
  ) {
    update_Orders_by_pk(
      pk_columns: { id: $id }
      _set: {
        shopper_id: $shopper_id
        status: "accepted"
        updated_at: $updated_at
        assigned_at: $assigned_at
      }
    ) {
      id
      shopper_id
      status
      updated_at
      assigned_at
    }
  }
`;

// GraphQL mutation to assign a shopper and update status for reel orders
const ASSIGN_REEL_ORDER = gql`
  mutation AssignReelOrder(
    $id: uuid!
    $shopper_id: uuid!
    $updated_at: timestamptz!
    $assigned_at: timestamptz!
  ) {
    update_reel_orders_by_pk(
      pk_columns: { id: $id }
      _set: {
        shopper_id: $shopper_id
        status: "accepted"
        updated_at: $updated_at
        assigned_at: $assigned_at
      }
    ) {
      id
      shopper_id
      status
      updated_at
      assigned_at
    }
  }
`;

// GraphQL mutation to assign a shopper and update status for restaurant orders
const ASSIGN_RESTAURANT_ORDER = gql`
  mutation AssignRestaurantOrder(
    $id: uuid!
    $shopper_id: uuid!
    $updated_at: timestamptz!
    $assigned_at: timestamptz!
  ) {
    update_restaurant_orders_by_pk(
      pk_columns: { id: $id }
      _set: {
        shopper_id: $shopper_id
        status: "accepted"
        updated_at: $updated_at
        assigned_at: $assigned_at
      }
    ) {
      id
      shopper_id
      status
      updated_at
      assigned_at
    }
  }
`;

// GraphQL query to check if shopper has a wallet
const CHECK_WALLET = gql`
  query CheckShopperWallet($shopper_id: uuid!) {
    Wallets(where: { shopper_id: { _eq: $shopper_id } }) {
      id
      available_balance
      reserved_balance
    }
  }
`;

// GraphQL query to get reel order details with fees
const GET_REEL_ORDER_DETAILS = gql`
  query GetReelOrderDetails($orderId: uuid!) {
    reel_orders_by_pk(id: $orderId) {
      id
      total
      service_fee
      delivery_fee
      shopper_id
    }
  }
`;

// GraphQL mutation to update wallet balances
const UPDATE_WALLET_BALANCES = gql`
  mutation UpdateWalletBalances(
    $wallet_id: uuid!
    $available_balance: String!
    $reserved_balance: String!
  ) {
    update_Wallets_by_pk(
      pk_columns: { id: $wallet_id }
      _set: {
        available_balance: $available_balance
        reserved_balance: $reserved_balance
        last_updated: "now()"
      }
    ) {
      id
      available_balance
      reserved_balance
      last_updated
    }
  }
`;

// GraphQL mutation to create wallet transactions
const CREATE_WALLET_TRANSACTIONS = gql`
  mutation CreateWalletTransactions(
    $transactions: [Wallet_Transactions_insert_input!]!
  ) {
    insert_Wallet_Transactions(objects: $transactions) {
      affected_rows
    }
  }
`;

// Define interface for session user
interface SessionUser {
  user?: {
    id?: string;
  };
}

// Define interface for order response
interface OrderResponse {
  update_Orders_by_pk: {
    id: string;
    shopper_id: string;
    status: string;
    updated_at: string;
  };
}

// Define interface for reel order response
interface ReelOrderResponse {
  update_reel_orders_by_pk: {
    id: string;
    shopper_id: string;
    status: string;
    updated_at: string;
  };
}

// Define interface for restaurant order response
interface RestaurantOrderResponse {
  update_restaurant_orders_by_pk: {
    id: string;
    shopper_id: string;
    status: string;
    updated_at: string;
  };
}

// Define interface for wallet response
interface WalletResponse {
  Wallets: Array<{
    id: string;
    available_balance: string;
    reserved_balance: string;
  }>;
}

// Define interface for reel order details
interface ReelOrderDetails {
  reel_orders_by_pk: {
    id: string;
    total: string;
    service_fee: string;
    delivery_fee: string;
    shopper_id: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Authenticate the shopper
  const session = (await getServerSession(
    req,
    res,
    authOptions as any
  )) as SessionUser;
  const userId = session?.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { orderId, orderType = "regular" } = req.body;
  if (typeof orderId !== "string") {
    return res.status(400).json({ error: "Missing or invalid orderId" });
  }

  if (
    orderType !== "regular" &&
    orderType !== "reel" &&
    orderType !== "restaurant"
  ) {
    return res.status(400).json({
      error: "Invalid orderType. Must be 'regular', 'reel', or 'restaurant'",
    });
  }

  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Check if shopper has a wallet
    const walletData = await hasuraClient.request<WalletResponse>(
      CHECK_WALLET,
      {
        shopper_id: userId,
      }
    );

    // If no wallet exists, return an error
    if (!walletData.Wallets || walletData.Wallets.length === 0) {
      return res.status(400).json({ error: "no_wallet" });
    }

    // Get current timestamp for updated_at and assigned_at
    const currentTimestamp = new Date().toISOString();
    const assignedAt = new Date().toISOString();

    let data: OrderResponse | ReelOrderResponse | RestaurantOrderResponse;

    if (orderType === "reel") {
      // For reel orders, we need to update wallet balances during assignment
      // since they don't go through the shopping phase
      try {
        // Get reel order details
        const reelOrderDetails = await hasuraClient.request<ReelOrderDetails>(
          GET_REEL_ORDER_DETAILS,
          {
            orderId,
          }
        );

        const order = reelOrderDetails.reel_orders_by_pk;
        if (!order) {
          return res.status(404).json({ error: "Reel order not found" });
        }

        const wallet = walletData.Wallets[0];

        // Calculate new balances
        const orderTotal = parseFloat(order.total);
        const currentReservedBalance = parseFloat(wallet.reserved_balance);

        // NOTE: Earnings are NOT added here - they will be added when the order is delivered
        // Only add order total to reserved balance
        const newReservedBalance = (
          currentReservedBalance + orderTotal
        ).toFixed(2);

        // Update wallet balances (only reserved balance changes, available balance stays the same)
        await hasuraClient.request(UPDATE_WALLET_BALANCES, {
          wallet_id: wallet.id,
          available_balance: wallet.available_balance, // Keep existing available balance
          reserved_balance: newReservedBalance,
        });

        // Note: Wallet_Transactions table is designed for regular orders only
        // For reel orders, we skip transaction creation to avoid foreign key constraint issues
        // The wallet balances are still updated correctly above
        console.log(
          "Wallet balances updated for reel order assignment (no transactions created)"
        );

        console.log("Wallet balances updated for reel order assignment");
      } catch (walletError) {
        console.error(
          "Error updating wallet balances for reel order:",
          walletError
        );
        return res.status(500).json({
          error:
            walletError instanceof Error
              ? walletError.message
              : "Failed to update wallet balances",
        });
      }

      // Assign reel order
      data = await hasuraClient.request<ReelOrderResponse>(ASSIGN_REEL_ORDER, {
        id: orderId,
        shopper_id: userId,
        updated_at: currentTimestamp,
        assigned_at: assignedAt,
      });
    } else if (orderType === "restaurant") {
      // Assign restaurant order (no wallet updates here, they happen during delivery)
      data = await hasuraClient.request<RestaurantOrderResponse>(
        ASSIGN_RESTAURANT_ORDER,
        {
          id: orderId,
          shopper_id: userId,
          updated_at: currentTimestamp,
          assigned_at: assignedAt,
        }
      );
    } else {
      // Assign regular order (no wallet updates here, they happen during shopping status)
      data = await hasuraClient.request<OrderResponse>(ASSIGN_ORDER, {
        id: orderId,
        shopper_id: userId,
        updated_at: currentTimestamp,
        assigned_at: assignedAt,
      });
    }

    const result =
      orderType === "reel"
        ? (data as ReelOrderResponse).update_reel_orders_by_pk
        : orderType === "restaurant"
        ? (data as RestaurantOrderResponse).update_restaurant_orders_by_pk
        : (data as OrderResponse).update_Orders_by_pk;

    // Clean up notifications for this order
    try {
      const cleanupResponse = await fetch(
        `${
          req.headers.host
            ? `http://${req.headers.host}`
            : "http://localhost:3000"
        }/api/shopper/cleanup-notification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: req.headers.cookie || "",
          },
          body: JSON.stringify({
            orderId,
            orderType,
          }),
        }
      );

      if (cleanupResponse.ok) {
        console.log("Notifications cleaned up successfully");
      } else {
        console.warn(
          "Failed to cleanup notifications, but order assignment succeeded"
        );
      }
    } catch (cleanupError) {
      console.warn("Error cleaning up notifications:", cleanupError);
      // Don't fail the assignment if cleanup fails
    }

    return res.status(200).json({
      success: true,
      order: result,
      orderType: orderType,
    });
  } catch (error) {
    console.error("Error assigning order:", error);
    return res.status(500).json({ error: "Failed to assign order" });
  }
}
