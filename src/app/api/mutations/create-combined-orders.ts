import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { v4 as uuidv4 } from "uuid";
import { notifyNewOrderToSlack } from "../../../src/lib/slackOrderNotifier";

// Generate a random 2-digit PIN (00-99)
function generateOrderPin(): string {
  return Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, "0");
}

// Fetch active cart with its items for a specific store
const GET_CART_WITH_ITEMS = gql`
  query GetCartWithItems($user_id: uuid!, $shop_id: uuid!) {
    Carts(
      where: {
        user_id: { _eq: $user_id }
        shop_id: { _eq: $shop_id }
        is_active: { _eq: true }
      }
      limit: 1
    ) {
      id
      Cart_Items {
        product_id
        quantity
        price
        Product {
          price
          final_price
        }
      }
      Shop {
        id
        name
        latitude
        longitude
      }
    }
  }
`;

// Fetch current stock for products
const GET_PRODUCTS_BY_IDS = gql`
  query GetProductsByIds($ids: [uuid!]!) {
    Products(where: { id: { _in: $ids } }) {
      id
      quantity
    }
  }
`;

// Fetch delivery address and user phone for Slack notification
const GET_ADDRESS_AND_USER = gql`
  query GetAddressAndUser($address_id: uuid!, $user_id: uuid!) {
    Addresses_by_pk(id: $address_id) {
      street
      city
      postal_code
    }
    User_by_pk(id: $user_id) {
      phone
    }
  }
`;

// Create a new order with combined_order_id
const CREATE_ORDER = gql`
  mutation CreateOrder(
    $user_id: uuid!
    $shop_id: uuid!
    $delivery_address_id: uuid!
    $total: String!
    $status: String!
    $service_fee: String!
    $delivery_fee: String!
    $discount: String
    $voucher_code: String
    $delivery_time: timestamptz!
    $delivery_notes: String
    $pin: String!
    $combined_order_id: uuid
  ) {
    insert_Orders_one(
      object: {
        user_id: $user_id
        shop_id: $shop_id
        delivery_address_id: $delivery_address_id
        total: $total
        status: $status
        service_fee: $service_fee
        delivery_fee: $delivery_fee
        discount: $discount
        voucher_code: $voucher_code
        shopper_id: null
        delivery_time: $delivery_time
        delivery_notes: $delivery_notes
        pin: $pin
        combined_order_id: $combined_order_id
      }
    ) {
      id
      OrderID
      pin
      combined_order_id
    }
  }
`;

// Create order items in bulk
const CREATE_ORDER_ITEMS = gql`
  mutation CreateOrderItems($objects: [Order_Items_insert_input!]!) {
    insert_Order_Items(objects: $objects) {
      affected_rows
    }
  }
`;

// Delete cart items
const DELETE_CART_ITEMS = gql`
  mutation DeleteCartItems($cart_id: uuid!) {
    delete_Cart_Items(where: { cart_id: { _eq: $cart_id } }) {
      affected_rows
    }
  }
`;

// Delete cart
const DELETE_CART = gql`
  mutation DeleteCart($cart_id: uuid!) {
    delete_Carts_by_pk(id: $cart_id) {
      id
    }
  }
`;

interface StoreCheckoutData {
  store_id: string;
  delivery_fee: string;
  service_fee: string;
  discount?: string;
  voucher_code?: string;
}

interface SessionUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

interface Session {
  user: SessionUser;
  expires: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as Session | null;

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const user_id = session.user.id;
    const {
      stores,
      delivery_address_id,
      delivery_time,
      delivery_notes,
      payment_method,
      payment_method_id,
    } = req.body;

    // Validate required fields
    if (!stores || !Array.isArray(stores) || stores.length === 0) {
      return res.status(400).json({
        error: "Missing required field: stores (must be a non-empty array)",
      });
    }

    if (!delivery_address_id || !delivery_time) {
      return res.status(400).json({
        error: "Missing required fields: delivery_address_id, delivery_time",
      });
    }

    // Generate a single combined_order_id and PIN for all orders
    const combinedOrderId = uuidv4();
    const sharedPin = generateOrderPin(); // Single PIN for all combined orders
    const createdOrders: Array<{
      id: string;
      OrderID?: string;
      pin: string;
      shop_id: string;
      total: number;
    }> = [];
    const storeNames: string[] = [];
    let totalUnits = 0;

    let grandTotal = 0;

