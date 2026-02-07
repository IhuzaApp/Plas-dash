import { NextApiRequest, NextApiResponse } from "next";
import { gql } from "graphql-request";
import { hasuraClient } from "../../../src/lib/hasuraClient";

const GET_SHOP_RATINGS = gql`
  query getShopRatings {
    Ratings(where: { Order: { shop_id: { _is_null: false } } }) {
      rating
      Order {
        shop_id
        Shop {
          id
          name
        }
      }
    }
  }
`;

interface RatingWithOrder {
  rating: number;
  Order: {
    shop_id: string;
    Shop: {
      id: string;
      name: string;
    };
  };
}

interface ShopRatingsResponse {
  Ratings: RatingWithOrder[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const data = await hasuraClient.request<ShopRatingsResponse>(
      GET_SHOP_RATINGS
    );

    // Aggregate ratings by shop_id
    const shopRatingsMap: Record<
      string,
      { totalRating: number; count: number; shopName?: string }
    > = {};

    data.Ratings.forEach((ratingData) => {
      if (ratingData.Order && ratingData.Order.shop_id) {
        const shopId = ratingData.Order.shop_id;

        if (!shopRatingsMap[shopId]) {
          shopRatingsMap[shopId] = {
            totalRating: 0,
            count: 0,
            shopName: ratingData.Order.Shop?.name,
          };
        }

        shopRatingsMap[shopId].totalRating += ratingData.rating;
        shopRatingsMap[shopId].count += 1;
      }
    });

    // Convert to array with averages
    const ratings = Object.keys(shopRatingsMap).map((shop_id) => ({
      shop_id,
      averageRating:
        shopRatingsMap[shop_id].totalRating / shopRatingsMap[shop_id].count,
      totalRatings: shopRatingsMap[shop_id].count,
      shopName: shopRatingsMap[shop_id].shopName,
    }));

    return res.status(200).json({ ratings });
  } catch (error: any) {
    console.error("Error fetching shop ratings:", error);
    return res.status(500).json({
      error: "Failed to fetch shop ratings",
      details: error.message,
    });
  }
}
