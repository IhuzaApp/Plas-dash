import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { RevenueCalculator } from "../../../src/lib/revenueCalculator";

// GraphQL query to get order details with items for commission revenue calculation
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
          price
          final_price
          ProductName {
            name
          }
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

// Check if commission revenue already exists for this order
const CHECK_EXISTING_COMMISSION_REVENUE = gql`
  query CheckExistingCommissionRevenue($order_id: uuid!) {
    Revenue(
      where: { order_id: { _eq: $order_id }, type: { _eq: "commission" } }
    ) {
      id
      type
    }
  }
`;

// Create commission revenue record (regular/combined orders only; businessOrder_Id null)
const CREATE_COMMISSION_REVENUE = gql`
  mutation CreateCommissionRevenue(
    $shopper_id: uuid
    $products: jsonb
    $order_id: uuid
    $shop_id: uuid!
    $amount: String!
  ) {
    insert_Revenue(
      objects: {
        type: "commission"
        shopper_id: $shopper_id
        products: $products
        order_id: $order_id
        shop_id: $shop_id
        amount: $amount
        commission_percentage: null
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

    // Check if commission revenue already exists for this order
    const existingRevenue = await hasuraClient.request<{
      Revenue: Array<{ id: string; type: string }>;
    }>(CHECK_EXISTING_COMMISSION_REVENUE, { order_id: orderId });

    if (existingRevenue.Revenue && existingRevenue.Revenue.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Commission revenue already calculated for this order",
        data: {
          commission_revenue: "0.00",
          product_profits: [],
        },
      });
    }

    // Get order details with items
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
            price: string;
            final_price: string;
            ProductName: {
              name: string;
            };
          };
        }>;
      };
    }>(GET_ORDER_WITH_ITEMS, { orderId });

    const order = orderData.Orders_by_pk;
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Convert order items to cart items format for revenue calculation
    const cartItems = order.Order_Items.map((item) => ({
      quantity: item.quantity,
      Product: {
        price: item.Product.price,
        final_price: item.Product.final_price,
        name: item.Product.ProductName.name,
      },
    }));

    // Calculate commission revenue using RevenueCalculator
    const revenueData = RevenueCalculator.calculateRevenue(cartItems);
    const productProfits = RevenueCalculator.calculateProductProfits(cartItems);

    // Get the correct shopper ID from the shoppers table
    let shopperId = null;
    if (order.shopper_id) {
      const shopperData = await hasuraClient.request<{
        shoppers: Array<{ id: string }>;
      }>(GET_SHOPPER_ID, { user_id: order.shopper_id });

      if (shopperData.shoppers && shopperData.shoppers.length > 0) {
        shopperId = shopperData.shoppers[0].id;
      }
    }

    // Create commission revenue record (product profits only)
    await hasuraClient.request(CREATE_COMMISSION_REVENUE, {
      order_id: orderId,
      shop_id: order.shop_id,
      shopper_id: shopperId,
      amount: revenueData.revenue,
      products: JSON.stringify(productProfits),
    });

    return res.status(200).json({
      success: true,
      message: "Commission revenue calculated and recorded successfully",
      data: {
        commission_revenue: revenueData.revenue,
        product_profits: productProfits,
      },
    });
  } catch (error) {
    console.error("Error calculating commission revenue:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to calculate commission revenue",
    });
  }
}
