import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_BUSINESS_ORDER = gql`
  query GetBusinessOrderForCustomer($id: uuid!, $ordered_by: uuid!) {
    businessProductOrders(
      where: { id: { _eq: $id }, ordered_by: { _eq: $ordered_by } }
      limit: 1
    ) {
      id
      OrderID
      store_id
      total
      transportation_fee
      service_fee
      status
      created_at
      delivered_time
      delivery_proof
      timeRange
      units
      pin
      deliveryAddress
      comment
      latitude
      longitude
      allProducts
      shopper_id
      business_store {
        id
        name
        image
        address
        description
        latitude
        longitude
        operating_hours
        business_account {
          business_email
          business_location
          business_name
          business_phone
          user_id
          Users {
            phone
          }
        }
        Category {
          name
          description
        }
      }
      orderedBy {
        id
        name
        phone
        email
      }
      shopper {
        id
        name
        profile_picture
        phone
        email
      }
    }
  }
`;

const GET_BUSINESS_ORDER_FOR_SHOPPER = gql`
  query GetBusinessOrderForShopper($id: uuid!) {
    businessProductOrders(where: { id: { _eq: $id } }, limit: 1) {
      id
      OrderID
      store_id
      total
      transportation_fee
      service_fee
      status
      created_at
      delivered_time
      delivery_proof
      timeRange
      units
      pin
      deliveryAddress
      comment
      latitude
      longitude
      allProducts
      shopper_id
      business_store {
        id
        name
        image
        address
        description
        latitude
        longitude
        operating_hours
        business_account {
          business_email
          business_location
          business_name
          business_phone
          user_id
          Users {
            phone
          }
        }
        Category {
          name
          description
        }
      }
      orderedBy {
        id
        name
        phone
        email
      }
      shopper {
        id
        name
        profile_picture
        phone
        email
      }
    }
  }
`;

const GET_BUSINESS_PRODUCTS_BY_IDS = gql`
  query GetBusinessProductsByIds($product_ids: [uuid!]!) {
    PlasBusinessProductsOrSerive(where: { id: { _in: $product_ids } }) {
      id
      Image
      name
      Description
      query_id
    }
  }
`;

const GET_SHOPPER_RATINGS = gql`
  query GetShopperRatings($shopper_id: uuid!) {
    Ratings(
      where: { shopper_id: { _eq: $shopper_id } }
      order_by: { reviewed_at: desc_nulls_last }
      limit: 10
    ) {
      id
      rating
      review
      reviewed_at
      packaging_quality
      delivery_experience
      professionalism
    }
  }
`;

interface SessionUser {
  id: string;
  [key: string]: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = (await getServerSession(req, res, authOptions as any)) as {
    user: SessionUser;
  } | null;

  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const forShopper =
    req.query.forShopper === "1" || req.query.forShopper === "true";
  if (!id) {
    return res.status(400).json({ error: "Missing order id" });
  }

