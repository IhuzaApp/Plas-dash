import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { hasuraClient } from "@/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_CARTS = gql`
  query GetCarts {
    Carts {
      id
      user_id
      created_at
      is_active
      shop_id
      total
      updated_at
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
    const data = await hasuraClient.request<{ Carts: any[] }>(GET_CARTS);
    return NextResponse.json({ carts: data.Carts || [] });
  } catch (error) {
    console.error("Error fetching carts:", error);
    return NextResponse.json(
      { error: "Failed to fetch carts" },
      { status: 500 }
    );
  }
}
