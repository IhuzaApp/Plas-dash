import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { PRODUCT_CATEGORIES } from "../../../src/constants/productCategories";
import { sendNewStoreProductForReviewToSlack } from "../../../src/lib/slackSupportNotifier";

const CREATE_BUSINESS_PRODUCT = gql`
  mutation CreateBusinessProduct(
    $Description: String = ""
    $Image: String = ""
    $Plasbusiness_id: uuid = ""
    $category: String = ""
    $delveryArea: String = ""
    $maxOrders: String = ""
    $minimumOrders: String = ""
    $name: String!
    $price: String!
    $speciality: String = ""
    $status: String = ""
    $unit: String = ""
    $user_id: uuid = ""
    $store_id: uuid
    $query_id: String = ""
    $otherDetails: jsonb = ""
  ) {
    insert_PlasBusinessProductsOrSerive(
      objects: {
        Description: $Description
        Image: $Image
        Plasbusiness_id: $Plasbusiness_id
        category: $category
        delveryArea: $delveryArea
        maxOrders: $maxOrders
        minimumOrders: $minimumOrders
        name: $name
        price: $price
        speciality: $speciality
        status: $status
        unit: $unit
        user_id: $user_id
        store_id: $store_id
        query_id: $query_id
        otherDetails: $otherDetails
      }
    ) {
      affected_rows
      returning {
        id
        name
        Description
        Image
        price
        unit
        status
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

/** Option for otherDetails: e.g. { key: "size", label: "Size", values: ["S","M","L"] } or { key: "color", label: "Color", values: ["Blue","Red"] } */
export interface OtherDetailsOption {
  key: string;
  label: string;
  values: string[];
}

export interface OtherDetailsInput {
  options?: OtherDetailsOption[];
}

interface CreateBusinessProductInput {
  name: string;
  description?: string;
  image?: string;
  price: string;
  unit?: string;
  category?: string;
  status?: string;
  query_id?: string;
  minimumOrders?: string;
  maxOrders?: string;
  delveryArea?: string;
  speciality?: string;
  store_id?: string;
  user_id?: string;
  Plasbusiness_id?: string;
  otherDetails?: OtherDetailsInput | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
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

    const {
      name,
      description = "",
      image = "",
      price,
      unit = "",
      category = "",
      status,
      query_id = "",
      minimumOrders: minOrders,
      maxOrders,
      delveryArea,
      speciality,
      store_id,
      user_id = "",
      Plasbusiness_id = "",
      otherDetails,
    } = req.body as CreateBusinessProductInput;

    // Validate required fields
    if (!name || (typeof name === "string" && !name.trim())) {
      return res.status(400).json({ error: "Product name is required" });
    }

    // Convert price to string and validate
    const priceStr =
      price !== null && price !== undefined ? String(price).trim() : "";
    if (!priceStr) {
      return res.status(400).json({ error: "Product price is required" });
    }

    // minimumOrders is required by the database, default to "0" if not provided
    // Convert to string first to handle numbers or other types
    const minimumOrders =
      minOrders !== null && minOrders !== undefined
        ? String(minOrders).trim() !== ""
          ? String(minOrders).trim()
          : "0"
        : "0";

    // Get user_id from session if not provided
    const final_user_id = user_id || session?.user?.id || "";

    const categoryTrimmed =
      category !== null && category !== undefined
        ? String(category).trim()
        : "";
    const validCategory =
      categoryTrimmed &&
      PRODUCT_CATEGORIES.includes(
        categoryTrimmed as typeof PRODUCT_CATEGORIES[number]
      )
        ? categoryTrimmed
        : "";

    const variables: Record<string, any> = {
      name: typeof name === "string" ? name.trim() : String(name || ""),
      category: validCategory,
      Description:
        description !== null && description !== undefined
          ? String(description).trim()
          : "",
      Image: image !== null && image !== undefined ? String(image).trim() : "",
      price: priceStr,
      unit: unit !== null && unit !== undefined ? String(unit).trim() : "",
      query_id:
        query_id !== null && query_id !== undefined
          ? String(query_id).trim()
          : "",
      minimumOrders: minimumOrders,
      maxOrders:
        maxOrders !== null && maxOrders !== undefined
          ? String(maxOrders).trim()
          : "",
      delveryArea:
        delveryArea !== null && delveryArea !== undefined
          ? String(delveryArea).trim()
          : "",
      speciality:
        speciality !== null && speciality !== undefined
          ? String(speciality).trim()
          : "",
      user_id: final_user_id,
      Plasbusiness_id:
        Plasbusiness_id !== null && Plasbusiness_id !== undefined
          ? String(Plasbusiness_id).trim()
          : "",
    };

    // otherDetails: jsonb for product options (size, color, model, etc.)
    if (otherDetails != null && typeof otherDetails === "object") {
      const opts = Array.isArray(otherDetails.options)
        ? otherDetails.options.filter(
            (o: any) =>
              o &&
              typeof o.key === "string" &&
              typeof o.label === "string" &&
              Array.isArray(o.values)
          )
        : [];
      variables.otherDetails = opts.length > 0 ? { options: opts } : null;
    } else {
      variables.otherDetails = null;
    }

    // Handle store_id: null for services, or a valid UUID for products
    const hasStoreId =
      store_id !== null &&
      store_id !== undefined &&
      typeof store_id === "string" &&
      store_id.trim() !== "";
    if (store_id === null || store_id === undefined) {
      variables.store_id = null;
    } else if (hasStoreId) {
      variables.store_id = store_id.trim();
    } else {
      variables.store_id = null;
    }

    // Store products start as "pending" for review; services use "active"
    variables.status = hasStoreId ? "pending" : status?.trim() || "active";

    const result = await hasuraClient.request<{
      insert_PlasBusinessProductsOrSerive: {
        affected_rows: number;
        returning: Array<{
          id: string;
          name: string;
          Description: string;
          Image: string;
          price: string;
          unit: string;
          status: string;
          created_at: string;
        }>;
      };
    }>(CREATE_BUSINESS_PRODUCT, variables);

    if (
      !result.insert_PlasBusinessProductsOrSerive ||
      result.insert_PlasBusinessProductsOrSerive.affected_rows === 0
    ) {
      throw new Error("Failed to create business product");
    }

    const createdProduct =
      result.insert_PlasBusinessProductsOrSerive.returning[0];

    // Notify Slack for review when it's a store product (pending status)
    if (hasStoreId && createdProduct.status === "pending") {
      try {
        const storeIdVal = variables.store_id as string;
        const storeNameQuery = gql`
          query GetStoreName($id: uuid!) {
            business_stores_by_pk(id: $id) {
              name
            }
          }
        `;
        const storeResult = await hasuraClient.request<{
          business_stores_by_pk: { name: string | null } | null;
        }>(storeNameQuery, { id: storeIdVal });
        const storeName =
          storeResult.business_stores_by_pk?.name ?? "Unknown store";

        await sendNewStoreProductForReviewToSlack({
          productId: createdProduct.id,
          productName: createdProduct.name,
          storeId: storeIdVal,
          storeName,
          price: createdProduct.price,
          unit: createdProduct.unit,
          category: validCategory || undefined,
          queryId: query_id || undefined,
          userEmail: session.user?.email ?? undefined,
          userName: session.user?.name ?? undefined,
          userPhone: (session.user as { phone?: string })?.phone ?? undefined,
          userId: session.user?.id,
          businessAccountId: variables.Plasbusiness_id || undefined,
        });
      } catch (slackErr) {
        console.error(
          "Failed to send product review notification to Slack:",
          slackErr
        );
        // Don't fail the request - product was created successfully
      }
    }

    return res.status(200).json({
      success: true,
      product: {
        id: createdProduct.id,
        name: createdProduct.name,
        description: createdProduct.Description,
        image: createdProduct.Image,
        price: createdProduct.price,
        unit: createdProduct.unit,
        status: createdProduct.status,
        queryId: query_id || "",
        createdAt: createdProduct.created_at,
      },
    });
  } catch (error: any) {
    const errorMessage =
      error.response?.errors?.[0]?.message || error.message || "Unknown error";
    const errorCode = error.response?.errors?.[0]?.extensions?.code;
    const errorPath = error.response?.errors?.[0]?.extensions?.path;
    const allErrors = error.response?.errors || [];

    return res.status(500).json({
      error: "Failed to create business product",
      message: errorMessage,
      code: errorCode,
      path: errorPath,
      details: allErrors,
    });
  }
}
