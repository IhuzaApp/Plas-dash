import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_PRODUCT_RATINGS = gql`
  query getBussinessRatings($product_id: uuid!) {
    BusinessProductRatings(
      where: { product_id: { _eq: $product_id } }
      order_by: { created_at: desc }
    ) {
      id
      comment
      created_at
      feedback
      product_id
      ratings
      user_id
      Users {
        id
        name
        email
      }
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { productId } = req.query;
  if (!productId || typeof productId !== "string") {
    return res.status(400).json({ error: "productId is required" });
  }

  try {
    if (!hasuraClient) {
      return res.status(500).json({ error: "Server not configured" });
    }

    const data = await hasuraClient.request<{
      BusinessProductRatings: Array<{
        id: string;
        comment: string | null;
        created_at: string;
        feedback: string | null;
        product_id: string;
        ratings: string | null;
        user_id: string;
        Users: { id: string; name: string | null; email: string | null } | null;
      }>;
    }>(GET_PRODUCT_RATINGS, { product_id: productId });

    return res.status(200).json({ ratings: data.BusinessProductRatings || [] });
  } catch (error: any) {
    console.error("[product-ratings] Error:", error);
    return res.status(500).json({
      error: "Failed to fetch ratings",
      details: error.message,
    });
  }
}
