import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_SHOPPER_BY_USER_ID = gql`
  query GetShopperByUserId($user_id: uuid!) {
    shoppers(where: { user_id: { _eq: $user_id } }) {
      id
      full_name
      status
      active
      telegram_id
      user_id
      phone_number
      address
      transport_mode
      created_at
      updated_at
    }
  }
`;

const CREATE_SHOPPER = gql`
  mutation CreateShopper($user_id: uuid!) {
    insert_shoppers_one(
      object: {
        user_id: $user_id
        full_name: "Shopper"
        status: "offline"
        active: true
        transport_mode: "bike"
      }
    ) {
      id
      full_name
      status
      active
      telegram_id
      user_id
      phone_number
      address
      transport_mode
      created_at
      updated_at
    }
  }
`;

const GET_USER_INFO = gql`
  query GetUserInfo($user_id: uuid!) {
    Users_by_pk(id: $user_id) {
      id
      name
      email
      phone
      profile_picture
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = (await getServerSession(req, res, authOptions as any)) as {
      user?: { id?: string };
    } | null;

    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "Missing required field: userId",
      });
    }

    // Verify the authenticated user matches the request
    if (userId !== session.user.id) {
      return res.status(403).json({
        error: "Not authorized to access this user",
      });
    }

    if (!hasuraClient) {
      return res.status(500).json({ error: "Database client not available" });
    }

    // First, check if shopper already exists
    const existingShopperData = await hasuraClient.request<{
      shoppers: Array<{
        id: string;
        full_name: string;
        status: string;
        active: boolean;
        telegram_id: string;
        user_id: string;
        phone_number: string;
        address: string;
        transport_mode: string;
        created_at: string;
        updated_at: string;
      }>;
    }>(GET_SHOPPER_BY_USER_ID, { user_id: userId });

    let shopper = existingShopperData.shoppers[0];

    // If shopper doesn't exist, create one
    if (!shopper) {
      console.log(`Creating new shopper for user: ${userId}`);

      // Get user info to populate shopper data
      const userData = await hasuraClient.request<{
        Users_by_pk: {
          id: string;
          name: string;
          email: string;
          phone: string;
          profile_picture: string;
        };
      }>(GET_USER_INFO, { user_id: userId });

      const user = userData.Users_by_pk;

      // Create new shopper record
      const createShopperData = await hasuraClient.request<{
        insert_shoppers_one: {
          id: string;
          full_name: string;
          status: string;
          active: boolean;
          telegram_id: string;
          user_id: string;
          phone_number: string;
          address: string;
          transport_mode: string;
          created_at: string;
          updated_at: string;
        };
      }>(CREATE_SHOPPER, { user_id: userId });

      shopper = createShopperData.insert_shoppers_one;

      console.log(`✅ New shopper created: ${shopper.id}`);
    } else {
      console.log(`✅ Existing shopper found: ${shopper.id}`);
    }

    return res.status(200).json({
      success: true,
      shopper: shopper,
      isNew: !existingShopperData.shoppers[0],
    });
  } catch (error) {
    console.error("Error ensuring shopper:", error);
    return res.status(500).json({
      error: "Failed to ensure shopper",
    });
  }
}
