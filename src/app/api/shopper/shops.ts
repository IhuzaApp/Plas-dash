import type { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GetShops = gql`
  query GetShopLocations {
    Shops {
      id
      name
      latitude
      longitude
      is_active
      logo
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const data = await hasuraClient.request<{
      Shops: Array<{
        id: string;
        name: string;
        latitude: string;
        longitude: string;
        is_active: boolean;
        logo?: string | null;
      }>;
    }>(GetShops);
    res.status(200).json(data.Shops);
  } catch (error) {
    console.error("Error fetching shops:", error);
    res.status(500).json({ error: "Failed to fetch shops" });
  }
}
