import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const UPDATE_BUSINESS_PRODUCT_ORDER_STATUS = gql`
  mutation UpdateBusinessProductOrderStatus($id: uuid!, $status: String!) {
    update_businessProductOrders_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status }
    ) {
      id
      status
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

    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["orderId", "status"],
      });
    }

    const result = await hasuraClient.request<{
      update_businessProductOrders_by_pk: {
        id: string;
        status: string;
      };
    }>(UPDATE_BUSINESS_PRODUCT_ORDER_STATUS, {
      id: orderId,
      status,
    });

    if (!result.update_businessProductOrders_by_pk) {
      return res.status(500).json({ error: "Failed to update order status" });
    }

    return res.status(200).json({
      success: true,
      order: result.update_businessProductOrders_by_pk,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to update order status",
      message: error.message,
    });
  }
}
