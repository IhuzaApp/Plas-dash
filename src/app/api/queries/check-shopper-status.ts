import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]";

const CHECK_SHOPPER_STATUS = gql`
  query CheckShopperStatus($user_id: uuid!) {
    shoppers(where: { user_id: { _eq: $user_id } }) {
      id
      status
      active
      onboarding_step
      collection_comment
      needCollection
    }
  }
`;

interface CheckShopperResponse {
  shoppers: Array<{
    id: string;
    status: string;
    active: boolean;
    onboarding_step: string;
    collection_comment?: string;
    needCollection?: boolean;
  }>;
}

// Define the session user type
interface SessionUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

// Define the session type
interface Session {
  user: SessionUser;
  expires: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Allow both GET and POST requests
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify the user is authenticated
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as Session | null;

    if (!session || !session.user) {
      return res
        .status(401)
        .json({ error: "You must be authenticated to check shopper status" });
    }

    if (!hasuraClient) {
      console.error(
        "Hasura client is not initialized. Check environment variables."
      );
      throw new Error(
        "Hasura client is not initialized. Please check server configuration."
      );
    }

    let user_id: string;

    if (req.method === "GET") {
      // For GET requests, use the authenticated user's ID
      user_id = session.user.id;
    } else {
      // For POST requests, use the user_id from the request body
      user_id = req.body.user_id;

      // Validate required fields
      if (!user_id) {
        return res.status(400).json({ error: "Missing user_id" });
      }

      // Verify the user ID in the request matches the authenticated user
      if (user_id !== session.user.id) {
        console.error("User ID mismatch:", {
          requestUserId: user_id,
          sessionUserId: session.user.id,
        });
        return res.status(403).json({
          error:
            "User ID mismatch. You can only check your own shopper status.",
        });
      }
    }

    // Check if the user is a shopper
    const shopperData = await hasuraClient.request<CheckShopperResponse>(
      CHECK_SHOPPER_STATUS,
      { user_id }
    );

    if (shopperData.shoppers.length > 0) {
      const shopper = shopperData.shoppers[0];
      return res.status(200).json({ shopper });
    } else {
      return res.status(200).json({ shopper: null });
    }
  } catch (error: any) {
    console.error("Error checking shopper status:", error);
    res.status(500).json({
      error: "Failed to check shopper status",
      message: error.message,
      details: error.response?.errors || "No additional details available",
    });
  }
}
