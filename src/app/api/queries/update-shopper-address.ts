import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]";
import { logger } from "../../../src/utils/logger";

const UPDATE_SHOPPER_ADDRESS = gql`
  mutation UpdateShopperAddress($shopper_id: uuid!, $address: String!) {
    update_shoppers_by_pk(
      pk_columns: { id: $shopper_id }
      _set: { address: $address, updated_at: "now()" }
    ) {
      id
      address
      updated_at
    }
  }
`;

interface Session {
  user?: {
    id: string;
  };
}

interface UpdateShopperAddressResult {
  update_shoppers_by_pk: {
    id: string;
    address: string;
    updated_at: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { shopper_id, address } = req.body;

    if (!shopper_id || !address) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!hasuraClient) {
      throw new Error("Hasura client not initialized");
    }

    const result = await hasuraClient.request<UpdateShopperAddressResult>(
      UPDATE_SHOPPER_ADDRESS,
      {
        shopper_id,
        address,
      }
    );

    const shopper = result.update_shoppers_by_pk;

    return res.status(200).json({
      shopper,
    });
  } catch (error) {
    logger.error(
      "Error updating shopper address:",
      error instanceof Error ? error.message : String(error)
    );
    return res.status(500).json({ message: "Internal server error" });
  }
}
