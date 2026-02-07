import { NextApiRequest, NextApiResponse } from "next";
import { GraphQLClient, gql } from "graphql-request";
import bcrypt from "bcryptjs";

const HASURA_URL = process.env.HASURA_GRAPHQL_URL!;
const HASURA_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;
const hasuraClient = new GraphQLClient(HASURA_URL, {
  headers: { "x-hasura-admin-secret": HASURA_SECRET },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { name, email, password, phone, gender } = req.body;

  // Validate required fields
  if (!name || !email || !password || !phone || !gender) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Validate password strength
  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters long" });
  }

  // Validate phone format (basic validation)
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanPhone = phone.replace(/\D/g, "");
  if (!phoneRegex.test(cleanPhone) || cleanPhone.length < 10) {
    return res.status(400).json({ error: "Invalid phone number format" });
  }

  try {
    // Check if user already exists
    const checkUserQuery = gql`
      query CheckExistingUser($email: String!, $phone: String!) {
        Users(
          where: {
            _or: [{ email: { _eq: $email } }, { phone: { _eq: $phone } }]
          }
        ) {
          id
          email
          phone
        }
      }
    `;

    const existingUsers = await hasuraClient.request<{
      Users: Array<{ id: string; email: string; phone: string }>;
    }>(checkUserQuery, { email, phone: cleanPhone });

    if (existingUsers.Users.length > 0) {
      const existingUser = existingUsers.Users[0];
      if (existingUser.email === email) {
        return res
          .status(400)
          .json({ error: "An account with this email already exists" });
      }
      if (existingUser.phone === cleanPhone) {
        return res
          .status(400)
          .json({ error: "An account with this phone number already exists" });
      }
    }

    const password_hash = await bcrypt.hash(password, 10);
    const mutation = gql`
      mutation RegisterUser(
        $name: String!
        $email: String!
        $phone: String!
        $gender: String!
        $password_hash: String!
      ) {
        insert_Users(
          objects: {
            name: $name
            email: $email
            phone: $phone
            gender: $gender
            role: "user"
            password_hash: $password_hash
            is_active: true
          }
        ) {
          returning {
            id
          }
        }
      }
    `;
    const data = await hasuraClient.request<{
      insert_Users: { returning: { id: string }[] };
    }>(mutation, { name, email, phone: cleanPhone, gender, password_hash });
    const newId = data.insert_Users.returning[0]?.id;
    return res.status(200).json({ success: true, userId: newId });
  } catch (error: any) {
    console.error("Error registering user:", error);

    // Handle specific Hasura errors
    if (error.message?.includes("duplicate key")) {
      return res
        .status(400)
        .json({ error: "An account with this email or phone already exists" });
    }

    return res
      .status(500)
      .json({ error: "Registration failed. Please try again." });
  }
}
