import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_CART_ITEMS = gql`
  query GetCartItems {
    Cart_Items {
      id
      cart_id
      product_id
      quantity
      created_at
      price
      updated_at
    }
  }
`;

interface CartItemsResponse {
  Cart_Items: Array<{
    id: string;
    cart_id: string;
    product_id: string;
    quantity: number;
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
    const data = await hasuraClient.request<CartItemsResponse>(GET_CART_ITEMS);
    res.status(200).json({ cart_items: data.Cart_Items });
  } catch (error) {
    console.error("Error fetching cart items:", error);
    res.status(500).json({ error: "Failed to fetch cart items" });
  }
}
