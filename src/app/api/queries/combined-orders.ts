import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

// GraphQL query to fetch all orders with the same combined_order_id
const GET_COMBINED_ORDERS = gql`
  query GetCombinedOrders($combined_order_id: uuid!) {
    Orders(where: { combined_order_id: { _eq: $combined_order_id } }) {
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { combined_order_id } = req.query;
  if (
    !combined_order_id ||
    (Array.isArray(combined_order_id) && combined_order_id.length === 0)
  ) {
    return res.status(400).json({ error: "Missing combined_order_id" });
  }

  // Ensure we have a single string ID
  const combinedOrderId = Array.isArray(combined_order_id)
    ? combined_order_id[0]
    : combined_order_id;

  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const data = await hasuraClient.request<{
      Orders: Array<any>;
    }>(GET_COMBINED_ORDERS, { combined_order_id: combinedOrderId });

    // Return empty array when no regular Orders (e.g. combined batch is reel/restaurant only)
    const orders = data.Orders ?? [];
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch combined orders",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
