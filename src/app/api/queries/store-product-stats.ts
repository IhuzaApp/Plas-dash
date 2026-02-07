import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_ORDERS_BY_STORE = gql`
  query GetOrdersByStore(
    $store_id: uuid!
    $businessAccount_id: uuid!
    $user_id: uuid!
  ) {
    businessProductOrders(
      where: {
        store_id: { _eq: $store_id }
        business_store: {
          business_account: {
            id: { _eq: $businessAccount_id }
            user_id: { _eq: $user_id }
          }
        }
      }
    ) {
      id
      allProducts
    }
  }
`;

const GET_BUSINESS_ACCOUNT = gql`
  query GetBusinessAccount($user_id: uuid!) {
    business_accounts(where: { user_id: { _eq: $user_id } }, limit: 1) {
      id
    }
  }
`;

export type ProductStats = { orders: number; unitsSold: number };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = (await getServerSession(req, res, authOptions as any)) as {
      user?: { id: string };
    } | null;

    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { store_id } = req.query;
    if (!store_id || typeof store_id !== "string") {
      return res.status(400).json({ error: "store_id is required" });
    }

    if (!hasuraClient) {
      return res.status(500).json({ error: "Service unavailable" });
    }

    const { business_accounts } = await hasuraClient.request<{
      business_accounts: Array<{ id: string }>;
    }>(GET_BUSINESS_ACCOUNT, { user_id: session.user.id });

    if (!business_accounts?.length) {
      return res.status(200).json({ stats: {} });
    }

    const businessAccountId = business_accounts[0].id;

    const { businessProductOrders } = await hasuraClient.request<{
      businessProductOrders: Array<{ id: string; allProducts: any }>;
    }>(GET_ORDERS_BY_STORE, {
      store_id,
      businessAccount_id: businessAccountId,
      user_id: session.user.id,
    });

    const stats: Record<string, ProductStats> = {};
    const orderIdsByProduct: Record<string, Set<string>> = {};
    for (const order of businessProductOrders || []) {
      const products = Array.isArray(order.allProducts)
        ? order.allProducts
        : [];
      const seenInOrder = new Set<string>();
      for (const p of products) {
        const productId = p.id || p.product_id;
        if (!productId || typeof productId !== "string") continue;
        if (!stats[productId]) {
          stats[productId] = { orders: 0, unitsSold: 0 };
          orderIdsByProduct[productId] = new Set();
        }
        stats[productId].unitsSold += parseInt(p.quantity || "0", 10) || 0;
        if (!seenInOrder.has(productId)) {
          seenInOrder.add(productId);
          orderIdsByProduct[productId].add(order.id);
        }
      }
    }
    for (const [productId, ids] of Object.entries(orderIdsByProduct)) {
      stats[productId].orders = ids.size;
    }

    return res.status(200).json({ stats });
  } catch (error: any) {
    console.error("Store product stats error:", error);
    return res.status(500).json({
      error: "Failed to fetch product stats",
      message: error.message,
    });
  }
}
