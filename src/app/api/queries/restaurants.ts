import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_RESTAURANTS = gql`
  query GetRestaurants {
    Restaurants {
      id
      name
      email
      phone
      location
      lat
      long
      profile
      verified
      created_at
    }
  }
`;

interface RestaurantsResponse {
  Restaurants: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    lat?: string;
    long?: string;
    profile?: string;
    verified?: boolean;
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

    const data = await hasuraClient.request<RestaurantsResponse>(
      GET_RESTAURANTS
    );
    res.status(200).json({ restaurants: data.Restaurants });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
}
