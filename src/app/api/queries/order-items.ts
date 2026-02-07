import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_ORDER_ITEMS = gql`
  query GetOrderItems {
    Order_Items {
      id
      order_id
      product_id
      quantity
      price
      created_at
    }
  }
`;

interface OrderItemsResponse {
  Order_Items: Array<{
    id: string;
    order_id: string;
    product_id: string;
    quantity: number;
    price: string;
    created_at: string;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const data = await hasuraClient.request<OrderItemsResponse>(
      GET_ORDER_ITEMS
    );
    res.status(200).json({ order_items: data.Order_Items });
  } catch (error) {
    console.error("Error fetching order items:", error);
    res.status(500).json({ error: "Failed to fetch order items" });
  }
}
