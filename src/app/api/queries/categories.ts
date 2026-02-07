import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_CATEGORIES = gql`
  query GetCategories {
    Categories {
      id
      name
      description
      created_at
      image
      is_active
    }
  }
`;

interface CategoriesResponse {
  Categories: Array<{
    id: string;
    name: string;
    description: string;
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
    const data = await hasuraClient.request<CategoriesResponse>(GET_CATEGORIES);

    if (!data || !data.Categories) {
      return res.status(200).json({ categories: [] });
    }

    res.status(200).json({ categories: data.Categories });
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to fetch categories",
      details: error?.message,
      response: error?.response,
      request: error?.request,
    });
  }
}
