import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_RESTAURANT_BY_ID = gql`
  query GetRestaurantById($id: uuid!) {
    Restaurants_by_pk(id: $id) {
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

interface RestaurantResponse {
  Restaurants_by_pk: {
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
  } | null;
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

    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Restaurant ID is required" });
    }

    const data = await hasuraClient.request<RestaurantResponse>(
      GET_RESTAURANT_BY_ID,
      { id }
    );

    if (!data.Restaurants_by_pk) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    res.status(200).json({ restaurant: data.Restaurants_by_pk });
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    res.status(500).json({ error: "Failed to fetch restaurant" });
  }
}