  try {
    if (!hasuraClient) {
      return res.status(500).json({ error: "Server not configured" });
    }

    interface BusinessOrderRow {
      id: string;
      OrderID?: string | number | null;
      store_id: string;
      total: string;
      transportation_fee: string;
      service_fee: string;
      status: string | null;
      created_at: string;
      delivered_time: string | null;
      timeRange: string | null;
      units: string;
      pin?: number | null;
      deliveryAddress: string | null;
      comment: string | null;
      allProducts: any;
      shopper_id?: string | null;
      business_store: { id: string; name: string; image: string | null } | null;
      orderedBy: {
        id: string;
        name: string;
        phone: string | null;
        email: string | null;
      } | null;
      shopper?: {
        id: string;
        name: string | null;
        profile_picture: string | null;
        phone: string | null;
        email: string | null;
      } | null;
    }

    const data = forShopper
      ? await hasuraClient.request<{
          businessProductOrders: BusinessOrderRow[];
        }>(GET_BUSINESS_ORDER_FOR_SHOPPER, { id })
      : await hasuraClient.request<{
          businessProductOrders: BusinessOrderRow[];
        }>(GET_BUSINESS_ORDER, { id, ordered_by: session.user.id });

    if (
      !data.businessProductOrders ||
      data.businessProductOrders.length === 0
    ) {
      return res.status(404).json({ error: "Order not found" });
    }

    const row = data.businessProductOrders[0];
    // DB stores grand total; fees are stored separately
    const total = parseFloat(row.total || "0");
    const transportFee = parseFloat(row.transportation_fee || "0");
    const serviceFee = parseFloat(row.service_fee || "0");
    const subtotal = Math.max(0, total - transportFee - serviceFee);
    let products = Array.isArray(row.allProducts) ? row.allProducts : [];
    const bs = row.business_store;

    // Enrich products with images from PlasBusinessProductsOrSerive
    const ids = products
      .map((p: any) => (p.id || p.product_id)?.toString())
      .filter(Boolean) as string[];
    const productIds = ids.filter((id, i) => ids.indexOf(id) === i);
    if (productIds.length > 0) {
      try {
        const productsData = await hasuraClient.request<{
          PlasBusinessProductsOrSerive: Array<{
            id: string;
            Image?: string | null;
            image?: string | null;
            name?: string | null;
            Description?: string | null;
            query_id?: string | null;
          }>;
        }>(GET_BUSINESS_PRODUCTS_BY_IDS, {
          product_ids: productIds,
        });
        const imageMap = new Map<string, string | null>();
        const descriptionMap = new Map<string, string | null>();
        const queryIdMap = new Map<string, string | null>();
        (productsData.PlasBusinessProductsOrSerive || []).forEach((x: any) => {
          const id = x.id?.toString();
          if (id) {
            const img = x.Image ?? x.image ?? null;
            imageMap.set(id, img && String(img).trim() ? String(img) : null);
            const desc = x.Description ?? null;
            descriptionMap.set(
              id,
              desc && String(desc).trim() ? String(desc) : null
            );
            const qid = x.query_id ?? null;
            queryIdMap.set(
              id,
              qid != null && String(qid).trim() ? String(qid) : null
            );
          }
        });
        products = products.map((p: any) => {
          const key = (p.id || p.product_id)?.toString();
          const imageUrl = key ? imageMap.get(key) : null;
          const description = key ? descriptionMap.get(key) : null;
          const query_id = key ? queryIdMap.get(key) : null;
          return {
            ...p,
            image: imageUrl ?? p.image ?? null,
            description: description ?? p.description ?? null,
            query_id: query_id ?? p.query_id ?? null,
          };
        });
      } catch {
        // leave products as-is
      }
    }

    // Enrich with assigned shopper and their ratings (for right-side "Your Plaser" panel)
    let Shoppers: any = null;
    if (row.shopper_id && row.shopper) {
      let ratings: any[] = [];
      try {
        const ratingsData = await hasuraClient.request<{
          Ratings: Array<{
            id: string;
            rating: string;
            review: string | null;
            reviewed_at: string | null;
            packaging_quality: string | null;
            delivery_experience: string | null;
            professionalism: string | null;
          }>;
        }>(GET_SHOPPER_RATINGS, { shopper_id: row.shopper_id });
        ratings = ratingsData.Ratings || [];
      } catch {
        // leave ratings empty
      }
      const s = row.shopper;
      Shoppers = {
        id: row.shopper_id,
        name: s.name,
        phone: s.phone,
        email: s.email,
        profile_picture: s.profile_picture,
        shopper: {
          full_name: s.name,
          profile_photo: s.profile_picture,
          phone_number: s.phone,
        },
        Ratings: ratings,
      };
    }

    const order = {
      id: row.id,
      OrderID:
        row.OrderID != null
          ? row.OrderID
          : row.id.substring(0, 8).toUpperCase(),
      status: row.status || "Pending",
      created_at: row.created_at,
      delivery_time: row.delivered_time || row.created_at,
      timeRange: row.timeRange,
      subtotal,
      total,
      transportation_fee: transportFee,
      service_fee: serviceFee,
      deliveryAddress: row.deliveryAddress,
      comment: row.comment,
      units: row.units,
      pin: row.pin != null ? String(row.pin) : "",
      shop: bs
        ? {
            id: bs.id,
            name:
              bs.name ?? bs.business_account?.business_name ?? "Business Store",
            image: bs.image,
            address:
              (bs as any).address ??
              bs.business_account?.business_location ??
              (bs.latitude != null && bs.longitude != null
                ? `${bs.latitude}, ${bs.longitude}`
                : ""),
            description: (bs as any).description ?? null,
            operating_hours: (bs as any).operating_hours ?? null,
            category: (bs as any).Category
              ? {
                  name: (bs as any).Category.name ?? null,
                  description: (bs as any).Category.description ?? null,
                }
              : null,
            latitude: bs.latitude ?? null,
            longitude: bs.longitude ?? null,
            phone:
              (bs.business_account?.business_phone?.trim() &&
                bs.business_account.business_phone) ||
              (bs as any).business_account?.Users?.phone ||
              null,
            business_account: bs.business_account
              ? {
                  business_email: bs.business_account.business_email ?? null,
                  business_location:
                    bs.business_account.business_location ?? null,
                  business_name: bs.business_account.business_name ?? null,
                  business_phone: bs.business_account.business_phone ?? null,
                }
              : null,
          }
        : null,
      delivery_proof: row.delivery_proof ?? null,
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
      shop_id: row.store_id,
      allProducts: products,
      orderedBy: row.orderedBy,
      orderType: "business",
      Shoppers,
    };

    return res.status(200).json({ order });
  } catch (err) {
    console.error("Business order details error:", err);
    return res.status(500).json({ error: "Failed to fetch order" });
  }
}
