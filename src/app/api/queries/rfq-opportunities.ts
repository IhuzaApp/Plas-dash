import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_RFQ_OPPORTUNITIES = gql`
  query GetRFQOpportunities {
    bussines_RFQ(
      where: { open: { _eq: true } }
      order_by: { created_at: desc }
    ) {
      id
      title
      description
      category
      min_budget
      max_budget
      location
      response_date
      urgency_level
      estimated_quantity
      expected_delivery_date
      payment_terms
      delivery_terms
      warranty_information
      cancellation_terms
      requirements
      notes
      contact_name
      email
      phone
      attachment
      business_id
      user_id
      open
      created_at
      updated_at
      business_account {
        business_name
        account_type
        business_email
        business_location
        business_phone
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
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Make authentication optional - allow unauthenticated users to view RFQs for explorer
    let session: Session | null = null;
    try {
      session = (await getServerSession(
        req,
        res,
        authOptions as any
      )) as Session | null;
    } catch (authError: any) {
      // Log but don't fail - allow unauthenticated access for explorer view
      if (
        authError?.message?.includes("timeout") ||
        authError?.code === "UND_ERR_CONNECT_TIMEOUT"
      ) {
        console.warn(
          "Auth timeout - allowing unauthenticated access to RFQ opportunities"
        );
      } else {
        console.warn(
          "Auth error - allowing unauthenticated access:",
          authError?.message
        );
      }
    }

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    // Fetch all open RFQs regardless of user or business (available to everyone)
    const result = await hasuraClient.request<{
      bussines_RFQ: Array<{
        id: string;
        title: string;
        description: string;
        category: string;
        min_budget: string;
        max_budget: string;
        location: string;
        response_date: string;
        urgency_level: string;
        estimated_quantity: string;
        expected_delivery_date: string;
        payment_terms: string;
        delivery_terms: string | null;
        warranty_information: string | null;
        cancellation_terms: string | null;
        requirements: any;
        notes: string;
        contact_name: string;
        email: string;
        phone: string;
        attachment: string;
        business_id: string;
        user_id: string;
        open: boolean;
        created_at: string;
        updated_at: string;
        business_account: {
          business_name: string | null;
          account_type: string | null;
          business_email: string | null;
          business_location: string | null;
          business_phone: string | null;
        } | null;
      }>;
    }>(GET_RFQ_OPPORTUNITIES);

    console.log("API: Total RFQs fetched:", result.bussines_RFQ?.length || 0);
    console.log(
      "API: RFQ IDs:",
      result.bussines_RFQ?.map((rfq) => rfq.id)
    );
    console.log(
      "API: RFQ open status:",
      result.bussines_RFQ?.map((rfq) => ({ id: rfq.id, open: rfq.open }))
    );

    return res.status(200).json({
      rfqs: result.bussines_RFQ || [],
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to fetch RFQ opportunities",
      message: error.message,
    });
  }
}
