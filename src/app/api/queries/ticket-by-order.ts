import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_TICKET_BY_ORDER = gql`
  query GetTicketByOrder($subject: String!, $user_id: uuid!) {
    tickets(
      where: { subject: { _eq: $subject }, user_id: { _eq: $user_id } }
      order_by: { created_on: desc }
      limit: 1
    ) {
      ticket_num
      status
      subject
      created_on
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const orderId = req.query.orderId as string | undefined;
  const orderDisplayId = req.query.orderDisplayId as string | undefined;

  if (!orderId && orderDisplayId == null) {
    return res.status(400).json({
      error: "Missing orderId or orderDisplayId",
    });
  }

  const displayId = orderDisplayId ?? orderId;
  const subject = `Order issue #${displayId}`;

  try {
    if (!hasuraClient) {
      return res.status(503).json({ error: "Service unavailable" });
    }

    const result = await hasuraClient.request<{
      tickets: Array<{
        ticket_num: number;
        status: string;
        subject: string;
        created_on: string;
      }>;
    }>(GET_TICKET_BY_ORDER, {
      subject,
      user_id: session.user.id,
    });

    const ticket = result?.tickets?.[0] ?? null;
    return res.status(200).json({ ticket });
  } catch (err) {
    console.error("ticket-by-order error:", err);
    return res.status(500).json({
      error: "Failed to fetch ticket",
    });
  }
}
