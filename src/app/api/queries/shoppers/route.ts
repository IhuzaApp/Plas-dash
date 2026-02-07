import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { hasuraClient } from "@/lib/hasuraClient";
import { gql } from "graphql-request";

// Admin dashboard: fetches all shoppers (no filter).
const GET_SHOPPERS = gql`
  query GetShoppers {
    shoppers(order_by: { created_at: desc }) {
      id
      user_id
      active
      full_name
      phone_number
      created_at
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
    const data = await hasuraClient.request<{ shoppers: any[] }>(GET_SHOPPERS);
    return NextResponse.json({ shoppers: data.shoppers || [] });
  } catch (error) {
    console.error("Error fetching shoppers:", error);
    return NextResponse.json(
      { error: "Failed to fetch shoppers" },
      { status: 500 }
    );
  }
}
