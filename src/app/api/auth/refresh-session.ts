import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

/**
 * API endpoint to refresh the user's session with the latest data from the database
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get the current session
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Fetch the latest user data from the database
    const query = gql`
      query GetUserById($id: uuid!) {
        Users_by_pk(id: $id) {
          id
          name
          email
          role
          phone
          gender
          profile_picture
        }
      }
    `;

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const userData = await hasuraClient.request<{
      Users_by_pk: {
        id: string;
        name: string;
        email: string;
        role: string;
        phone: string;
        gender: string;
        profile_picture: string;
      };
    }>(query, { id: (session.user as any).id });

    const user = userData.Users_by_pk;

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return the latest user data
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        image: user.profile_picture,
      },
    });
  } catch (error) {
    console.error("Error refreshing session:", error);
    return res.status(500).json({ error: "Failed to refresh session" });
  }
}
