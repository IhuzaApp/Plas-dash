import { NextApiRequest, NextApiResponse } from "next";
import { GraphQLClient, gql } from "graphql-request";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

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

  const { name, phone, email } = req.body;

  // Validate required fields
  if (!name || !phone) {
    return res.status(400).json({ error: "Name and phone are required" });
  }

  // Clean phone number
  const cleanPhone = phone.replace(/\D/g, "");

  // Validate phone format
  const phoneRegex = /^[\+]?[0-9]{10,15}$/;
  if (!phoneRegex.test(cleanPhone) || cleanPhone.length < 10) {
    return res.status(400).json({ error: "Invalid phone number format" });
  }

  try {
    // Check if a guest user with this phone already exists
    const checkGuestQuery = gql`
      query CheckExistingGuest($phone: String!) {
        Users(where: { phone: { _eq: $phone }, is_guest: { _eq: true } }) {
          id
          email
        }
      }
    `;

    const existingGuests = await hasuraClient.request<{
      Users: Array<{ id: string; email: string }>;
    }>(checkGuestQuery, { phone: cleanPhone });

    // If guest already exists, return their credentials
    if (existingGuests.Users.length > 0) {
      const existingGuest = existingGuests.Users[0];

      // Generate a temporary password for auto-login
      const tempPassword = `guest_${cleanPhone}_${Date.now()}`;
      const password_hash = await bcrypt.hash(tempPassword, 10);

      // Update the existing guest's password
      const updateGuestQuery = gql`
        mutation UpdateGuestPassword(
          $id: uuid!
          $password_hash: String!
          $name: String!
        ) {
          update_Users_by_pk(
            pk_columns: { id: $id }
            _set: {
              password_hash: $password_hash
              name: $name
              updated_at: "now()"
            }
          ) {
            id
            email
          }
        }
      `;

      await hasuraClient.request(updateGuestQuery, {
        id: existingGuest.id,
        password_hash,
        name,
      });

      return res.status(200).json({
        success: true,
        guestId: existingGuest.id,
        guestEmail: existingGuest.email,
        guestPassword: tempPassword,
        message: "Guest account updated",
      });
    }

    // Check if a regular user with this phone exists
    const checkUserQuery = gql`
      query CheckExistingUser($phone: String!) {
        Users(where: { phone: { _eq: $phone }, is_guest: { _eq: false } }) {
          id
        }
      }
    `;

    const existingUsers = await hasuraClient.request<{
      Users: Array<{ id: string }>;
    }>(checkUserQuery, { phone: cleanPhone });

    if (existingUsers.Users.length > 0) {
      return res.status(400).json({
        error:
          "A registered account with this phone number already exists. Please sign in instead.",
      });
    }

    // Generate guest email and password
    const guestEmail =
      email && email.trim() ? email.trim() : `guest_${cleanPhone}@guest.local`;

    // Generate a secure random password for the guest
    const tempPassword = `guest_${cleanPhone}_${Date.now()}`;
    const password_hash = await bcrypt.hash(tempPassword, 10);

    // Create new guest user
    const createGuestMutation = gql`
      mutation CreateGuestUser(
        $name: String!
        $email: String!
        $phone: String!
        $password_hash: String!
      ) {
        insert_Users(
          objects: {
            name: $name
            email: $email
            phone: $phone
            gender: "prefer_not_to_say"
            role: "user"
            password_hash: $password_hash
            is_active: true
            is_guest: true
          }
        ) {
          returning {
            id
            email
          }
        }
      }
    `;

    const data = await hasuraClient.request<{
      insert_Users: { returning: { id: string; email: string }[] };
    }>(createGuestMutation, {
      name,
      email: guestEmail,
      phone: cleanPhone,
      password_hash,
    });

    const newGuest = data.insert_Users.returning[0];

    return res.status(200).json({
      success: true,
      guestId: newGuest.id,
      guestEmail: newGuest.email,
      guestPassword: tempPassword,
      message: "Guest account created successfully",
    });
  } catch (error: any) {
    console.error("Error creating guest user:", error);

    // Handle specific Hasura errors
    if (error.message?.includes("duplicate key")) {
      return res.status(400).json({
        error: "An account with this phone number already exists",
      });
    }

    if (error.message?.includes("is_guest")) {
      // If is_guest column doesn't exist, provide a helpful error
      return res.status(500).json({
        error:
          "Database schema update required. Please add 'is_guest' column to Users table.",
      });
    }

    return res.status(500).json({
      error: "Failed to create guest account. Please try again.",
    });
  }
}
