import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_BUSINESS_STORE = gql`
  query GetBusinessStore($store_id: uuid!, $business_id: uuid!) {
    business_stores(
      where: { id: { _eq: $store_id }, business_id: { _eq: $business_id } }
    ) {
      id
      name
      description
      address
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

interface SessionUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

interface Session {
  user: SessionUser;
  expires: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as Session | null;

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const user_id = session.user.id;
    const { storeId } = req.query;

    if (!storeId || typeof storeId !== "string") {
      return res.status(400).json({ error: "Store ID is required" });
    }

    // First, get the business account for this user
    const businessAccountQuery = gql`
      query GetBusinessAccount($user_id: uuid!) {
        business_accounts(where: { user_id: { _eq: $user_id } }) {
          id
        }
      }
    `;

    const businessAccountResult = await hasuraClient.request<{
      business_accounts: Array<{ id: string }>;
    }>(businessAccountQuery, { user_id });

    if (
      !businessAccountResult.business_accounts ||
      businessAccountResult.business_accounts.length === 0
    ) {
      return res.status(404).json({ error: "Business account not found" });
    }

    const business_id = businessAccountResult.business_accounts[0].id;

    const result = await hasuraClient.request<{
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
    }>(GET_BUSINESS_STORE, { store_id: storeId, business_id });

    if (!result.business_stores || result.business_stores.length === 0) {
      return res.status(404).json({ error: "Store not found" });
    }

    return res.status(200).json({ store: result.business_stores[0] });
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to fetch business store",
      message: error.message,
    });
  }
}
