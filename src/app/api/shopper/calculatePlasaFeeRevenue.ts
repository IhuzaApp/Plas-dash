import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { RevenueCalculator } from "../../../src/lib/revenueCalculator";

// GraphQL query to get order details for plasa fee calculation (regular orders)
const GET_ORDER_DETAILS = gql`
  query GetOrderDetails($orderId: uuid!) {
    Orders_by_pk(id: $orderId) {
      id
      total
      service_fee
      delivery_fee
      shopper_id
      shop_id
    }
  }
`;

// GraphQL query to get business order details for plasa fee calculation
const GET_BUSINESS_ORDER_DETAILS = gql`
  query GetBusinessOrderDetails($orderId: uuid!) {
    businessProductOrders_by_pk(id: $orderId) {
      id
      total
      transportation_fee
      service_fee
      shopper_id
      store_id
    }
  }
`;

// GraphQL query to get reel order details for plasa fee calculation
const GET_REEL_ORDER_DETAILS = gql`
  query GetReelOrderDetails($orderId: uuid!) {
    reel_orders_by_pk(id: $orderId) {
      id
      total
      service_fee
      delivery_fee
      shopper_id
      user_id
      Reel {
        shop_id
      }
    }
  }
`;

// GraphQL query to get restaurant order details for plasa fee calculation
const GET_RESTAURANT_ORDER_DETAILS = gql`
  query GetRestaurantOrderDetails($orderId: uuid!) {
    restaurant_orders_by_pk(id: $orderId) {
      id
      total
      delivery_fee
      shopper_id
      user_id
      restaurant_id
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

// Check if plasa fee revenue already exists for this order (regular)
const CHECK_EXISTING_PLASA_FEE_REVENUE = gql`
  query CheckExistingPlasaFeeRevenue($order_id: uuid!) {
    Revenue(
      where: { order_id: { _eq: $order_id }, type: { _eq: "plasa_fee" } }
    ) {
      id
      type
    }
  }
`;

// Check if plasa fee revenue already exists for this business order
const CHECK_EXISTING_PLASA_FEE_BUSINESS = gql`
  query CheckExistingPlasaFeeBusiness($businessOrder_Id: uuid!) {
    Revenue(
      where: {
        businessOrder_Id: { _eq: $businessOrder_Id }
        type: { _eq: "plasa_fee" }
      }
    ) {
      id
      type
    }
  }
`;

// Check if plasa fee revenue already exists for this reel order
const CHECK_EXISTING_PLASA_FEE_REEL = gql`
  query CheckExistingPlasaFeeReel($reel_order_id: uuid!) {
    Revenue(
      where: {
        reel_order_id: { _eq: $reel_order_id }
        type: { _eq: "plasa_fee" }
      }
    ) {
      id
      type
    }
  }
`;

// Check if plasa fee revenue already exists for this restaurant order
const CHECK_EXISTING_PLASA_FEE_RESTAURANT = gql`
  query CheckExistingPlasaFeeRestaurant($restaurant_order_id: uuid!) {
    Revenue(
      where: {
        restaurant_order_id: { _eq: $restaurant_order_id }
        type: { _eq: "plasa_fee" }
      }
    ) {
      id
      type
    }
  }
