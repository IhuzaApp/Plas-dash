import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const UPDATE_BUSINESS_STORE = gql`
  mutation UpdateBusinessStore(
    $store_id: uuid!
    $address: String
    $category_id: uuid
    $description: String
    $image: String
    $is_active: Boolean
    $latitude: String
    $longitude: String
    $name: String
    $operating_hours: json
  ) {
    update_business_stores(
      where: { id: { _eq: $store_id } }
      _set: {
        address: $address
        category_id: $category_id
        description: $description
        image: $image
        is_active: $is_active
        latitude: $latitude
        longitude: $longitude
        name: $name
        operating_hours: $operating_hours
      }
    ) {
      affected_rows
      returning {
        id
        name
        description
        address
        category_id
        image
        is_active
        latitude
        longitude
        operating_hours
        created_at
      }
    }
  }
`;

interface SessionUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

interface Session {
  user: SessionUser;
  expires: string;
}

interface UpdateBusinessStoreInput {
  store_id: string;
  name?: string;
  description?: string;
  address?: string;
  category_id?: string;
  image?: string;
  is_active?: boolean;
  latitude?: string;
  longitude?: string;
  operating_hours?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT" && req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as Session | null;

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const user_id = session.user.id;
    const {
      store_id,
      name,
      description,
      address,
      category_id,
      image,
      is_active,
      latitude,
      longitude,
      operating_hours,
    } = req.body as UpdateBusinessStoreInput;

    if (!store_id || !store_id.trim()) {
      return res.status(400).json({ error: "Store ID is required" });
    }

    // Get business account and verify ownership
    const businessAccountQuery = gql`
      query GetBusinessAccount($user_id: uuid!) {
        business_accounts(where: { user_id: { _eq: $user_id } }) {
          id
        }
      }
    `;

    const businessAccountResult = await hasuraClient.request<{
      business_accounts: Array<{ id: string }>;
    }>(businessAccountQuery, { user_id });

    if (
      !businessAccountResult.business_accounts ||
      businessAccountResult.business_accounts.length === 0
    ) {
      return res.status(400).json({ error: "Business account not found" });
    }

    const business_id = businessAccountResult.business_accounts[0].id;

    // Verify store belongs to this business
    const verifyStoreQuery = gql`
      query VerifyStore($store_id: uuid!, $business_id: uuid!) {
        business_stores(
          where: { id: { _eq: $store_id }, business_id: { _eq: $business_id } }
        ) {
          id
        }
      }
    `;

    const verifyResult = await hasuraClient.request<{
      business_stores: Array<{ id: string }>;
    }>(verifyStoreQuery, { store_id, business_id });

    if (
      !verifyResult.business_stores ||
      verifyResult.business_stores.length === 0
    ) {
      return res.status(404).json({ error: "Store not found" });
    }

    // Build _set object - only include fields that were provided
    const setObj: Record<string, any> = {};
    if (name !== undefined) setObj.name = name.trim();
    if (description !== undefined)
      setObj.description = description?.trim() ?? "";
    if (address !== undefined) setObj.address = address?.trim() ?? "";
    if (category_id !== undefined) {
      const hasValidCategoryId =
        category_id &&
        category_id.trim() !== "" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          category_id.trim()
        );
      setObj.category_id = hasValidCategoryId ? category_id.trim() : null;
    }
    if (image !== undefined) setObj.image = image ?? "";
    if (is_active !== undefined) setObj.is_active = is_active;
    if (latitude !== undefined) setObj.latitude = latitude?.trim() ?? "";
    if (longitude !== undefined) setObj.longitude = longitude?.trim() ?? "";
    if (operating_hours !== undefined) {
      let operatingHoursJson: any = {};
      if (operating_hours) {
        if (typeof operating_hours === "string") {
          try {
            operatingHoursJson = JSON.parse(operating_hours);
          } catch {
            operatingHoursJson = {};
          }
        } else if (
          typeof operating_hours === "object" &&
          operating_hours !== null
        ) {
          operatingHoursJson = operating_hours;
        }
      }
      setObj.operating_hours = operatingHoursJson;
    }

    if (Object.keys(setObj).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const variables: Record<string, any> = {
      store_id,
      ...setObj,
    };

    const result = await hasuraClient.request<{
      update_business_stores: {
        affected_rows: number;
        returning: Array<{
          id: string;
          name: string;
          description: string | null;
          address: string | null;
          category_id: string | null;
          image: string | null;
          is_active: boolean;
          latitude: string | null;
          longitude: string | null;
          operating_hours: any;
          created_at: string;
        }>;
      };
    }>(UPDATE_BUSINESS_STORE, variables);

    if (
      !result.update_business_stores ||
      result.update_business_stores.affected_rows === 0
    ) {
      return res.status(400).json({ error: "Failed to update store" });
    }

    const updatedStore = result.update_business_stores.returning[0];

    return res.status(200).json({
      success: true,
      store: {
        id: updatedStore.id,
        name: updatedStore.name,
        description: updatedStore.description,
        address: updatedStore.address,
        category_id: updatedStore.category_id,
        image: updatedStore.image,
        is_active: updatedStore.is_active,
        latitude: updatedStore.latitude,
        longitude: updatedStore.longitude,
        operating_hours: updatedStore.operating_hours,
        created_at: updatedStore.created_at,
      },
    });
  } catch (error: any) {
    const errorMessage =
      error.response?.errors?.[0]?.message || error.message || "Unknown error";
    return res.status(500).json({
      error: "Failed to update store",
      message: errorMessage,
    });
  }
}
