import type { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { processWalletOperation } from "../../../src/lib/walletOperations";

// Combined order update mutations - update orders with same combined_order_id AND same shop_id
const UPDATE_COMBINED_ORDERS = gql`
  mutation UpdateCombinedOrders(
    $combinedId: uuid!
    $shopId: uuid!
    $status: String!
    $updated_at: timestamptz!
  ) {
    update_Orders(
      where: {
        combined_order_id: { _eq: $combinedId }
        shop_id: { _eq: $shopId }
        shopper_id: { _is_null: false }
      }
      _set: { status: $status, updated_at: $updated_at }
    ) {
      affected_rows
      returning {
        id
        status
      }
    }
  }
`;

// Delete order offers when orders are delivered
const DELETE_ORDER_OFFERS = gql`
  mutation DeleteOrderOffers($orderIds: [uuid!]!) {
    delete_order_offers(where: { order_id: { _in: $orderIds } }) {
      affected_rows
    }
  }
`;

const UPDATE_COMBINED_REEL_ORDERS = gql`
  mutation UpdateCombinedReelOrders(
    $combinedId: uuid!
    $shopId: uuid!
    $status: String!
    $updated_at: timestamptz!
  ) {
    update_reel_orders(
      where: {
        combined_order_id: { _eq: $combinedId }
        Reel: { shop_id: { _eq: $shopId } }
      }
      _set: { status: $status, updated_at: $updated_at }
    ) {
      affected_rows
      returning {
        id
        status
      }
    }
  }
`;

const UPDATE_COMBINED_REEL_ORDERS_BY_RESTAURANT = gql`
  mutation UpdateCombinedReelOrdersByRestaurant(
    $combinedId: uuid!
    $restaurantId: uuid!
    $status: String!
    $updated_at: timestamptz!
  ) {
    update_reel_orders(
      where: {
        combined_order_id: { _eq: $combinedId }
        Reel: { restaurant_id: { _eq: $restaurantId } }
      }
      _set: { status: $status, updated_at: $updated_at }
    ) {
      affected_rows
      returning {
        id
        status
      }
    }
  }
`;

const UPDATE_COMBINED_RESTAURANT_ORDERS = gql`
  mutation UpdateCombinedRestaurantOrders(
    $combinedId: uuid!
    $restaurantId: uuid!
    $status: String!
    $updated_at: timestamptz!
  ) {
    update_restaurant_orders(
      where: {
        combined_order_id: { _eq: $combinedId }
        restaurant_id: { _eq: $restaurantId }
      }
      _set: { status: $status, updated_at: $updated_at }
    ) {
      affected_rows
      returning {
        id
        status
      }
    }
  }
`;

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

  const { orderId, status, updateOnlyThisOrder } = req.body;

  if (!orderId || !status) {
    return res
      .status(400)
      .json({ error: "Missing required fields: orderId and status" });
  }

  // If updateOnlyThisOrder is true, we should only update the specific order
  // even if it's part of a combined order (e.g., orders going to different customers)
  const shouldUpdateOnlyThisOrder = updateOnlyThisOrder === true;

  // Validate status value
  const validStatuses = [
    "accepted",
    "shopping",
    "picked",
    "in_progress",
    "on_the_way",
    "at_customer",
    "delivered",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    // First check if this is a regular order or reel order
    const CHECK_REGULAR_ORDER = gql`
      query CheckRegularOrder($orderId: uuid!, $shopperId: uuid!) {
        Orders(
          where: { id: { _eq: $orderId }, shopper_id: { _eq: $shopperId } }
        ) {
          id
          status
          combined_order_id
        }
      }
    `;

    const CHECK_REEL_ORDER = gql`
      query CheckReelOrder($orderId: uuid!, $shopperId: uuid!) {
        reel_orders(
          where: { id: { _eq: $orderId }, shopper_id: { _eq: $shopperId } }
        ) {
          id
          status
          combined_order_id
        }
      }
    `;

    const CHECK_RESTAURANT_ORDER = gql`
      query CheckRestaurantOrder($orderId: uuid!, $shopperId: uuid!) {
        restaurant_orders(
          where: { id: { _eq: $orderId }, shopper_id: { _eq: $shopperId } }
        ) {
          id
          status
          combined_order_id
        }
      }
    `;

    const CHECK_BUSINESS_ORDER = gql`
      query CheckBusinessOrder($orderId: uuid!, $shopperId: uuid!) {
        businessProductOrders(
          where: { id: { _eq: $orderId }, shopper_id: { _eq: $shopperId } }
        ) {
          id
          status
          store_id
        }
      }
    `;

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    let isReelOrder = false;
    let isRestaurantOrder = false;
    let isBusinessOrder = false;
    let orderType = "regular";

    // Check regular orders first
    const regularOrderCheck = await hasuraClient.request<{
      Orders: Array<{
        id: string;
        status: string;
        combined_order_id: string | null;
      }>;
    }>(CHECK_REGULAR_ORDER, {
      orderId,
      shopperId: userId,
    });

    if (regularOrderCheck.Orders && regularOrderCheck.Orders.length > 0) {
      // Found regular order assignment
      orderType = "regular";
    } else {
      // Check reel orders
      const reelOrderCheck = await hasuraClient.request<{
        reel_orders: Array<{
          id: string;
          status: string;
          combined_order_id: string | null;
        }>;
      }>(CHECK_REEL_ORDER, {
        orderId,
        shopperId: userId,
      });

      if (reelOrderCheck.reel_orders && reelOrderCheck.reel_orders.length > 0) {
        // Found reel order assignment
        isReelOrder = true;
        orderType = "reel";
      } else {
        // Check restaurant orders
        const restaurantOrderCheck = await hasuraClient.request<{
          restaurant_orders: Array<{
            id: string;
            status: string;
            combined_order_id: string | null;
          }>;
        }>(CHECK_RESTAURANT_ORDER, {
          orderId,
          shopperId: userId,
        });

        if (
          restaurantOrderCheck.restaurant_orders &&
          restaurantOrderCheck.restaurant_orders.length > 0
        ) {
          // Found restaurant order assignment
          isRestaurantOrder = true;
          orderType = "restaurant";
        } else {
          // Check business orders
          const businessOrderCheck = await hasuraClient.request<{
            businessProductOrders: Array<{
              id: string;
              status: string;
              store_id: string;
            }>;
          }>(CHECK_BUSINESS_ORDER, {
            orderId,
            shopperId: userId,
          });

          if (
            businessOrderCheck.businessProductOrders &&
            businessOrderCheck.businessProductOrders.length > 0
          ) {
            isBusinessOrder = true;
            orderType = "business";
          } else {
            console.error(
              "Authorization failed: Shopper not assigned to this order"
            );
            return res
              .status(403)
              .json({ error: "You are not assigned to this order" });
          }
        }
      }
    }

    // Prevent restaurant and business orders from being updated to "shopping" status
    if ((isRestaurantOrder || isBusinessOrder) && status === "shopping") {
      return res.status(400).json({
        error:
          "Restaurant and business orders cannot be updated to 'shopping' status. Use 'on_the_way' instead.",
      });
    }

    // Handle shopping status - process wallet operations only for regular/combined orders
    // Reel and restaurant orders don't use wallet "shopping"; others are skipped (no wallet op)
    if (status === "shopping" && !isRestaurantOrder && !isReelOrder) {
      try {
        await processWalletOperation(
          userId,
          orderId,
          "shopping",
          false,
          false,
          false,
          req
        );
      } catch (walletError) {
        console.error("Error processing wallet operation:", walletError);
        return res.status(500).json({
          error:
            walletError instanceof Error
              ? walletError.message
              : "Failed to process wallet operation",
        });
      }
    }

    // Get current timestamp for updated_at
    const currentTimestamp = new Date().toISOString();

    // Update the order status based on order type
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Get order details to check for combined orders
    let orderDetails: any = null;
    let combinedId: string | null = null;
    let shopId: string | null = null;
    let restaurantId: string | null = null;
    let reelRestaurantId: string | null = null;

    if (isReelOrder) {
      const reelDetails = await hasuraClient.request<any>(
        `
        query GetReelOrderDetails($orderId: uuid!) {
          reel_orders_by_pk(id: $orderId) {
            id
            combined_order_id
            status
            Reel {
              shop_id
              restaurant_id
            }
          }
        }
      `,
        { orderId }
      );
      orderDetails = reelDetails.reel_orders_by_pk;
      combinedId = orderDetails?.combined_order_id;
      shopId = orderDetails?.Reel?.shop_id ?? null;
      reelRestaurantId = orderDetails?.Reel?.restaurant_id ?? null;
    } else if (isRestaurantOrder) {
      const restaurantDetails = await hasuraClient.request<any>(
        `
        query GetRestaurantOrderDetails($orderId: uuid!) {
          restaurant_orders_by_pk(id: $orderId) {
            id
            combined_order_id
            restaurant_id
            status
          }
        }
      `,
        { orderId }
      );
      orderDetails = restaurantDetails.restaurant_orders_by_pk;
      combinedId = orderDetails?.combined_order_id;
      restaurantId = orderDetails?.restaurant_id;
    } else if (isBusinessOrder) {
      const businessDetails = await hasuraClient.request<any>(
        `
        query GetBusinessOrderDetails($orderId: uuid!) {
          businessProductOrders_by_pk(id: $orderId) {
            id
            status
            store_id
            total
            service_fee
            transportation_fee
            allProducts
            business_store {
              business_id
            }
          }
        }
      `,
        { orderId }
      );
      orderDetails = businessDetails.businessProductOrders_by_pk;
      // Store belongs to business: get business_id from store (business_wallet is keyed by business_id)
      if (orderDetails?.store_id) {
        const storeBusinessId =
          orderDetails.business_store?.business_id ??
          (
            await hasuraClient.request<{
              business_stores_by_pk: { business_id: string } | null;
            }>(
              gql`
                query GetStoreBusinessId($store_id: uuid!) {
                  business_stores_by_pk(id: $store_id) {
                    business_id
                  }
                }
              `,
              { store_id: orderDetails.store_id }
            )
          ).business_stores_by_pk?.business_id;
        if (storeBusinessId) {
          orderDetails = {
            ...orderDetails,
            store: { business_id: storeBusinessId },
          };
        }
      }
    } else {
      const regularDetails = await hasuraClient.request<any>(
        `
        query GetRegularOrderDetails($orderId: uuid!) {
          Orders_by_pk(id: $orderId) {
            id
            combined_order_id
            shop_id
            status
          }
        }
      `,
        { orderId }
      );
      orderDetails = regularDetails.Orders_by_pk;
      combinedId = orderDetails?.combined_order_id;
      shopId = orderDetails?.shop_id;
    }

    let updatedOrders: any[] = [];

    // IMPORTANT: Check updateOnlyThisOrder FIRST before checking combinedId
    // If updateOnlyThisOrder is true, we should only update the specific order
    // even if it's part of a combined order (e.g., orders going to different customers)
    if (shouldUpdateOnlyThisOrder) {
      console.log(
        "🔄 [UPDATE ORDER STATUS] Updating ONLY this order (different customers):",
        {
          orderId,
          combinedId,
          status,
        }
      );

      // Single order update - skip combined order logic
      const UPDATE_ORDER_STATUS = gql`
        mutation UpdateOrderStatus(
          $id: uuid!
          $status: String!
          $updated_at: timestamptz!
        ) {
          update_Orders_by_pk(
            pk_columns: { id: $id }
            _set: { status: $status, updated_at: $updated_at }
          ) {
            id
            status
            updated_at
          }
        }
      `;
      const UPDATE_REEL_ORDER_STATUS = gql`
        mutation UpdateReelOrderStatus(
          $id: uuid!
          $status: String!
          $updated_at: timestamptz!
        ) {
          update_reel_orders_by_pk(
            pk_columns: { id: $id }
            _set: { status: $status, updated_at: $updated_at }
          ) {
            id
            status
            updated_at
          }
        }
      `;
      const UPDATE_RESTAURANT_ORDER_STATUS = gql`
        mutation UpdateRestaurantOrderStatus(
          $id: uuid!
          $status: String!
          $updated_at: timestamptz!
        ) {
          update_restaurant_orders_by_pk(
            pk_columns: { id: $id }
            _set: { status: $status, updated_at: $updated_at }
          ) {
            id
            status
            updated_at
          }
        }
      `;
      const UPDATE_BUSINESS_ORDER_STATUS = gql`
        mutation UpdateBusinessOrderStatus($id: uuid!, $status: String!) {
          update_businessProductOrders_by_pk(
            pk_columns: { id: $id }
            _set: { status: $status }
          ) {
            id
            status
          }
        }
      `;

      if (isReelOrder) {
        const result = await hasuraClient.request<any>(
          UPDATE_REEL_ORDER_STATUS,
          {
            id: orderId,
            status,
            updated_at: currentTimestamp,
          }
        );
        updatedOrders = [result.update_reel_orders_by_pk];
      } else if (isRestaurantOrder) {
        const result = await hasuraClient.request<any>(
          UPDATE_RESTAURANT_ORDER_STATUS,
          {
            id: orderId,
            status,
            updated_at: currentTimestamp,
          }
        );
        updatedOrders = [result.update_restaurant_orders_by_pk];
      } else if (isBusinessOrder) {
        const result = await hasuraClient.request<any>(
          UPDATE_BUSINESS_ORDER_STATUS,
          {
            id: orderId,
            status,
          }
        );
        updatedOrders = [result.update_businessProductOrders_by_pk];
      } else {
        const result = await hasuraClient.request<any>(UPDATE_ORDER_STATUS, {
          id: orderId,
          status,
          updated_at: currentTimestamp,
        });
        updatedOrders = [result.update_Orders_by_pk];
      }
    } else if (combinedId) {
      // If this order is part of a combined order, update all orders with same combined_order_id AND same shop_id
      const variables = {
        combinedId,
        status,
        updated_at: currentTimestamp,
      };

      // Update all orders with same combined_order_id AND same shop/restaurant_id
      const updatePromises = [];

      if (!isRestaurantOrder) {
        updatePromises.push(
          hasuraClient.request(UPDATE_COMBINED_ORDERS, { ...variables, shopId })
        );
      }
      if (isReelOrder) {
        if (shopId) {
          updatePromises.push(
            hasuraClient.request(UPDATE_COMBINED_REEL_ORDERS, {
              ...variables,
              shopId,
            })
          );
        } else if (reelRestaurantId) {
          updatePromises.push(
            hasuraClient.request(UPDATE_COMBINED_REEL_ORDERS_BY_RESTAURANT, {
              ...variables,
              restaurantId: reelRestaurantId,
            })
          );
        }
      }
      if (isRestaurantOrder) {
        updatePromises.push(
          hasuraClient.request(UPDATE_COMBINED_RESTAURANT_ORDERS, {
            ...variables,
            restaurantId,
          })
        );
      }

      const results = await Promise.all(updatePromises);

      // Collect all updated orders
      results.forEach((result: any) => {
        if (result?.update_Orders?.returning) {
          updatedOrders.push(...result.update_Orders.returning);
        }
        if (result?.update_reel_orders?.returning) {
          updatedOrders.push(...result.update_reel_orders.returning);
        }
        if (result?.update_restaurant_orders?.returning) {
          updatedOrders.push(...result.update_restaurant_orders.returning);
        }
      });
    } else {
      // Single order update (no combined orders)
      const UPDATE_ORDER_STATUS = gql`
        mutation UpdateOrderStatus(
          $id: uuid!
          $status: String!
          $updated_at: timestamptz!
        ) {
          update_Orders_by_pk(
            pk_columns: { id: $id }
            _set: { status: $status, updated_at: $updated_at }
          ) {
            id
            status
            updated_at
          }
        }
      `;
      const UPDATE_REEL_ORDER_STATUS = gql`
        mutation UpdateReelOrderStatus(
          $id: uuid!
          $status: String!
          $updated_at: timestamptz!
        ) {
          update_reel_orders_by_pk(
            pk_columns: { id: $id }
            _set: { status: $status, updated_at: $updated_at }
          ) {
            id
            status
            updated_at
          }
        }
      `;
      const UPDATE_RESTAURANT_ORDER_STATUS = gql`
        mutation UpdateRestaurantOrderStatus(
          $id: uuid!
          $status: String!
          $updated_at: timestamptz!
        ) {
          update_restaurant_orders_by_pk(
            pk_columns: { id: $id }
            _set: { status: $status, updated_at: $updated_at }
          ) {
            id
            status
            updated_at
          }
        }
      `;
      const UPDATE_BUSINESS_ORDER_STATUS_SINGLE = gql`
        mutation UpdateBusinessOrderStatusSingle($id: uuid!, $status: String!) {
          update_businessProductOrders_by_pk(
            pk_columns: { id: $id }
            _set: { status: $status }
          ) {
            id
            status
          }
        }
      `;

      if (isReelOrder) {
        const result = await hasuraClient.request<any>(
          UPDATE_REEL_ORDER_STATUS,
          {
            id: orderId,
            status,
            updated_at: currentTimestamp,
          }
        );
        updatedOrders = [result.update_reel_orders_by_pk];
      } else if (isRestaurantOrder) {
        const result = await hasuraClient.request<any>(
          UPDATE_RESTAURANT_ORDER_STATUS,
          {
            id: orderId,
            status,
            updated_at: currentTimestamp,
          }
        );
        updatedOrders = [result.update_restaurant_orders_by_pk];
      } else if (isBusinessOrder) {
        const result = await hasuraClient.request<any>(
          UPDATE_BUSINESS_ORDER_STATUS_SINGLE,
          {
            id: orderId,
            status,
          }
        );
        updatedOrders = [result.update_businessProductOrders_by_pk];
      } else {
        const result = await hasuraClient.request<any>(UPDATE_ORDER_STATUS, {
          id: orderId,
          status,
          updated_at: currentTimestamp,
        });
        updatedOrders = [result.update_Orders_by_pk];
      }
    }

    // Business order pickup (on_the_way): credit business wallet and record transaction
    // business_wallet is keyed by business_id; store belongs to business, so we use store.business_id
    const businessIdFromStore =
      orderDetails?.store?.business_id ??
      (orderDetails as any)?.business_store?.business_id;

    let businessOrderPickup: {
      walletUpdated: boolean;
      transactionInserted: boolean;
      message?: string;
    } | null = null;

    console.log("[updateOrderStatus] BUSINESS ORDER PICKUP – check:", {
      status,
      isBusinessOrder,
      orderId,
      orderDetailsTotal: orderDetails?.total,
      businessIdFromStore,
      willEnterWalletBlock:
        status === "on_the_way" &&
        isBusinessOrder &&
        orderDetails?.total != null &&
        !!businessIdFromStore,
    });

    if (
      status === "on_the_way" &&
      isBusinessOrder &&
      orderDetails?.total != null &&
      businessIdFromStore
    ) {
      try {
        const totalNum = parseFloat(String(orderDetails.total));
        const serviceFeeNum = parseFloat(
          String(orderDetails.service_fee || "0")
        );
        const transportFeeNum = parseFloat(
          String(orderDetails.transportation_fee || "0")
        );
        const itemAmount = Math.max(
          0,
          totalNum - serviceFeeNum - transportFeeNum
        );
        const businessId = businessIdFromStore;

        console.log("[updateOrderStatus] BUSINESS ORDER PICKUP – amounts:", {
          totalNum,
          serviceFeeNum,
          transportFeeNum,
          itemAmount,
          businessId,
        });

        const GET_BUSINESS_WALLET = gql`
          query GetBusinessWallet($business_id: uuid!) {
            business_wallet(where: { business_id: { _eq: $business_id } }) {
              id
              amount
            }
          }
        `;
        const walletResult = await hasuraClient.request<{
          business_wallet: Array<{ id: string; amount: string }>;
        }>(GET_BUSINESS_WALLET, { business_id: businessId });

        console.log(
          "[updateOrderStatus] BUSINESS ORDER PICKUP – wallet lookup:",
          {
            business_id: businessId,
            walletCount: walletResult.business_wallet?.length ?? 0,
            wallet: walletResult.business_wallet?.[0]
              ? {
                  id: walletResult.business_wallet[0].id,
                  amount: walletResult.business_wallet[0].amount,
                }
              : null,
          }
        );

        if (
          walletResult.business_wallet &&
          walletResult.business_wallet.length > 0
        ) {
          const wallet = walletResult.business_wallet[0];
          const currentAmount = parseFloat(wallet.amount || "0");
          const newAmount = (currentAmount + itemAmount).toFixed(2);
          const updatedAt = new Date().toISOString();

          console.log(
            "[updateOrderStatus] BUSINESS ORDER PICKUP – updating wallet:",
            {
              wallet_id: wallet.id,
              currentAmount,
              itemAmount,
              newAmount,
              business_id: businessId,
            }
          );

          const UPDATE_BUSINESS_WALLET = gql`
            mutation UpdateBusinessWallet(
              $amount: String!
              $updated_at: timestamptz!
              $business_id: uuid!
            ) {
              update_business_wallet(
                _set: { amount: $amount, updated_at: $updated_at }
                where: { business_id: { _eq: $business_id } }
              ) {
                affected_rows
              }
            }
          `;
          const updateWalletResult = await hasuraClient.request<{
            update_business_wallet: { affected_rows: number };
          }>(UPDATE_BUSINESS_WALLET, {
            amount: newAmount,
            updated_at: updatedAt,
            business_id: businessId,
          });

          console.log(
            "[updateOrderStatus] BUSINESS ORDER PICKUP – wallet updated in DB:",
            {
              affected_rows:
                updateWalletResult.update_business_wallet?.affected_rows,
            }
          );

          const products: Array<{
            name?: string;
            quantity?: number;
            unit?: string;
          }> = Array.isArray(orderDetails.allProducts)
            ? orderDetails.allProducts
            : typeof orderDetails.allProducts === "string"
            ? (() => {
                try {
                  const parsed = JSON.parse(orderDetails.allProducts);
                  return Array.isArray(parsed) ? parsed : [];
                } catch {
                  return [];
                }
              })()
            : [];
          const itemLines = products.map(
            (p: { name?: string; quantity?: number; unit?: string }) => {
              const name = p.name ?? "Item";
              const qty = p.quantity ?? 0;
              const unit = p.unit ? ` ${p.unit}` : "";
              return `${name} × ${qty}${unit}`;
            }
          );
          const itemsDescription =
            itemLines.length > 0 ? itemLines.join("; ") : "Order items";
          const description = `${itemsDescription} | Amount credited to wallet: ${Number(
            itemAmount
          ).toLocaleString()}`;

          const INSERT_BUSINESS_TRANSACTION = gql`
            mutation InsertBusinessTransaction(
              $action: String!
              $type: String!
              $related_order: uuid!
              $wallet_id: uuid!
              $status: String!
              $description: String
            ) {
              insert_businessTransactions(
                objects: {
                  action: $action
                  type: $type
                  related_order: $related_order
                  wallet_id: $wallet_id
                  status: $status
                  description: $description
                }
              ) {
                affected_rows
              }
            }
          `;
          const insertTxResult = await hasuraClient.request<{
            insert_businessTransactions: { affected_rows: number };
          }>(INSERT_BUSINESS_TRANSACTION, {
            action: "credit",
            type: "order_item_amount",
            related_order: orderId,
            wallet_id: wallet.id,
            status: "completed",
            description,
          });

          console.log(
            "[updateOrderStatus] BUSINESS ORDER PICKUP – transaction inserted in DB:",
            {
              affected_rows:
                insertTxResult.insert_businessTransactions?.affected_rows,
            }
          );

          businessOrderPickup = {
            walletUpdated:
              (updateWalletResult.update_business_wallet?.affected_rows ?? 0) >
              0,
            transactionInserted:
              (insertTxResult.insert_businessTransactions?.affected_rows ?? 0) >
              0,
          };
        } else {
          console.log(
            "[updateOrderStatus] BUSINESS ORDER PICKUP – no business_wallet row found for business_id, skipping wallet/transaction update"
          );
          businessOrderPickup = {
            walletUpdated: false,
            transactionInserted: false,
            message: "No business_wallet row found for business_id",
          };
        }
      } catch (businessWalletError) {
        console.error(
          "Error updating business wallet / transaction:",
          businessWalletError
        );
        businessOrderPickup = {
          walletUpdated: false,
          transactionInserted: false,
          message:
            businessWalletError instanceof Error
              ? businessWalletError.message
              : "Wallet/transaction update failed",
        };
        // Don't fail the status update; wallet/transaction can be reconciled later
      }
    } else if (status === "on_the_way" && isBusinessOrder) {
      console.log(
        "[updateOrderStatus] BUSINESS ORDER PICKUP – skipped (missing total or business_id):",
        {
          hasTotal: orderDetails?.total != null,
          hasBusinessId: !!businessIdFromStore,
        }
      );
      businessOrderPickup = {
        walletUpdated: false,
        transactionInserted: false,
        message: !businessIdFromStore
          ? "Missing business_id from store"
          : "Missing order total",
      };
    }

    // Handle cancelled status - process wallet operations directly
    if (status === "cancelled") {
      try {
        await processWalletOperation(
          userId,
          orderId,
          "cancelled",
          isReelOrder,
          isRestaurantOrder,
          false,
          req
        );
      } catch (walletError) {
        console.error("Error processing wallet operation:", walletError);
        return res.status(500).json({
          error:
            walletError instanceof Error
              ? walletError.message
              : "Failed to process wallet operation",
        });
      }
    }

    // Clean up order offers when orders are delivered
    if (status === "delivered" && updatedOrders.length > 0) {
      try {
        const orderIdsToClean = updatedOrders.map((order: any) => order.id);
        await hasuraClient.request(DELETE_ORDER_OFFERS, {
          orderIds: orderIdsToClean,
        });
      } catch (cleanupError) {
        // Log the error but don't fail the entire operation
        console.error("Error cleaning up order offers:", cleanupError);
      }
    }

    // Note: Wallet operations for "delivered" status are handled separately
    // in the DeliveryConfirmationModal before calling this API

    const responsePayload: Record<string, unknown> = {
      success: true,
      orders: updatedOrders,
      orderType,
    };
    if (businessOrderPickup != null) {
      responsePayload.businessOrderPickup = businessOrderPickup;
    }
    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to update order status",
    });
  }
}
