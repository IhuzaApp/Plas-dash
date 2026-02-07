import type { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

// Define type for GraphQL response
interface OrderDetailsResponse {
  Orders_by_pk: {
    id: string;
    OrderID: string;
    created_at: string;
    updated_at: string;
    status: string;
    service_fee: string;
    delivery_fee: string;
    shop: {
      name: string;
      address: string;
      latitude: string;
      longitude: string;
    } | null;
    address: {
      latitude: string;
      longitude: string;
      street: string;
      city: string;
    } | null;
    Order_Items: Array<{
      id: string;
      product_id: string;
      quantity: number;
      price: string;
      Product: {
        id: string;
        image: string;
        final_price: string;
        ProductName: {
          id: string;
          name: string;
          description: string;
          barcode: string;
          sku: string;
          image: string;
          create_at: string;
        } | null;
      } | null;
    }>;
    Order_Items_aggregate: {
      aggregate: {
        count: number;
      };
    };
    orderedBy: {
      created_at: string;
      email: string;
      gender: string;
      id: string;
      is_active: boolean;
      name: string;
      password_hash: string;
      phone: string;
      profile_picture: string;
      updated_at: string;
      role: string;
    } | null;
    Shoppers: {
      id: string;
      name: string;
      email: string;
      phone: string;
      profile_picture: string;
    } | null;
    shop_id: string;
    shopper_id: string | null;
    total: string;
    user_id: string;
    voucher_code: string | null;
    combined_order_id: string | null;
  } | null;
}

// Define session type
interface UserSession {
  user?: {
    name?: string;
    email?: string;
  };
}

// Query to fetch regular order details by ID
const GET_ORDER_DETAILS = gql`
  query GetOrderDetails($orderId: uuid!) {
    Orders_by_pk(id: $orderId) {
      id
      OrderID
      created_at
      updated_at
      status
      service_fee
      delivery_fee
      shop: Shop {
        id
        name
        address
        image
        phone
        latitude
        longitude
        operating_hours
      }
      address: Address {
        id
        latitude
        longitude
        street
        city
        postal_code
        placeDetails
        created_at
        updated_at
        user_id
        is_default
      }
      Order_Items {
        id
        product_id
        quantity
        price
        Product {
          id
          image
          final_price
          measurement_unit
          ProductName {
            id
            name
            description
            barcode
            sku
            image
            create_at
          }
        }
      }
      Order_Items_aggregate {
        aggregate {
          count
        }
      }
      orderedBy {
        created_at
        email
        gender
        id
        is_active
        name
        password_hash
        phone
        profile_picture
        updated_at
        role
        Addresses {
          city
          created_at
          id
          is_default
          latitude
          longitude
          placeDetails
          postal_code
          street
          type
          updated_at
          user_id
        }
        is_guest
      }
      Shoppers {
        id
        name
        email
        phone
        profile_picture
      }
      shop_id
      shopper_id
      total
      user_id
      voucher_code
      combined_order_id
      Invoice {
        Proof
        created_at
        customer_id
        delivery_fee
        discount
        id
        invoice_items
        invoice_number
        order_id
        reel_order_id
        restarurant_order_id
        service_fee
        status
        subtotal
        tax
        total_amount
      }
    }
  }
`;

// Query to fetch reel order details by ID
const GET_REEL_ORDER_DETAILS = gql`
  query GetReelOrderDetails($orderId: uuid!) {
    reel_orders(where: { id: { _eq: $orderId } }) {
      id
      OrderID
      created_at
      updated_at
      status
      service_fee
      delivery_fee
      total
      quantity
      delivery_note
      Reel {
        id
        title
        description
        Price
        Product
        type
        video_url
        restaurant_id
        user_id
        Restaurant {
          id
          name
          location
          lat
          long
          created_at
          email
          is_active
          phone
          profile
          relatedTo
          tin
          ussd
          verified
        }
        category
        created_on
        delivery_time
        isLiked
        is_active
        likes
        restaurant_id
        shop_id
        user_id
      }
      user: User {
        id
        name
        email
        phone
        profile_picture
      }
      Shoppers {
        id
        name
        email
        phone
        profile_picture
      }
      address: Address {
        latitude
        longitude
        street
        city
        postal_code
        placeDetails
        created_at
        id
        updated_at
        user_id
      }
      assigned_at
      combined_order_id
      delivery_address_id
      delivery_photo_url
      delivery_time
      discount
      found
      reel_id
      shopper_id
      voucher_code
      user_id
    }
  }
`;

// Query to fetch restaurant order details by ID
const GET_RESTAURANT_ORDER_DETAILS = gql`
  query GetRestaurantOrderDetails($orderId: uuid!) {
    restaurant_orders(where: { id: { _eq: $orderId } }) {
      id
      OrderID
      created_at
      updated_at
      status
      delivery_fee
      total
      delivery_time
      delivery_notes
      discount
      found
      restaurant_id
      shopper_id
      user_id
      voucher_code
      assigned_at
      combined_order_id
      delivery_address_id
      delivery_photo_url
      Restaurant {
        id
        name
        location
        lat
        long
        phone
        logo
        email
        is_active
        tin
        ussd
        verified
        profile
        relatedTo
        created_at
      }
      orderedBy {
        id
        name
        phone
        email
        profile_picture
        gender
        password_hash
        updated_at
        created_at
        is_active
        role
      }
      address: Address {
        id
        street
        city
        postal_code
        latitude
        longitude
        placeDetails
        created_at
        updated_at
        user_id
        is_default
      }
      restaurant_order_items {
        id
        quantity
        price
        dish_id
        order_id
        created_at
        restaurant_dishes {
          id
          price
          preparingTime
          is_active
          ProductNames {
            name
            description
            image
          }
          dishes {
            name
            description
            image
            ingredients
            category
          }
        }
      }
      shopper {
        id
        name
        profile_picture
        email
        phone
        gender
        is_active
        password_hash
        role
        created_at
        updated_at
        orders: Orders_aggregate {
          aggregate {
            count
          }
        }
      }
    }
  }
`;

// Queries to fetch related orders by combined_order_id
const GET_RELATED_REGULAR_ORDERS = gql`
  query GetRelatedRegularOrders(
    $combinedOrderId: uuid!
    $currentOrderId: uuid!
  ) {
    Orders(
      where: {
        combined_order_id: { _eq: $combinedOrderId }
        id: { _neq: $currentOrderId }
      }
    ) {
      id
      OrderID
      created_at
      updated_at
      status
      service_fee
      delivery_fee
      combined_order_id
      shop: Shop {
        id
        name
        address
        image
        phone
        latitude
        longitude
      }
      address: Address {
        id
        latitude
        longitude
        street
        city
        postal_code
        placeDetails
      }
      Order_Items {
        id
        quantity
        price
        Product {
          id
          image
          final_price
          measurement_unit
          ProductName {
            name
            image
            sku
            barcode
            id
          }
        }
      }
      Order_Items_aggregate {
        aggregate {
          count
        }
      }
      orderedBy {
        id
        name
        phone
        profile_picture
        email
        gender
        is_active
        is_guest
        created_at
        Addresses {
          city
          created_at
          id
          is_default
          latitude
          longitude
          placeDetails
          postal_code
          street
          type
          updated_at
          user_id
        }
      }
      Shoppers {
        id
        name
        phone
        profile_picture
      }
      shop_id
      total
      user_id
      pin
      delivery_notes
      assigned_at
      Invoice {
        Proof
        created_at
        customer_id
        delivery_fee
        discount
        id
        invoice_items
        invoice_number
        order_id
        reel_order_id
        restarurant_order_id
        service_fee
        status
        subtotal
        tax
        total_amount
      }
    }
  }
`;

const GET_RELATED_REEL_ORDERS = gql`
  query GetRelatedReelOrders($combinedOrderId: uuid!, $currentOrderId: uuid!) {
    reel_orders(
      where: {
        combined_order_id: { _eq: $combinedOrderId }
        id: { _neq: $currentOrderId }
      }
    ) {
      id
      OrderID
      created_at
      updated_at
      status
      service_fee
      delivery_fee
      total
      quantity
      combined_order_id
      Reel {
        id
        title
        Price
        Product
        Restaurant {
          id
          name
          location
          lat
          long
        }
      }
      user: User {
        id
        name
        phone
        profile_picture
      }
      address: Address {
        latitude
        longitude
        street
        city
        placeDetails
      }
    }
  }
`;

const GET_RELATED_RESTAURANT_ORDERS = gql`
  query GetRelatedRestaurantOrders(
    $combinedOrderId: uuid!
    $currentOrderId: uuid!
  ) {
    restaurant_orders(
      where: {
        combined_order_id: { _eq: $combinedOrderId }
        id: { _neq: $currentOrderId }
      }
    ) {
      id
      OrderID
      created_at
      updated_at
      status
      delivery_fee
      total
      combined_order_id
      Restaurant {
        id
        name
        location
        lat
        long
      }
      orderedBy {
        id
        name
        phone
        profile_picture
      }
      address: Address {
        street
        city
        placeDetails
        latitude
        longitude
      }
      restaurant_order_items {
        id
        quantity
        price
        restaurant_dishes {
          id
          price
          dishes {
            name
            image
          }
        }
      }
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle only GET requests
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // Get orderId from query params
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      console.error("❌ [OrderDetails API] Invalid order ID:", {
        id,
        type: typeof id,
      });
      res.status(400).json({ error: "Missing or invalid order ID" });
      return;
    }

    // Get user session for authentication
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as UserSession | null;

    if (!session || !session.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Fetch order details from Hasura
    if (!hasuraClient) {
      res.status(500).json({ error: "Failed to initialize Hasura client" });
      return;
    }

    let orderData: any = null;
    let orderType: "regular" | "reel" | "restaurant" = "regular";

    try {
      // First try to fetch as a regular order
      const regularOrderData = await hasuraClient.request<OrderDetailsResponse>(
        GET_ORDER_DETAILS,
        {
          orderId: id,
        }
      );

      if (regularOrderData.Orders_by_pk) {
        orderData = regularOrderData.Orders_by_pk;
        orderType = "regular";
      } else {
        // If regular order not found, try reel order
        try {
          const reelOrderData = await hasuraClient.request<any>(
            GET_REEL_ORDER_DETAILS,
            {
              orderId: id,
            }
          );

          if (
            reelOrderData.reel_orders &&
            reelOrderData.reel_orders.length > 0
          ) {
            orderData = reelOrderData.reel_orders[0];
            orderType = "reel";
          } else {
            // If reel order not found, try restaurant order
            try {
              const restaurantOrderData = await hasuraClient.request<any>(
                GET_RESTAURANT_ORDER_DETAILS,
                {
                  orderId: id,
                }
              );

              if (
                restaurantOrderData.restaurant_orders &&
                restaurantOrderData.restaurant_orders.length > 0
              ) {
                orderData = restaurantOrderData.restaurant_orders[0];
                orderType = "restaurant";
              }
            } catch (restaurantError) {
              console.error("❌ [API] Error fetching restaurant order:", {
                error: restaurantError,
                message:
                  restaurantError instanceof Error
                    ? restaurantError.message
                    : "Unknown error",
                orderId: id,
              });
            }
          }
        } catch (reelError) {
          console.error("❌ [API] Error fetching reel order:", {
            error: reelError,
            message:
              reelError instanceof Error ? reelError.message : "Unknown error",
            orderId: id,
          });
        }
      }
    } catch (error) {
      console.error("❌ [API] Error fetching regular order:", {
        error: error,
        message: error instanceof Error ? error.message : "Unknown error",
        orderId: id,
      });

      // If regular order query fails, try reel order
      try {
        const reelOrderData = await hasuraClient.request<any>(
          GET_REEL_ORDER_DETAILS,
          {
            orderId: id,
          }
        );

        if (reelOrderData.reel_orders && reelOrderData.reel_orders.length > 0) {
          orderData = reelOrderData.reel_orders[0];
          orderType = "reel";
        } else {
          // If reel order not found, try restaurant order
          try {
            const restaurantOrderData = await hasuraClient.request<any>(
              GET_RESTAURANT_ORDER_DETAILS,
              {
                orderId: id,
              }
            );

            if (
              restaurantOrderData.restaurant_orders &&
              restaurantOrderData.restaurant_orders.length > 0
            ) {
              orderData = restaurantOrderData.restaurant_orders[0];
              orderType = "restaurant";
            }
          } catch (restaurantError) {
            console.error(
              "❌ [API] Error fetching restaurant order on retry:",
              {
                error: restaurantError,
                message:
                  restaurantError instanceof Error
                    ? restaurantError.message
                    : "Unknown error",
                orderId: id,
              }
            );
          }
        }
      } catch (reelError) {
        console.error("❌ [API] Error fetching reel order on retry:", {
          error: reelError,
          message:
            reelError instanceof Error ? reelError.message : "Unknown error",
          orderId: id,
        });
      }
    }

    if (!orderData) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // Format the order data for the frontend based on order type
    let formattedOrder: any;

    if (orderType === "regular") {
      // Handle regular orders

      const formattedOrderItems = orderData.Order_Items.map((item: any) => {
        const formattedItem = {
          id: item.id,
          name: item.Product?.ProductName?.name || "Unknown Product",
          quantity: item.quantity,
          price: parseFloat(item.price) || 0,
          measurement_unit: item.Product?.measurement_unit || null,
          barcode: item.Product?.ProductName?.barcode || null,
          sku: item.Product?.ProductName?.sku || null,
          productImage:
            item.Product?.ProductName?.image || item.Product?.image || null,
          product: {
            id: item.Product?.id || item.id, // Use Product.id from Products table, fallback to item.id
            name: item.Product?.ProductName?.name || "Unknown Product",
            image:
              item.Product?.ProductName?.image || item.Product?.image || null,
            final_price: item.Product?.final_price || item.price.toString(),
            measurement_unit: item.Product?.measurement_unit || null,
            barcode: item.Product?.ProductName?.barcode || null,
            sku: item.Product?.ProductName?.sku || null,
            ProductName: item.Product?.ProductName
              ? {
                  id: item.Product?.ProductName.id,
                  name: item.Product?.ProductName.name,
                  description: item.Product?.ProductName.description || "",
                  barcode: item.Product?.ProductName.barcode || "",
                  sku: item.Product?.ProductName.sku || "",
                  image: item.Product?.ProductName.image || null,
                  create_at: item.Product?.ProductName.create_at || "",
                }
              : null,
          },
        };

        return formattedItem;
      });

      // Calculate totals
      const subTotal = formattedOrderItems.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );

      const serviceFee = parseFloat(orderData.service_fee || "0");
      const deliveryFee = parseFloat(orderData.delivery_fee || "0");
      const totalEarnings = serviceFee + deliveryFee;

      formattedOrder = {
        id: orderData.id,
        OrderID: orderData.OrderID || orderData.id, // Add OrderID field
        createdAt: orderData.created_at,
        updatedAt: orderData.updated_at,
        status: orderData.status,
        orderType: "regular",
        shopName: orderData.shop?.name || "Unknown Shop",
        shopAddress: orderData.shop?.address || "No Address",
        shopLatitude: orderData.shop?.latitude
          ? parseFloat(orderData.shop.latitude)
          : null,
        shopLongitude: orderData.shop?.longitude
          ? parseFloat(orderData.shop.longitude)
          : null,
        address: orderData.address, // Include raw address object
        customerAddress: orderData.address
          ? `${orderData.address.street || ""}, ${orderData.address.city || ""}`
          : "No Address",
        customerLatitude: orderData.address?.latitude
          ? parseFloat(orderData.address.latitude)
          : null,
        customerLongitude: orderData.address?.longitude
          ? parseFloat(orderData.address.longitude)
          : null,
        items: formattedOrderItems,
        itemCount: orderData.Order_Items_aggregate?.aggregate?.count || 0,
        subTotal,
        serviceFee,
        deliveryFee,
        total: subTotal + serviceFee + deliveryFee,
        estimatedEarnings: totalEarnings,
        orderedBy: orderData.orderedBy, // Include orderedBy data (actual customer)
        assignedTo: orderData.Shoppers, // Include assignedTo data (shopper)
        customerId: orderData.orderedBy?.id, // Customer is ALWAYS from orderedBy
        shop: orderData.shop, // Include shop data
        combinedOrderId: orderData.combined_order_id,
      };
    } else if (orderType === "reel") {
      // Handle reel orders

      const serviceFee = parseFloat(orderData.service_fee || "0");
      const deliveryFee = parseFloat(orderData.delivery_fee || "0");
      const totalEarnings = serviceFee + deliveryFee;
      const reelPrice = parseFloat(orderData.Reel?.Price || "0");
      const quantity = parseInt(orderData.quantity || "1");
      const subTotal = reelPrice * quantity;

      formattedOrder = {
        id: orderData.id,
        OrderID: orderData.OrderID || orderData.id, // Add OrderID field
        createdAt: orderData.created_at,
        updatedAt: orderData.updated_at,
        status: orderData.status,
        orderType: "reel",
        shopName: orderData.Reel?.Restaurant?.name || "Reel Order",
        shopAddress:
          orderData.Reel?.Restaurant?.location || "From Reel Creator",
        shopLatitude: orderData.Reel?.Restaurant?.lat || null,
        shopLongitude: orderData.Reel?.Restaurant?.long || null,
        address: orderData.address, // Include raw address object
        customerAddress: orderData.address
          ? `${orderData.address.street || ""}, ${orderData.address.city || ""}`
          : "No Address",
        customerLatitude: orderData.address?.latitude
          ? parseFloat(orderData.address.latitude)
          : null,
        customerLongitude: orderData.address?.longitude
          ? parseFloat(orderData.address.longitude)
          : null,
        items: [
          {
            id: orderData.Reel?.id || orderData.id,
            name: orderData.Reel?.Product || "Reel Product",
            quantity: quantity,
            price: reelPrice,
          },
        ],
        itemCount: 1,
        subTotal,
        serviceFee,
        deliveryFee,
        total: parseFloat(orderData.total || "0"),
        estimatedEarnings: totalEarnings,
        reel: {
          ...orderData.Reel,
          restaurant_id: orderData.Reel?.restaurant_id,
          user_id: orderData.Reel?.user_id,
        },
        quantity: quantity,
        deliveryNote: orderData.delivery_note,
        deliveryNotes: orderData.delivery_note, // Add deliveryNotes for compatibility
        customerName: orderData.user?.name,
        customerPhone: orderData.user?.phone,
        user: orderData.user, // Include full user data
        orderedBy: orderData.user, // Add orderedBy for compatibility
        assignedTo: orderData.Shoppers, // Include assignedTo data (shopper)
        customerId: orderData.user?.id, // Add customerId for compatibility
        discount: orderData.discount || 0, // Add discount field
        deliveryPhotoUrl: orderData.delivery_photo_url, // Add delivery photo URL
        combinedOrderId: orderData.combined_order_id,
      };
    } else if (orderType === "restaurant") {
      // Handle restaurant orders

      const deliveryFee = parseFloat(orderData.delivery_fee || "0");
      const totalEarnings = deliveryFee; // Restaurant orders don't have service fee

      // Format dish items (schema: restaurant_order_items -> restaurant_dishes; name/description/image from ProductNames or dishes)
      const formattedDishItems = orderData.restaurant_order_items.map(
        (dishOrder: any) => {
          const rd = dishOrder.restaurant_dishes;
          const name =
            rd?.ProductNames?.name ?? rd?.dishes?.name ?? "Unknown Dish";
          const description =
            rd?.ProductNames?.description ?? rd?.dishes?.description ?? null;
          const image = rd?.ProductNames?.image ?? rd?.dishes?.image ?? null;

          return {
            id: dishOrder.id,
            name,
            quantity: dishOrder.quantity,
            price: parseFloat(dishOrder.price) || 0,
            description,
            image,
            category: rd?.dishes?.category ?? null,
            ingredients: rd?.dishes?.ingredients ?? null,
            preparingTime: rd?.preparingTime || null,
          };
        }
      );

      // Calculate subtotal from dish orders
      const subTotal = formattedDishItems.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );

      formattedOrder = {
        id: orderData.id,
        OrderID: orderData.OrderID || orderData.id,
        createdAt: orderData.created_at,
        updatedAt: orderData.updated_at,
        status: orderData.status,
        orderType: "restaurant",
        shopName: orderData.Restaurant?.name || "Unknown Restaurant",
        shopAddress: orderData.Restaurant?.location || "No Address",
        shopLatitude: orderData.Restaurant?.lat
          ? parseFloat(orderData.Restaurant.lat)
          : null,
        shopLongitude: orderData.Restaurant?.long
          ? parseFloat(orderData.Restaurant.long)
          : null,
        address: orderData.address,
        customerAddress: orderData.address
          ? `${orderData.address.street || ""}, ${orderData.address.city || ""}`
          : "No Address",
        customerLatitude: orderData.address?.latitude
          ? parseFloat(orderData.address.latitude)
          : null,
        customerLongitude: orderData.address?.longitude
          ? parseFloat(orderData.address.longitude)
          : null,
        items: formattedDishItems,
        itemCount: formattedDishItems.length,
        subTotal,
        serviceFee: 0, // Restaurant orders don't have service fee
        deliveryFee,
        total: parseFloat(orderData.total || "0"),
        estimatedEarnings: totalEarnings,
        restaurant: orderData.Restaurant,
        deliveryNote: orderData.delivery_notes,
        deliveryNotes: orderData.delivery_notes,
        customerName: orderData.orderedBy?.name,
        customerPhone: orderData.orderedBy?.phone,
        user: orderData.orderedBy,
        orderedBy: orderData.orderedBy,
        assignedTo: orderData.shopper,
        customerId: orderData.orderedBy?.id,
        discount: orderData.discount || 0,
        deliveryPhotoUrl: orderData.delivery_photo_url,
        deliveryTime: orderData.delivery_time,
        combinedOrderId: orderData.combined_order_id,
      };
    }

    // Fetch related orders if this is part of a combined order
    let relatedOrders: any[] = [];
    if (orderData.combined_order_id) {
      try {
        const combinedOrderId = orderData.combined_order_id;

        // Run all queries in parallel
        const [relatedRegular, relatedReel, relatedRestaurant] =
          await Promise.all([
            hasuraClient.request<any>(GET_RELATED_REGULAR_ORDERS, {
              combinedOrderId,
              currentOrderId: id,
            }),
            hasuraClient.request<any>(GET_RELATED_REEL_ORDERS, {
              combinedOrderId,
              currentOrderId: id,
            }),
            hasuraClient.request<any>(GET_RELATED_RESTAURANT_ORDERS, {
              combinedOrderId,
              currentOrderId: id,
            }),
          ]);

        // Process Regular Orders
        if (relatedRegular?.Orders) {
          const processedRegular = relatedRegular.Orders.map((order: any) => {
            const items =
              order.Order_Items?.map((item: any) => ({
                id: item.id,
                name: item.Product?.ProductName?.name || "Unknown Product",
                quantity: item.quantity,
                price: parseFloat(item.price) || 0,
                measurement_unit: item.Product?.measurement_unit || null,
                productImage:
                  item.Product?.ProductName?.image ||
                  item.Product?.image ||
                  null,
                product: {
                  id: item.Product?.id || item.id, // Use Product.id from Products table
                  name: item.Product?.ProductName?.name || "Unknown Product",
                  image:
                    item.Product?.ProductName?.image ||
                    item.Product?.image ||
                    null,
                  final_price:
                    item.Product?.final_price || item.price.toString(),
                  measurement_unit: item.Product?.measurement_unit || null,
                  barcode: item.Product?.ProductName?.barcode || null,
                  sku: item.Product?.ProductName?.sku || null,
                  ProductName: item.Product?.ProductName
                    ? {
                        id: item.Product?.ProductName.id,
                        name: item.Product?.ProductName.name,
                        description:
                          item.Product?.ProductName.description || "",
                        barcode: item.Product?.ProductName.barcode || "",
                        sku: item.Product?.ProductName.sku || "",
                        image: item.Product?.ProductName.image || null,
                        create_at: item.Product?.ProductName.create_at || "",
                      }
                    : null,
                },
              })) || [];

            const subTotal = items.reduce(
              (sum: number, item: any) => sum + item.price * item.quantity,
              0
            );

            return {
              id: order.id,
              OrderID: order.OrderID || order.id,
              orderType: "regular",
              status: order.status,
              shopName: order.shop?.name || "Unknown Shop",
              shopAddress: order.shop?.address,
              shop: order.shop, // Full shop object
              customerId: order.orderedBy?.id,
              customerPhone: order.orderedBy?.phone,
              customerName: order.orderedBy?.name,
              address: order.address,
              orderedBy: order.orderedBy,
              total: parseFloat(order.total || subTotal.toString()), // Use total if available or calc
              items: items,
              combinedOrderId: order.combined_order_id,
              Invoice: order.Invoice,
            };
          });
          relatedOrders = [...relatedOrders, ...processedRegular];
        }

        // Process Reel Orders
        if (relatedReel?.reel_orders) {
          const processedReel = relatedReel.reel_orders.map((order: any) => {
            return {
              id: order.id,
              OrderID: order.OrderID || order.id,
              orderType: "reel",
              status: order.status,
              shopName: order.Reel?.Restaurant?.name || "Reel Order",
              shopAddress: order.Reel?.Restaurant?.location,
              shop: order.Reel?.Restaurant
                ? {
                    id: order.Reel.Restaurant.id,
                    name: order.Reel.Restaurant.name,
                    address: order.Reel.Restaurant.location,
                    phone: order.Reel.Restaurant.phone,
                    image: null, // Add image field if available
                  }
                : null,
              customerId: order.user?.id,
              customerPhone: order.user?.phone,
              customerName: order.user?.name,
              total: parseFloat(order.total || "0"),
              items: [
                {
                  id: order.id,
                  name: order.Reel?.Product || "Reel Product",
                  quantity: order.quantity,
                  price: parseFloat(order.Reel?.Price || "0"),
                  productImage: null, // Reel doesn't have a direct product image easily accessible here
                },
              ],
              combinedOrderId: order.combined_order_id,
            };
          });
          relatedOrders = [...relatedOrders, ...processedReel];
        }

        // Process Restaurant Orders
        if (relatedRestaurant?.restaurant_orders) {
          const processedRestaurant = relatedRestaurant.restaurant_orders.map(
            (order: any) => {
              const items =
                order.restaurant_order_items?.map((item: any) => {
                  const rd = item.restaurant_dishes;
                  const dish = rd?.dishes;

                  return {
                    id: item.id,
                    name: dish?.name || rd?.name || "Dish",
                    quantity: item.quantity,
                    price: parseFloat(item.price) || 0,
                    productImage: dish?.image || rd?.image || null,
                  };
                }) || [];

              return {
                id: order.id,
                OrderID: order.OrderID || order.id,
                orderType: "restaurant",
                status: order.status,
                shopName: order.Restaurant?.name || "Restaurant",
                shopAddress: order.Restaurant?.location,
                shop: order.Restaurant
                  ? {
                      id: order.Restaurant.id,
                      name: order.Restaurant.name,
                      address: order.Restaurant.location,
                      phone: order.Restaurant.phone,
                      image: (order.Restaurant as any).logo,
                    }
                  : null,
                customerId: order.orderedBy?.id,
                customerPhone: order.orderedBy?.phone,
                customerName: order.orderedBy?.name,
                total: parseFloat(order.total || "0"),
                items: items,
                combinedOrderId: order.combined_order_id,
              };
            }
          );
          relatedOrders = [...relatedOrders, ...processedRestaurant];
        }
      } catch (err) {
        console.error("❌ [API] Error fetching related orders:", err);
        // Don't fail the whole request if related orders fail
      }
    }

    // Add related orders to the response and calculate aggregates
    if (formattedOrder) {
      formattedOrder.combinedOrders = relatedOrders;

      // specific aggregations for combined orders
      if (orderData.combined_order_id && relatedOrders.length > 0) {
        // Set order type to combined when there are combined orders
        formattedOrder.orderType = "combined";

        // Create comprehensive lists including the main order and all related orders
        const allOrders = [formattedOrder, ...relatedOrders];

        // Extract IDs and Names
        formattedOrder.orderIds = allOrders.map((o) => o.id).filter(Boolean);
        formattedOrder.orderIDs = allOrders
          .map((o) => o.OrderID)
          .filter(Boolean);
        formattedOrder.shopNames = Array.from(
          new Set(allOrders.map((o) => o.shopName).filter(Boolean))
        );

        // Update shop name to indicate multiple stores if applicable
        if (formattedOrder.shopNames.length > 1) {
          formattedOrder.shopName = `${
            formattedOrder.shopNames.length
          } Stores: ${formattedOrder.shopNames.join(", ")}`;
        }
      }
    }

    res.status(200).json({
      success: true,
      order: formattedOrder,
    });
  } catch (error) {
    console.error("❌ [API] Error fetching order details:", {
      error: error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      orderId: req.query.id,
    });
    res.status(500).json({ error: "Failed to fetch order details" });
  }
}
