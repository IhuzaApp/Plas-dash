import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_BUSINESS_STORES = gql`
  query GetBusinessStores($business_id: uuid!) {
    business_stores(where: { business_id: { _eq: $business_id } }) {
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
  if (req.method !== "GET" && req.method !== "POST") {
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
      return res.status(200).json({ stores: [] });
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
    }>(GET_BUSINESS_STORES, { business_id });

    return res.status(200).json({ stores: result.business_stores || [] });
  } catch (error: any) {
    console.error("Error fetching business stores:", error);
    return res.status(500).json({
      error: "Failed to fetch business stores",
      message: error.message,
    });
  }
}
