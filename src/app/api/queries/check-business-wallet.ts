import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const CHECK_BUSINESS_WALLET = gql`
  query CheckBusinessWallet($business_id: uuid!) {
    business_wallet(where: { business_id: { _eq: $business_id } }) {
      id
      business_id
      amount
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
  if (req.method !== "GET" && req.method !== "POST") {
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

    const { business_id } = req.method === "GET" ? req.query : req.body;

    if (!business_id) {
      return res.status(400).json({ error: "Business ID is required" });
    }

    const result = await hasuraClient.request<{
      business_wallet: Array<{
        id: string;
        business_id: string;
        amount: string;
      }>;
    }>(CHECK_BUSINESS_WALLET, { business_id });

    const hasWallet =
      result.business_wallet && result.business_wallet.length > 0;
    const wallet = hasWallet ? result.business_wallet[0] : null;

    return res.status(200).json({
      hasWallet,
      wallet,
    });
  } catch (error: any) {
    console.error("Error checking business wallet:", error);
    return res.status(500).json({
      error: "Failed to check business wallet",
      message: error.message,
    });
  }
}
