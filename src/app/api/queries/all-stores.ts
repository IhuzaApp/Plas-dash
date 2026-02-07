import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_ALL_STORES = gql`
  query GetAllStores {
    business_stores(where: { is_active: { _eq: true } }) {
      id
      name
      description
      category_id
      image
      latitude
      longitude
      operating_hours
      is_active
      created_at
      business_id
    }
  }
`;

interface StoresResponse {
  business_stores: Array<{
    id: string;
    name: string;
    description: string | null;
    category_id: string | null;
    image: string | null;
    latitude: string | null;
    longitude: string | null;
    operating_hours: any;
    is_active: boolean;
    created_at: string;
    business_id: string;
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

    const data = await hasuraClient.request<StoresResponse>(GET_ALL_STORES);
    res.status(200).json({ stores: data.business_stores || [] });
  } catch (error: any) {
    console.error("Error fetching stores:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch stores", message: error.message });
  }
}
