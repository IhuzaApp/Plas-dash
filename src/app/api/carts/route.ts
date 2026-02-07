import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { hasuraClient } from "@/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_USER_CARTS = gql`
  query GetUserCarts($user_id: uuid!) {
    Carts(where: { user_id: { _eq: $user_id }, is_active: { _eq: true } }) {
      shop_id
      Cart_Items_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`;

const GET_SHOPS_BY_IDS = gql`
  query GetShopsByIds($ids: [uuid!]!) {
    Shops(where: { id: { _in: $ids } }) {
      id
      name
      latitude
      longitude
      logo
    }
  }
`;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user_id = session.user.id;
  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }
    const data = await hasuraClient.request<{
      Carts: Array<{
        shop_id: string;
        Cart_Items_aggregate: { aggregate: { count: number } };
      }>;
    }>(GET_USER_CARTS, { user_id });
    const shopIds = Array.from(new Set(data.Carts.map((c) => c.shop_id)));
    const countsMap: Record<string, number> = data.Carts.reduce((acc, c) => {
      acc[c.shop_id] = c.Cart_Items_aggregate.aggregate.count;
      return acc;
    }, {} as Record<string, number>);
    let carts: Array<{
      id: string;
      name: string;
      count: number;
      latitude: string;
      longitude: string;
      logo?: string;
    }> = [];
    if (shopIds.length > 0) {
      const shopsData = await hasuraClient.request<{
        Shops: Array<{
          id: string;
          name: string;
          latitude: string;
          longitude: string;
          logo?: string;
        }>;
      }>(GET_SHOPS_BY_IDS, { ids: shopIds });
      carts = shopsData.Shops.map((shop) => ({
        id: shop.id,
        name: shop.name,
        count: countsMap[shop.id] ?? 0,
        latitude: shop.latitude,
        longitude: shop.longitude,
        logo: shop.logo,
      }));
    }
    return NextResponse.json({ carts });
  } catch (error) {
    console.error("Error fetching user carts:", error);
    return NextResponse.json(
      { error: "Failed to fetch user carts" },
      { status: 500 }
    );
  }
}
