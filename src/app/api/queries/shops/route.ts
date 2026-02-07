import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { hasuraClient } from "@/lib/hasuraClient";
import { gql } from "graphql-request";

// Admin dashboard: fetches all shops (no filter).
const GET_SHOPS = gql`
  query GetShops {
    Shops(order_by: { created_at: desc }) {
      id
      name
      description
      created_at
      address
      category_id
      image
      logo
      is_active
      latitude
      longitude
      operating_hours
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
    const data = await hasuraClient.request<{ Shops: any[] }>(GET_SHOPS);
    return NextResponse.json({ shops: data.Shops || [] });
  } catch (error) {
    console.error("Error fetching shops:", error);
    return NextResponse.json(
      { error: "Failed to fetch shops" },
      { status: 500 }
    );
  }
}
