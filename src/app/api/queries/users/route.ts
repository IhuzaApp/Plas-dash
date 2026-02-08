import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { hasuraClient } from "@/lib/hasuraClient";
import { gql } from "graphql-request";

// Admin dashboard: fetches all users (including role shopper).
const GET_USERS = gql`
  query GetUsers {
    Users(order_by: { created_at: desc }) {
      id
      name
      email
      created_at
      updated_at
      gender
      is_active
      is_guest
      password_hash
      phone
      profile_picture
      role
    }
  }
`;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }
    const data = await hasuraClient.request<{ Users: any[] }>(GET_USERS);
    return NextResponse.json({ users: data.Users || [] });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