    // Process each store's cart
    for (const storeData of stores as StoreCheckoutData[]) {
      const { store_id, delivery_fee, service_fee, discount, voucher_code } =
        storeData;

      if (!store_id || !delivery_fee || !service_fee) {
        throw new Error(
          `Invalid store data: missing store_id, delivery_fee, or service_fee`
        );
      }

      // 1. Load cart and items for this store
      const cartData = await hasuraClient.request<{
        Carts: Array<{
          id: string;
          Cart_Items: Array<{
            product_id: string;
            quantity: number;
            price: string;
            Product: {
              price: string;
              final_price: string;
            };
          }>;
          Shop: {
            id: string;
            name: string;
            latitude: string;
            longitude: string;
          } | null;
        }>;
      }>(GET_CART_WITH_ITEMS, { user_id, shop_id: store_id });

      const cart = cartData.Carts[0];
      if (!cart) {
        throw new Error(`No active cart found for store ${store_id}`);
      }

      const items = cart.Cart_Items;
      if (items.length === 0) {
        throw new Error(`Cart is empty for store ${store_id}`);
      }

      // 2. Validate product availability
      const productIds = items.map((i) => i.product_id);
      const prodData = await hasuraClient.request<{
        Products: Array<{ id: string; quantity: number }>;
      }>(GET_PRODUCTS_BY_IDS, { ids: productIds });

      const stockMap = new Map(
        prodData.Products.map((p) => [p.id, p.quantity])
      );

      for (const item of items) {
        const available = stockMap.get(item.product_id);
        if (available === undefined) {
          throw new Error(`Product ${item.product_id} not found`);
        }
        if (item.quantity > available) {
          throw new Error(
            `Insufficient stock for product ${item.product_id} in store ${store_id}`
          );
        }
      }

      // 3. Calculate actual total (base price for order creation)
      const actualTotal = items.reduce((sum, item) => {
        const price = parseFloat(item.Product.price);
        return sum + price * item.quantity;
      }, 0);

      // 4. Create order record with shared PIN and combined_order_id
      const orderRes = await hasuraClient.request<{
        insert_Orders_one: {
          id: string;
          OrderID?: string;
          pin: string;
          combined_order_id: string;
        };
      }>(CREATE_ORDER, {
        user_id,
        shop_id: store_id,
        delivery_address_id,
        total: actualTotal.toFixed(2),
        status: "PENDING",
        service_fee,
        delivery_fee,
        discount: discount ?? null,
        voucher_code: voucher_code ?? null,
        delivery_time,
        delivery_notes: delivery_notes ?? null,
        pin: sharedPin, // Use the same PIN for all combined orders
        combined_order_id: combinedOrderId,
      });

      const orderId = orderRes.insert_Orders_one.id;
      const orderID = orderRes.insert_Orders_one.OrderID;

      if (cart.Shop?.name) storeNames.push(cart.Shop.name);
      totalUnits += items.reduce((sum, i) => sum + i.quantity, 0);

      // 5. Create order items
      const orderItems = items.map((i) => ({
        order_id: orderId,
        product_id: i.product_id,
        quantity: i.quantity,
        price: i.Product.price, // Use base price (what we pay to shop)
      }));
      await hasuraClient.request(CREATE_ORDER_ITEMS, { objects: orderItems });

      // 6. Delete cart items
      await hasuraClient.request(DELETE_CART_ITEMS, { cart_id: cart.id });

      // 7. Delete the cart
      await hasuraClient.request(DELETE_CART, { cart_id: cart.id });

      // Track created order
      const orderTotal =
        actualTotal +
        parseFloat(service_fee || "0") +
        parseFloat(delivery_fee || "0");
      createdOrders.push({
        id: orderId,
        OrderID: orderID,
        pin: sharedPin, // Use the shared PIN
        shop_id: store_id,
        total: orderTotal,
      });

      grandTotal += orderTotal;
    }

    // Fetch delivery address and customer phone for Slack
    let customerAddress = "";
    let customerPhone = "";
    try {
      const addrRes = await hasuraClient.request<{
        Addresses_by_pk: {
          street: string;
          city: string;
          postal_code: string;
        } | null;
        User_by_pk: { phone: string | null } | null;
      }>(GET_ADDRESS_AND_USER, {
        address_id: delivery_address_id,
        user_id,
      });
      if (addrRes.Addresses_by_pk) {
        const a = addrRes.Addresses_by_pk;
        customerAddress = [a.street, a.city, a.postal_code]
          .filter(Boolean)
          .join(", ");
      }
      if (addrRes.User_by_pk?.phone) customerPhone = addrRes.User_by_pk.phone;
    } catch (_) {
      // non-blocking
    }

    const firstOrder = createdOrders[0];
    const displayOrderID = firstOrder?.OrderID ?? combinedOrderId;

    // Send Slack notification for the combined order
    void notifyNewOrderToSlack({
      id: combinedOrderId,
      orderID: displayOrderID,
      total: grandTotal,
      orderType: "combined",
      storeName: storeNames.length ? storeNames.join(", ") : undefined,
      units: totalUnits,
      customerPhone: customerPhone || undefined,
      customerAddress: customerAddress || undefined,
      deliveryTime: delivery_time,
    });

    // Return success response with all created orders
    return res.status(200).json({
      success: true,
      combined_order_id: combinedOrderId,
      orders: createdOrders,
      grand_total: grandTotal,
      message: `Successfully created ${createdOrders.length} orders with combined_order_id`,
    });
  } catch (error: any) {
    console.error("Error creating combined orders:", error);
    return res.status(500).json({
      error: "Failed to create combined orders",
      message: error.message,
    });
  }
}
