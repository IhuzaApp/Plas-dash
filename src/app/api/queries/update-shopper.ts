import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]";
import { Session } from "next-auth";

interface UpdateShopperResult {
  update_shoppers: {
    affected_rows: number;
  };
}

interface UpdateUserRoleResult {
  update_Users: {
    affected_rows: number;
  };
}

interface GetShopperResult {
  shoppers: Array<{
    id: string;
    profile_photo: string;
    national_id: string;
  }>;
}

const GET_SHOPPER = gql`
  query GetShopper($user_id: uuid!) {
    shoppers(where: { user_id: { _eq: $user_id } }) {
      id
      profile_photo
      national_id
    }
  }
`;

const UPDATE_SHOPPER = gql`
  mutation updateShopperProfile(
    $user_id: uuid!
    $address: String!
    $driving_license: String!
    $full_name: String!
    $national_id: String!
    $onboarding_step: String!
    $phone_number: String!
    $status: String!
    $transport_mode: String!
    $updated_at: timestamptz!
    $profile_photo: String
  ) {
    update_shoppers(
      where: { user_id: { _eq: $user_id } }
      _set: {
        active: false
        address: $address
        background_check_completed: false
        driving_license: $driving_license
        full_name: $full_name
        national_id: $national_id
        onboarding_step: $onboarding_step
        phone_number: $phone_number
        status: $status
        transport_mode: $transport_mode
        updated_at: $updated_at
        profile_photo: $profile_photo
      }
    ) {
      affected_rows
    }
  }
`;

const UPDATE_USER_ROLE = gql`
  mutation UpdateUserRole($user_id: uuid!, $role: String!) {
    update_Users(where: { id: { _eq: $user_id } }, _set: { role: $role }) {
      affected_rows
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    console.log("=== Starting update-shopper request ===");
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as Session | null;
    console.log("Session:", session);

    if (!session?.user?.id) {
      console.log("No session or user ID found");
      return res.status(401).json({ message: "Unauthorized" });
    }

    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const {
      address,
      driving_license,
      full_name,
      national_id,
      onboarding_step,
      phone_number,
      status,
      transport_mode,
      updated_at,
      profile_photo,
    } = req.body;

    // Validate required fields
    if (!full_name || !phone_number || !national_id || !transport_mode) {
      const missingFields = {
        full_name: !full_name,
        phone_number: !phone_number,
        national_id: !national_id,
        transport_mode: !transport_mode,
      };
      console.log("Missing required fields:", missingFields);
      return res.status(400).json({
        message: "Missing required fields",
        details: missingFields,
      });
    }

    if (!hasuraClient) {
      console.error("Hasura client not initialized");
      throw new Error("Hasura client not initialized");
    }

    // Get current shopper data
    const { shoppers } = await hasuraClient.request<GetShopperResult>(
      GET_SHOPPER,
      {
        user_id: session.user.id,
      }
    );

    if (!shoppers || shoppers.length === 0) {
      console.log("No shopper found for user:", session.user.id);
      return res.status(404).json({
        message: "Shopper not found",
      });
    }

    const currentShopper = shoppers[0];

    // Only include profile_photo in variables if it's provided
    const variables = {
      user_id: session.user.id,
      address: address || "",
      driving_license: driving_license || "",
      full_name,
      national_id,
      onboarding_step: onboarding_step || "profile_updated",
      phone_number,
      status: status || "pending",
      transport_mode,
      updated_at: updated_at || new Date().toISOString(),
      profile_photo: profile_photo || currentShopper.profile_photo || "",
    };

    console.log("Mutation variables:", JSON.stringify(variables, null, 2));

    try {
      const result = await hasuraClient.request<UpdateShopperResult>(
        UPDATE_SHOPPER,
        variables
      );
      console.log("Shopper update result:", JSON.stringify(result, null, 2));

      if (result.update_shoppers.affected_rows === 0) {
        console.log("No shopper found for user:", session.user.id);
        return res.status(404).json({
          message: "Shopper not found",
        });
      }

      // If shopper update was successful, update the user role
      try {
        const roleResult = await hasuraClient.request<UpdateUserRoleResult>(
          UPDATE_USER_ROLE,
          {
            user_id: session.user.id,
            role: "user",
          }
        );
        console.log(
          "User role update result:",
          JSON.stringify(roleResult, null, 2)
        );
      } catch (roleError) {
        console.error("Error updating user role:", roleError);
        // Continue with the response even if role update fails
      }

      return res.status(200).json({
        message: "Shopper profile updated and sent for review",
        success: true,
      });
    } catch (graphqlError) {
      console.error("GraphQL Error:", graphqlError);
      throw graphqlError; // Re-throw to be caught by outer catch block
    }
  } catch (error) {
    console.error("=== Error in update-shopper ===");
    console.error(
      "Error type:",
      error instanceof Error ? error.constructor.name : typeof error
    );
    console.error(
      "Error message:",
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    console.error("=== End of error details ===");

    return res.status(500).json({
      message: "Error updating shopper",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