`;

// Create plasa fee revenue record (supports regular, business, reel, restaurant via optional IDs)
// Explicitly pass businessOrder_Id, Plasbusiness_id, reel_order_id, restaurant_id, restaurant_order_id so all FKs are satisfied
const CREATE_PLASA_FEE_REVENUE = gql`
  mutation CreatePlasaFeeRevenue(
    $shopper_id: uuid
    $order_id: uuid
    $shop_id: uuid
    $restaurant_id: uuid
    $amount: String!
    $commission_percentage: String!
    $businessOrder_Id: uuid
    $Plasbusiness_id: uuid
    $reel_order_id: uuid
    $restaurant_order_id: uuid
    $products: jsonb
  ) {
    insert_Revenue(
      objects: {
        type: "plasa_fee"
        shopper_id: $shopper_id
        products: $products
        order_id: $order_id
        shop_id: $shop_id
        amount: $amount
        commission_percentage: $commission_percentage
        businessOrder_Id: $businessOrder_Id
        Plasbusiness_id: $Plasbusiness_id
        reel_order_id: $reel_order_id
        restaurant_id: $restaurant_id
        restaurant_order_id: $restaurant_order_id
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

  const { orderId, orderType = "regular" } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: "Missing orderId" });
  }

  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    if (orderType === "business") {
      // --- Business order flow ---
      const existingRevenue = await hasuraClient.request<{
        Revenue: Array<{ id: string; type: string }>;
      }>(CHECK_EXISTING_PLASA_FEE_BUSINESS, { businessOrder_Id: orderId });

      if (existingRevenue.Revenue && existingRevenue.Revenue.length > 0) {
        return res.status(200).json({
          success: true,
          message:
            "Plasa fee revenue already calculated for this business order",
          data: { plasa_fee: "0.00" },
        });
      }

      const businessOrderData = await hasuraClient.request<{
        businessProductOrders_by_pk: {
          id: string;
          total: string;
          transportation_fee: string | number;
          service_fee: string | number;
          shopper_id: string | null;
          store_id: string;
        } | null;
      }>(GET_BUSINESS_ORDER_DETAILS, { orderId });

      const order = businessOrderData.businessProductOrders_by_pk;
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const systemConfigData = await hasuraClient.request<{
        System_configuratioins: Array<{ deliveryCommissionPercentage: string }>;
      }>(GET_SYSTEM_CONFIG);
      const deliveryCommissionPercentage = parseFloat(
        systemConfigData.System_configuratioins[0]
          ?.deliveryCommissionPercentage || "0"
      );

      const serviceFeeNum = parseFloat(String(order.service_fee || "0"));
      const transportFeeNum = parseFloat(
        String(order.transportation_fee || "0")
      );
      const plasaFee = RevenueCalculator.calculatePlasaFee(
        serviceFeeNum,
        transportFeeNum,
        deliveryCommissionPercentage
      );

      if (plasaFee > 0) {
        await hasuraClient.request(CREATE_PLASA_FEE_REVENUE, {
          order_id: null,
          shop_id: null,
          restaurant_id: null,
          shopper_id: null,
          amount: plasaFee.toFixed(2),
          commission_percentage: deliveryCommissionPercentage.toString(),
          businessOrder_Id: orderId,
          Plasbusiness_id: order.store_id,
          reel_order_id: null,
          restaurant_order_id: null,
          products: null,
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Plasa fee revenue calculated and recorded successfully (business order)",
        data: {
          plasa_fee: plasaFee.toFixed(2),
          commission_percentage: deliveryCommissionPercentage,
        },
      });
    }

    if (orderType === "reel") {
      // --- Reel order flow ---
      const existingRevenue = await hasuraClient.request<{
        Revenue: Array<{ id: string; type: string }>;
      }>(CHECK_EXISTING_PLASA_FEE_REEL, { reel_order_id: orderId });

      if (existingRevenue.Revenue && existingRevenue.Revenue.length > 0) {
        return res.status(200).json({
          success: true,
          message: "Plasa fee revenue already calculated for this reel order",
          data: { plasa_fee: "0.00" },
        });
      }

      const reelOrderData = await hasuraClient.request<{
        reel_orders_by_pk: {
          id: string;
          total: string;
          service_fee: string;
          delivery_fee: string;
          shopper_id: string | null;
          user_id: string;
          Reel: { shop_id: string } | null;
        } | null;
      }>(GET_REEL_ORDER_DETAILS, { orderId });

      const order = reelOrderData.reel_orders_by_pk;
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const systemConfigData = await hasuraClient.request<{
        System_configuratioins: Array<{ deliveryCommissionPercentage: string }>;
      }>(GET_SYSTEM_CONFIG);
      const deliveryCommissionPercentage = parseFloat(
        systemConfigData.System_configuratioins[0]
          ?.deliveryCommissionPercentage || "0"
      );

      const serviceFeeNum = parseFloat(order.service_fee || "0");
      const deliveryFeeNum = parseFloat(order.delivery_fee || "0");
      const plasaFee = RevenueCalculator.calculatePlasaFee(
        serviceFeeNum,
        deliveryFeeNum,
        deliveryCommissionPercentage
      );

      let shopperId: string | null = null;
      if (order.shopper_id) {
        const shopperData = await hasuraClient.request<{
          shoppers: Array<{ id: string }>;
        }>(GET_SHOPPER_ID, { user_id: order.shopper_id });
        if (shopperData.shoppers?.length > 0) {
          shopperId = shopperData.shoppers[0].id;
        }
      }

      if (plasaFee > 0) {
        await hasuraClient.request(CREATE_PLASA_FEE_REVENUE, {
          order_id: null,
          shop_id: order.Reel?.shop_id ?? null,
          restaurant_id: null,
          shopper_id: shopperId,
          amount: plasaFee.toFixed(2),
          commission_percentage: deliveryCommissionPercentage.toString(),
          businessOrder_Id: null,
          Plasbusiness_id: null,
          reel_order_id: orderId,
          restaurant_order_id: null,
          products: null,
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Plasa fee revenue calculated and recorded successfully (reel order)",
        data: {
          plasa_fee: plasaFee.toFixed(2),
          commission_percentage: deliveryCommissionPercentage,
        },
      });
    }

    if (orderType === "restaurant") {
      // --- Restaurant order flow ---
      const existingRevenue = await hasuraClient.request<{
        Revenue: Array<{ id: string; type: string }>;
      }>(CHECK_EXISTING_PLASA_FEE_RESTAURANT, { restaurant_order_id: orderId });

      if (existingRevenue.Revenue && existingRevenue.Revenue.length > 0) {
        return res.status(200).json({
          success: true,
          message:
            "Plasa fee revenue already calculated for this restaurant order",
          data: { plasa_fee: "0.00" },
        });
      }

      const restaurantOrderData = await hasuraClient.request<{
        restaurant_orders_by_pk: {
          id: string;
          total: string;
          delivery_fee: string;
          shopper_id: string | null;
          user_id: string;
          restaurant_id: string;
        } | null;
      }>(GET_RESTAURANT_ORDER_DETAILS, { orderId });

      const order = restaurantOrderData.restaurant_orders_by_pk;
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const systemConfigData = await hasuraClient.request<{
        System_configuratioins: Array<{ deliveryCommissionPercentage: string }>;
      }>(GET_SYSTEM_CONFIG);
      const deliveryCommissionPercentage = parseFloat(
        systemConfigData.System_configuratioins[0]
          ?.deliveryCommissionPercentage || "0"
      );

      // Restaurant: only delivery fee for plasa fee (no service fee)
      const deliveryFeeNum = parseFloat(order.delivery_fee || "0");
      const plasaFee = RevenueCalculator.calculatePlasaFee(
        0,
        deliveryFeeNum,
        deliveryCommissionPercentage
      );

      let shopperId: string | null = null;
      if (order.shopper_id) {
        const shopperData = await hasuraClient.request<{
          shoppers: Array<{ id: string }>;
        }>(GET_SHOPPER_ID, { user_id: order.shopper_id });
        if (shopperData.shoppers?.length > 0) {
          shopperId = shopperData.shoppers[0].id;
        }
      }

      if (plasaFee > 0) {
        await hasuraClient.request(CREATE_PLASA_FEE_REVENUE, {
          order_id: null,
          shop_id: null,
          restaurant_id: order.restaurant_id,
          shopper_id: shopperId,
          amount: plasaFee.toFixed(2),
          commission_percentage: deliveryCommissionPercentage.toString(),
          businessOrder_Id: null,
          Plasbusiness_id: null,
          reel_order_id: null,
          restaurant_order_id: orderId,
          products: null,
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Plasa fee revenue calculated and recorded successfully (restaurant order)",
        data: {
          plasa_fee: plasaFee.toFixed(2),
          commission_percentage: deliveryCommissionPercentage,
        },
      });
    }

    // --- Regular order flow ---
    const existingRevenue = await hasuraClient.request<{
      Revenue: Array<{ id: string; type: string }>;
    }>(CHECK_EXISTING_PLASA_FEE_REVENUE, { order_id: orderId });

    if (existingRevenue.Revenue && existingRevenue.Revenue.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Plasa fee revenue already calculated for this order",
        data: { plasa_fee: "0.00" },
      });
    }

    const orderData = await hasuraClient.request<{
      Orders_by_pk: {
        id: string;
        total: string;
        service_fee: string;
        delivery_fee: string;
        shopper_id: string;
        shop_id: string;
      } | null;
    }>(GET_ORDER_DETAILS, { orderId });

    const order = orderData.Orders_by_pk;
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const systemConfigData = await hasuraClient.request<{
      System_configuratioins: Array<{ deliveryCommissionPercentage: string }>;
    }>(GET_SYSTEM_CONFIG);
    const deliveryCommissionPercentage = parseFloat(
      systemConfigData.System_configuratioins[0]
        ?.deliveryCommissionPercentage || "0"
    );

    const serviceFeeNum = parseFloat(order.service_fee || "0");
    const deliveryFeeNum = parseFloat(order.delivery_fee || "0");
    const plasaFee = RevenueCalculator.calculatePlasaFee(
      serviceFeeNum,
      deliveryFeeNum,
      deliveryCommissionPercentage
    );

    let shopperId: string | null = null;
    if (order.shopper_id) {
      const shopperData = await hasuraClient.request<{
        shoppers: Array<{ id: string }>;
      }>(GET_SHOPPER_ID, { user_id: order.shopper_id });
      if (shopperData.shoppers?.length > 0) {
        shopperId = shopperData.shoppers[0].id;
      }
    }

    if (plasaFee > 0) {
      await hasuraClient.request(CREATE_PLASA_FEE_REVENUE, {
        order_id: orderId,
        shop_id: order.shop_id,
        restaurant_id: null,
        shopper_id: shopperId,
        amount: plasaFee.toFixed(2),
        commission_percentage: deliveryCommissionPercentage.toString(),
        businessOrder_Id: null,
        Plasbusiness_id: null,
        reel_order_id: null,
        restaurant_order_id: null,
        products: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Plasa fee revenue calculated and recorded successfully",
      data: {
        plasa_fee: plasaFee.toFixed(2),
        commission_percentage: deliveryCommissionPercentage,
      },
    });
  } catch (error) {
    console.error("Error calculating plasa fee revenue:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to calculate plasa fee revenue",
    });
  }
}
