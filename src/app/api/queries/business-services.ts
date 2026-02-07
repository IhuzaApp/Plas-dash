import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_BUSINESS_SERVICES = gql`
  query GetBusinessServices($business_id: uuid!) {
    PlasBusinessProductsOrSerive(
      where: {
        Plasbusiness_id: { _eq: $business_id }
        store_id: { _is_null: true }
      }
      order_by: { created_at: desc }
    ) {
      id
      name
      Description
      Image
      price
      unit
      status
      query_id
      minimumOrders
      maxOrders
      delveryArea
      speciality
      created_at
      Plasbusiness_id
      store_id
      user_id
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

    // Get business_id from business account
    let business_id: string | null = null;
    try {
      const CHECK_BUSINESS_ACCOUNT = gql`
        query CheckBusinessAccount($user_id: uuid!) {
          business_accounts(where: { user_id: { _eq: $user_id } }, limit: 1) {
            id
            account_type
          }
        }
      `;
      const accountResult = await hasuraClient.request<{
        business_accounts: Array<{ id: string; account_type: string }>;
      }>(CHECK_BUSINESS_ACCOUNT, {
        user_id: user_id,
      });
      if (
        accountResult.business_accounts &&
        accountResult.business_accounts.length > 0
      ) {
        business_id = accountResult.business_accounts[0].id;
      }
    } catch (error) {
      console.error("Error fetching business account:", error);
    }

    if (!business_id) {
      return res.status(200).json({ services: [] });
    }

    const result = await hasuraClient.request<{
      PlasBusinessProductsOrSerive: Array<{
        id: string;
        name: string;
        Description: string | null;
        Image: string | null;
        price: string;
        unit: string;
        status: string;
        query_id: string | null;
        minimumOrders: string | null;
        maxOrders: string | null;
        delveryArea: string | null;
        speciality: string | null;
        created_at: string;
        Plasbusiness_id: string | null;
        store_id: string | null;
        user_id: string | null;
      }>;
    }>(GET_BUSINESS_SERVICES, {
      business_id: business_id,
    });

    return res.status(200).json({
      success: true,
      services: result.PlasBusinessProductsOrSerive || [],
    });
  } catch (error: any) {
    console.error("Error fetching business services:", error);
    return res.status(500).json({
      error: "Failed to fetch services",
      message: error.message,
    });
  }
}
