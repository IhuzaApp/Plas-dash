import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

const INSERT_PRODUCT_RATING = gql`
  mutation InsertProductRating(
    $comment: String = ""
    $ratings: String = ""
    $product_id: uuid = ""
    $user_id: uuid = ""
    $feedback: String = ""
  ) {
    insert_BusinessProductRatings(
      objects: {
        comment: $comment
        ratings: $ratings
        product_id: $product_id
        user_id: $user_id
        feedback: $feedback
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
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions as any);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { product_id, ratings, comment, feedback } = req.body;
    if (!product_id) {
      return res.status(400).json({ error: "product_id is required" });
    }

    if (!hasuraClient) {
      return res.status(500).json({ error: "Server not configured" });
    }

    const result = await hasuraClient.request(INSERT_PRODUCT_RATING, {
      product_id,
      user_id: session.user.id,
      ratings: ratings?.toString() ?? "",
      comment: comment ?? "",
      feedback: feedback ?? "",
    });

    return res.status(201).json({ success: true, ...result });
  } catch (error: any) {
    console.error("[product-rating] Error:", error);
    return res.status(500).json({
      error: "Failed to submit rating",
      details: error.message,
    });
  }
}
