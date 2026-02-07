import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const CREATE_BUSINESS_WALLET = gql`
  mutation CreateBusinessWallet($amount: String = "", $business_id: uuid = "") {
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

    const { business_id, amount = "0" } = req.body;

    if (!business_id) {
      return res.status(400).json({ error: "Business ID is required" });
    }

    const result = await hasuraClient.request<{
      insert_business_wallet: {
        affected_rows: number;
        returning: Array<{
          id: string;
          business_id: string;
          amount: string;
        }>;
      };
    }>(CREATE_BUSINESS_WALLET, {
      business_id,
      amount: amount.toString(),
    });

    if (
      !result.insert_business_wallet ||
      result.insert_business_wallet.affected_rows === 0
    ) {
      throw new Error("Failed to create business wallet");
    }

    const createdWallet = result.insert_business_wallet.returning[0];

    return res.status(200).json({
      success: true,
      wallet: {
        id: createdWallet.id,
        businessId: createdWallet.business_id,
        amount: createdWallet.amount,
      },
    });
  } catch (error: any) {
    console.error("Error creating business wallet:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response,
      errors: error.response?.errors,
    });

    const errorMessage =
      error.response?.errors?.[0]?.message || error.message || "Unknown error";
    const errorCode = error.response?.errors?.[0]?.extensions?.code;

    return res.status(500).json({
      error: "Failed to create business wallet",
      message: errorMessage,
      code: errorCode,
      details: error.response?.errors || undefined,
    });
  }
}
