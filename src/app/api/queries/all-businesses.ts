import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_ALL_BUSINESSES = gql`
  query GetAllBusinesses($exclude_business_id: uuid) {
    business_accounts(
      where: {
        account_type: { _neq: "personal" }
        id: { _neq: $exclude_business_id }
        status: { _neq: "rejected" }
      }
      order_by: { created_at: desc }
    ) {
      id
      business_name
      business_email
      business_phone
      business_location
      account_type
      face_image
      status
      created_at
      updated_at
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

    // Get current user's business_id to exclude it
    let exclude_business_id: string | null = null;
    try {
      const CHECK_BUSINESS_ACCOUNT = gql`
        query CheckBusinessAccount($user_id: uuid!) {
          business_accounts(where: { user_id: { _eq: $user_id } }, limit: 1) {
            id
          }
        }
      `;
      const accountResult = await hasuraClient.request<{
        business_accounts: Array<{ id: string }>;
      }>(CHECK_BUSINESS_ACCOUNT, {
        user_id: user_id,
      });
      if (
        accountResult.business_accounts &&
        accountResult.business_accounts.length > 0
      ) {
        exclude_business_id = accountResult.business_accounts[0].id;
      }
    } catch (error) {
      console.error("Error fetching current business account:", error);
    }

    const result = await hasuraClient.request<{
      business_accounts: Array<{
        id: string;
        business_name: string | null;
        business_email: string | null;
        business_phone: string | null;
        business_location: string | null;
        account_type: string;
        face_image: string | null;
        status: string;
        created_at: string;
        updated_at: string;
        user_id: string;
      }>;
    }>(GET_ALL_BUSINESSES, {
      exclude_business_id: exclude_business_id || undefined,
    });

    return res.status(200).json({
      success: true,
      businesses: result.business_accounts || [],
    });
  } catch (error: any) {
    console.error("Error fetching all businesses:", error);
    return res.status(500).json({
      error: "Failed to fetch businesses",
      message: error.message,
    });
  }
}
