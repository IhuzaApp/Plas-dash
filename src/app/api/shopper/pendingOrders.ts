import type { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

// Fetch orders unassigned older than 20 minutes, with detailed info
const GET_PENDING_ORDERS = gql`
  query GetPendingOrders($createdBefore: timestamptz!) {
    Orders(
      where: {
        shopper_id: { _is_null: true }
        created_at: { _lte: $createdBefore }
      }
    ) {
      id
      created_at
      service_fee
      delivery_fee
      shop: Shop {
        name
        address
        latitude
        longitude
      }
      address: Address {
        latitude
        longitude
        street
        city
      }
      Order_Items_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Cutoff timestamp: 20 minutes ago
    const cutoff = new Date(Date.now() - 20 * 60 * 1000).toISOString();

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const data = await hasuraClient.request<{
      Orders: Array<{
        id: string;
        created_at: string;
        service_fee: string;
        delivery_fee: string;
        shop: {
          name: string;
          address: string;
          latitude: string;
          longitude: string;
        };
        address: {
          latitude: string;
          longitude: string;
          street: string;
          city: string;
        };
        Order_Items_aggregate: { aggregate: { count: number | null } | null };
      }>;
    }>(GET_PENDING_ORDERS, { createdBefore: cutoff });

    const pending = data.Orders.map((o) => ({
      id: o.id,
      createdAt: o.created_at,
      latitude: parseFloat(o.address.latitude),
      longitude: parseFloat(o.address.longitude),
      earnings:
        parseFloat(o.service_fee || "0") + parseFloat(o.delivery_fee || "0"),
      shopName: o.shop.name,
      shopAddress: o.shop.address,
      shopLat: parseFloat(o.shop.latitude),
      shopLng: parseFloat(o.shop.longitude),
      itemsCount: o.Order_Items_aggregate.aggregate?.count ?? 0,
      addressStreet: o.address.street,
      addressCity: o.address.city,
    }));

    res.status(200).json(pending);
  } catch (error) {
    console.error("Error fetching pending orders:", error);
    res.status(500).json({ error: "Failed to fetch pending orders" });
  }
}
