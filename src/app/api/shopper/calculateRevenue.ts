import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { RevenueCalculator } from "../../../src/lib/revenueCalculator";

// GraphQL query to get order details with items for revenue calculation
const GET_ORDER_WITH_ITEMS = gql`
  query GetOrderWithItems($orderId: uuid!) {
    Orders_by_pk(id: $orderId) {
      id
      total
      service_fee
      delivery_fee
      shopper_id
      shop_id
      Order_Items {
        id
        quantity
        price
        Product {
          id
          name
          price
          final_price
        }
      }
    }
  }
`;

// GraphQL query to get shopper ID from user ID
const GET_SHOPPER_ID = gql`
  query GetShopperId($user_id: uuid!) {
    shoppers(where: { user_id: { _eq: $user_id } }) {
      id
    }
  }
`;

// GraphQL query to get system configuration for plasa fee calculation
const GET_SYSTEM_CONFIG = gql`
  query GetSystemConfig {
    System_configuratioins {
      deliveryCommissionPercentage
    }
  }
`;

// Check if revenue already exists for this order
const CHECK_EXISTING_REVENUE = gql`
  query CheckExistingRevenue($order_id: uuid!) {
    Revenue(where: { order_id: { _eq: $order_id } }) {
      id
      type
    }
  }
`;

// Create revenue record
const CREATE_REVENUE = gql`
  mutation CreateRevenue(
    $type: String!
    $shopper_id: uuid
    $products: jsonb
    $order_id: uuid
    $shop_id: uuid!
    $amount: String!
    $commission_percentage: String
  ) {
    insert_Revenue(
      objects: {
        type: $type
        shopper_id: $shopper_id
        products: $products
        order_id: $order_id
        shop_id: $shop_id
        amount: $amount
        commission_percentage: $commission_percentage
        businessOrder_Id: null
        reel_order_id: null
        restaurant_order_id: null
        restaurant_id: null
        Plasbusiness_id: null
      }
    ) {
      affected_rows
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Authenticate user
  const session = (await getServerSession(req, res, authOptions as any)) as any;
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: "Missing orderId" });
  }

  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // 0. Check if revenue already exists for this order
    const existingRevenue = await hasuraClient.request<{
      Revenue: Array<{ id: string; type: string }>;
    }>(CHECK_EXISTING_REVENUE, { order_id: orderId });

    if (existingRevenue.Revenue && existingRevenue.Revenue.length > 0) {
      console.log(
        `Revenue already exists for order ${orderId}, skipping calculation`
      );
      return res.status(200).json({
        success: true,
        message: "Revenue already calculated for this order",
        data: {
          commission_revenue: "0.00",
          plasa_fee: "0.00",
          product_profits: [],
        },
      });
    }

    // 1. Get order details with items
    const orderData = await hasuraClient.request<{
      Orders_by_pk: {
        id: string;
        total: string;
        service_fee: string;
        delivery_fee: string;
        shopper_id: string;
        shop_id: string;
        Order_Items: Array<{
          id: string;
          quantity: number;
          price: string;
          Product: {
            id: string;
            name: string;
            price: string;
            final_price: string;
          };
        }>;
      };
    }>(GET_ORDER_WITH_ITEMS, { orderId });

    const order = orderData.Orders_by_pk;
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // 2. Convert order items to cart items format for revenue calculation
    const cartItems = order.Order_Items.map((item) => ({
      quantity: item.quantity,
      Product: {
        price: item.Product.price,
        final_price: item.Product.final_price,
        name: item.Product.name,
      },
    }));

    // 3. Calculate revenue using RevenueCalculator
    const revenueData = RevenueCalculator.calculateRevenue(cartItems);
    const productProfits = RevenueCalculator.calculateProductProfits(cartItems);

    // 4. Get system configuration for plasa fee calculation
    const systemConfigData = await hasuraClient.request<{
      System_configuratioins: Array<{ deliveryCommissionPercentage: string }>;
    }>(GET_SYSTEM_CONFIG);

    const deliveryCommissionPercentage = parseFloat(
      systemConfigData.System_configuratioins[0]
        ?.deliveryCommissionPercentage || "0"
    );

    // 5. Calculate plasa fee
    const serviceFeeNum = parseFloat(order.service_fee || "0");
    const deliveryFeeNum = parseFloat(order.delivery_fee || "0");
    const plasaFee = RevenueCalculator.calculatePlasaFee(
      serviceFeeNum,
      deliveryFeeNum,
      deliveryCommissionPercentage
    );

    // 5. Get the correct shopper ID from the shoppers table
    let shopperId = null;
    if (order.shopper_id) {
      const shopperData = await hasuraClient.request<{
        shoppers: Array<{ id: string }>;
      }>(GET_SHOPPER_ID, { user_id: order.shopper_id });

      if (shopperData.shoppers && shopperData.shoppers.length > 0) {
        shopperId = shopperData.shoppers[0].id;
      }
    }

    // 6. Create commission revenue record (product profits)
    await hasuraClient.request(CREATE_REVENUE, {
      type: "commission",
      order_id: orderId,
      shop_id: order.shop_id,
      shopper_id: shopperId,
      amount: revenueData.revenue,
      products: JSON.stringify(productProfits),
      commission_percentage: null,
    });

    // 7. Create plasa fee revenue record (service + delivery fees)
    if (plasaFee > 0) {
      await hasuraClient.request(CREATE_REVENUE, {
        type: "plasa_fee",
        order_id: null, // Not tied to specific order
        shop_id: order.shop_id,
        shopper_id: shopperId,
        amount: plasaFee.toFixed(2),
        products: null, // No products for plasa fee
        commission_percentage: deliveryCommissionPercentage.toString(),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Revenue calculated and recorded successfully",
      data: {
        commission_revenue: revenueData.revenue,
        plasa_fee: plasaFee.toFixed(2),
        product_profits: productProfits,
      },
    });
  } catch (err: any) {
    console.error("Revenue calculation error:", err);
    return res.status(500).json({
      error: err.message || "Failed to calculate revenue",
    });
  }
}
