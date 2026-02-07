import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_USER_RFQ_QUOTE = gql`
  query GetUserRFQQuote($businessRfq_id: uuid!, $respond_business_id: uuid!) {
    BusinessQoute(
      where: {
        businessRfq_id: { _eq: $businessRfq_id }
        respond_business_id: { _eq: $respond_business_id }
      }
      limit: 1
      order_by: { created_at: desc }
    ) {
      id
      businessRfq_id
      respond_business_id
      qouteAmount
      currency
      delivery_time
      quote_validity
      message
      PaymentTerms
      DeliveryTerms
      warrantly
      cancellatioinTerms
      attachement
      attachment_1
      attachment_2
      status
      created_at
      updated_at
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
  if (req.method !== "GET") {
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
    const { rfqId } = req.query;

    if (!rfqId || typeof rfqId !== "string") {
      return res.status(400).json({ error: "RFQ ID is required" });
    }

    // Get business_id from business account
    let business_id: string | null = null;
    try {
      const CHECK_BUSINESS_ACCOUNT = gql`
        query CheckBusinessAccount($user_id: uuid!) {
          business_accounts(where: { user_id: { _eq: $user_id } }, limit: 1) {
            id
          }
        }
      `;
      const accountResult = await hasuraClient.request<{
        business_accounts: Array<{ id: string }>;
      }>(CHECK_BUSINESS_ACCOUNT, {
        user_id: user_id,
      });
      if (
        accountResult.business_accounts &&
        accountResult.business_accounts.length > 0
      ) {
        business_id = accountResult.business_accounts[0].id;
      }
    } catch (error) {
      // If no business account, return empty result
      return res.status(200).json({ quote: null });
    }

    if (!business_id) {
      return res.status(200).json({ quote: null });
    }

    const result = await hasuraClient.request<{
      BusinessQoute: Array<{
        id: string;
        businessRfq_id: string;
        respond_business_id: string;
        qouteAmount: string;
        currency: string;
        delivery_time: string;
        quote_validity: string;
        message: string;
        PaymentTerms: string;
        DeliveryTerms: string;
        warrantly: string;
        cancellatioinTerms: string;
        attachement: string;
        attachment_1: string;
        attachment_2: string;
        status: string;
        created_at: string;
        updated_at: string;
      }>;
    }>(GET_USER_RFQ_QUOTE, {
      businessRfq_id: rfqId,
      respond_business_id: business_id,
    });

    const quote =
      result.BusinessQoute && result.BusinessQoute.length > 0
        ? result.BusinessQoute[0]
        : null;

    return res.status(200).json({ quote });
  } catch (error: any) {
    console.error("Error fetching user RFQ quote:", error);
    return res.status(500).json({
      error: "Failed to fetch quote",
      message: error.message,
    });
  }
}
