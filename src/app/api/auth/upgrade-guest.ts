import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";
import { GraphQLClient, gql } from "graphql-request";
import bcrypt from "bcryptjs";

const hasuraClient = new GraphQLClient(
  process.env.HASURA_GRAPHQL_URL || process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!,
  {
    headers: {
      "x-hasura-admin-secret":
        process.env.HASURA_ADMIN_SECRET ||
        process.env.HASURA_GRAPHQL_ADMIN_SECRET!,
    },
  }
);

const UPDATE_USER_MUTATION = gql`
  mutation UpdateUserToMember(
    $userId: uuid!
    $name: String!
    $email: String!
    $passwordHash: String!
    $gender: String!
  ) {
    update_Users_by_pk(
      pk_columns: { id: $userId }
      _set: {
        name: $name
        email: $email
        password_hash: $passwordHash
        gender: $gender
        is_guest: false
        updated_at: "now()"
      }
    ) {
      id
      name
      email
      phone
      gender
      is_guest
      updated_at
    }
  }
`;

const CHECK_EMAIL_QUERY = gql`
  query CheckEmailExists($email: String!) {
    Users(where: { email: { _eq: $email } }) {
      id
      email
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
    // Get the session
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Check if user is actually a guest
    if (!(session.user as any).is_guest) {
      return res.status(400).json({ error: "User is already a full member" });
    }

    const { fullName, email, password, gender } = req.body;

    // Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
    }

    // Check if email already exists
    const emailCheck: any = await hasuraClient.request(CHECK_EMAIL_QUERY, {
      email: email.toLowerCase(),
    });

    if (emailCheck.Users && emailCheck.Users.length > 0) {
      // Check if the existing email belongs to a different user
      if (emailCheck.Users[0].id !== session.user.id) {
        return res.status(400).json({
          error: "Email already in use by another account",
        });
      }
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    console.log("=".repeat(60));
    console.log("🔄 UPDATING USER IN DATABASE");
    console.log("=".repeat(60));
    console.log(`User ID: ${session.user.id}`);
    console.log(`Name: ${fullName}`);
    console.log(`Email: ${email.toLowerCase()}`);
    console.log(`Gender: ${gender || "male"}`);
    console.log("=".repeat(60));

    // Update the user
    const result: any = await hasuraClient.request(UPDATE_USER_MUTATION, {
      userId: session.user.id,
      name: fullName,
      email: email.toLowerCase(),
      passwordHash,
      gender: gender || "male",
    });

    if (!result.update_Users_by_pk) {
      throw new Error("Failed to update user");
    }

    console.log("=".repeat(60));
    console.log("✅ USER UPDATED SUCCESSFULLY IN DATABASE");
    console.log("=".repeat(60));
    console.log(
      "Updated user:",
      JSON.stringify(result.update_Users_by_pk, null, 2)
    );
    console.log("=".repeat(60));

    return res.status(200).json({
      success: true,
      user: result.update_Users_by_pk,
      message: "Account upgraded successfully",
    });
  } catch (error: any) {
    console.error("=".repeat(60));
    console.error("❌ GUEST UPGRADE ERROR");
    console.error("=".repeat(60));
    console.error("Error details:", error);
    if (error.response) {
      console.error(
        "GraphQL Response:",
        JSON.stringify(error.response, null, 2)
      );
    }
    console.error("=".repeat(60));

    return res.status(500).json({
      error: error.message || "Failed to upgrade account",
      details: error.response?.errors || error.response?.error || undefined,
    });
  }
}
