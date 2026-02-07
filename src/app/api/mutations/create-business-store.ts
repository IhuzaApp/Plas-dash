import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { notifyNewStoreCreatedToSlack } from "../../../src/lib/slackSystemNotifier";

// Single mutation that handles both cases (with or without category_id)
// Matches the format provided by the user
const CREATE_BUSINESS_STORE = gql`
  mutation CreateBusinessStore(
    $address: String = ""
    $business_id: uuid!
    $category_id: uuid
    $description: String = ""
    $image: String = ""
    $latitude: String = ""
    $longitude: String = ""
    $name: String!
    $operating_hours: json = ""
  ) {
    insert_business_stores(
      objects: {
        address: $address
        business_id: $business_id
        category_id: $category_id
        description: $description
        image: $image
        is_active: false
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
        business_id
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

interface CreateBusinessStoreInput {
  name: string;
  description?: string;
  category_id?: string;
  image?: string;
  latitude?: string;
  longitude?: string;
  address?: string;
  operating_hours?: any;
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

    const user_id = session.user.id;
    const {
      name,
      description,
      category_id,
      image,
      latitude,
      longitude,
      address,
      operating_hours,
    } = req.body as CreateBusinessStoreInput;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Store name is required" });
    }

    if (!latitude || !latitude.trim()) {
      return res
        .status(400)
        .json({ error: "Store location (latitude) is required" });
    }

    if (!longitude || !longitude.trim()) {
      return res
        .status(400)
        .json({ error: "Store location (longitude) is required" });
    }

    // Get the business account for this user
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

    // Check if wallet exists for this business (business_accounts.id)
    // If not, create one with amount "0"
    const checkWalletQuery = gql`
      query CheckBusinessWallet($business_id: uuid!) {
        business_wallet(where: { business_id: { _eq: $business_id } }) {
          id
          business_id
          amount
        }
      }
    `;

    try {
      const walletResult = await hasuraClient.request<{
        business_wallet: Array<{
          id: string;
          business_id: string;
          amount: string;
        }>;
      }>(checkWalletQuery, { business_id });

      const hasWallet =
        walletResult.business_wallet && walletResult.business_wallet.length > 0;

      if (!hasWallet) {
        // Create wallet with amount "0"
        const createWalletMutation = gql`
          mutation CreateBusinessWallet(
            $amount: String = ""
            $business_id: uuid!
          ) {
            insert_business_wallet(
              objects: { amount: $amount, business_id: $business_id }
            ) {
              affected_rows
              returning {
                id
                business_id
                amount
              }
            }
          }
        `;

        const createWalletResult = await hasuraClient.request<{
          insert_business_wallet: {
            affected_rows: number;
            returning: Array<{
              id: string;
              business_id: string;
              amount: string;
            }>;
          };
        }>(createWalletMutation, {
          business_id,
          amount: "0",
        });

        if (
          !createWalletResult.insert_business_wallet ||
          createWalletResult.insert_business_wallet.affected_rows === 0
        ) {
          // Wallet creation failed, but continue with store creation
        }
      }
    } catch (error: any) {
      // Wallet check/creation failed, but continue with store creation
    }

    // Prepare operating hours - convert to JSON if it's a string
    // If empty or not provided, use empty object {} (GraphQL json type needs an object, not empty string)
    let operatingHoursJson: any = {};
    if (operating_hours) {
      if (typeof operating_hours === "string") {
        try {
          const parsed = JSON.parse(operating_hours);
          operatingHoursJson = parsed;
        } catch {
          // If parsing fails, use empty object
          operatingHoursJson = {};
        }
      } else if (
        typeof operating_hours === "object" &&
        operating_hours !== null
      ) {
        operatingHoursJson = operating_hours;
      }
    }

    // Check if category_id is provided and valid
    const hasValidCategoryId =
      category_id &&
      category_id.trim() !== "" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        category_id.trim()
      );

    // Build variables object
    const variables: Record<string, any> = {
      address: address?.trim() || "",
      business_id,
      name: name.trim(),
      description: description?.trim() || "",
      image: image || "",
      latitude: latitude.trim(),
      longitude: longitude.trim(),
      operating_hours: operatingHoursJson,
      category_id: hasValidCategoryId ? category_id.trim() : null,
    };

    // Use single mutation that handles both cases
    const result = await hasuraClient.request<{
      insert_business_stores: {
        affected_rows: number;
        returning: Array<{
          id: string;
          name: string;
          description: string | null;
          business_id: string;
          created_at: string;
        }>;
      };
    }>(CREATE_BUSINESS_STORE, variables);

    if (
      !result.insert_business_stores ||
      result.insert_business_stores.affected_rows === 0
    ) {
      throw new Error("Failed to create business store");
    }

    const createdStore = result.insert_business_stores.returning[0];

    // Notify Slack with store info (fire-and-forget)
    try {
      await notifyNewStoreCreatedToSlack({
        storeName: createdStore.name,
        description: description ?? undefined,
        latitude: latitude?.trim(),
        longitude: longitude?.trim(),
        businessName: session.user.name ?? undefined,
      });
    } catch (notifyErr: any) {
      console.error("Slack new store notification failed:", notifyErr?.message);
    }

    return res.status(200).json({
      success: true,
      store: {
        id: createdStore.id,
        name: createdStore.name,
        description: createdStore.description,
        businessId: createdStore.business_id,
        createdAt: createdStore.created_at,
      },
    });
  } catch (error: any) {
    // Extract error details
    const errorMessage =
      error.response?.errors?.[0]?.message || error.message || "Unknown error";
    const errorCode = error.response?.errors?.[0]?.extensions?.code;
    const errorPath = error.response?.errors?.[0]?.extensions?.path;
    const allErrors = error.response?.errors || [];

    // Return error information
    return res.status(500).json({
      error: "Failed to create business store",
      message: errorMessage,
      code: errorCode,
      path: errorPath,
      details: allErrors,
    });
  }
}
