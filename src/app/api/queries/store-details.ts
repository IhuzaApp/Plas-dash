import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_STORE_DETAILS = gql`
  query GetStoreDetails($id: uuid!) {
    business_stores_by_pk(id: $id) {
      id
      name
      description
      image
      category_id
      latitude
      longitude
      operating_hours
      is_active
      created_at
    }
  }
`;

const GET_STORE_PRODUCTS = gql`
  query GetStoreProducts($store_id: uuid!) {
    PlasBusinessProductsOrSerive(
      where: { store_id: { _eq: $store_id }, status: { _eq: "active" } }
    ) {
      id
      name
      Description
      Image
      price
      unit
      status
      created_at
      minimumOrders
      maxOrders
      delveryArea
      query_id
      speciality
      category
      otherDetails
    }
  }
`;

interface StoreResponse {
  business_stores_by_pk: {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    category_id: string | null;
    latitude: string | null;
    longitude: string | null;
    operating_hours: any;
    is_active: boolean;
    created_at: string;
  } | null;
}

interface ProductsResponse {
  PlasBusinessProductsOrSerive: Array<{
    id: string;
    name: string;
    Description: string;
    Image: string;
    price: string;
    unit: string;
    status: string;
    created_at: string;
    minimumOrders: string;
    maxOrders: string;
    delveryArea: string;
    query_id: string;
    speciality: string;
    category: string;
    otherDetails: {
      options?: Array<{ key: string; label: string; values: string[] }>;
    } | null;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Store ID is required" });
    }

    const [storeData, productsData] = await Promise.all([
      hasuraClient.request<StoreResponse>(GET_STORE_DETAILS, { id }),
      hasuraClient.request<ProductsResponse>(GET_STORE_PRODUCTS, {
        store_id: id,
      }),
    ]);

    if (!storeData.business_stores_by_pk) {
      return res.status(404).json({ error: "Store not found" });
    }

    // Transform products to match FreshMarkPage format (active only)
    const transformedProducts =
      productsData.PlasBusinessProductsOrSerive.filter(
        (p) => p.status === "active"
      ).map((product) => ({
        id: product.id,
        name: product.name,
        ProductName: {
          id: product.id,
          name: product.name,
          description: product.Description || "",
        },
        image: product.Image || "",
        price: product.price,
        final_price: product.price,
        unit: product.unit || "",
        category:
          product.category?.trim() || product.speciality?.trim() || "Other",
        measurement_unit: product.unit || "",
        quantity: 1, // Default quantity for services
        is_active: product.status === "active",
        created_at: product.created_at,
        updated_at: product.created_at,
        shop_id: id, // Use store id as shop_id for compatibility
        otherDetails: product.otherDetails ?? null,
      }));

    // Transform store to match Shop format for FreshMarkPage
    const store = {
      id: storeData.business_stores_by_pk.id,
      name: storeData.business_stores_by_pk.name,
      description: storeData.business_stores_by_pk.description || "",
      image: storeData.business_stores_by_pk.image || "",
      logo: storeData.business_stores_by_pk.image || "",
      address: "", // Stores may not have address field
      latitude: storeData.business_stores_by_pk.latitude || "",
      longitude: storeData.business_stores_by_pk.longitude || "",
      operating_hours: storeData.business_stores_by_pk.operating_hours,
      is_active: storeData.business_stores_by_pk.is_active,
    };

    return res.status(200).json({
      store,
      products: transformedProducts,
    });
  } catch (error: any) {
    console.error("Error fetching store details:", error);
    return res.status(500).json({
      error: "Failed to fetch store details",
      message: error.message,
    });
  }
}
