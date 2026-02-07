import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_RFQ_DETAILS_AND_RESPONSES = gql`
  query GetRFQDetailsAndResponses($rfq_id: uuid!) {
    bussines_RFQ_by_pk(id: $rfq_id) {
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
      requirements
      notes
      contact_name
      email
      phone
      attachment
      business_id
      user_id
      created_at
      updated_at
      open
      business_account {
        id
        business_name
        business_email
        business_phone
        business_location
        account_type
        face_image
        status
      }
    }
    BusinessQoute(
      where: { businessRfq_id: { _eq: $rfq_id } }
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
      business_account {
        id
        business_name
        business_email
        business_phone
        business_location
        account_type
        face_image
        status
        user_id
        Users {
          id
          name
          email
          phone
        }
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

    const { rfq_id } = req.query;

    if (!rfq_id || typeof rfq_id !== "string") {
      return res.status(400).json({ error: "RFQ ID is required" });
    }

    const result = await hasuraClient.request<{
      bussines_RFQ_by_pk: {
        id: string;
        title: string;
        description: string | null;
        category: string | null;
        min_budget: string | null;
        max_budget: string | null;
        location: string | null;
        response_date: string | null;
        urgency_level: string | null;
        estimated_quantity: string | null;
        expected_delivery_date: string | null;
        payment_terms: string | null;
        requirements: any;
        notes: string | null;
        contact_name: string | null;
        email: string | null;
        phone: string | null;
        attachment: string | null;
        business_id: string | null;
        user_id: string;
        created_at: string;
        updated_at: string | null;
        open: boolean;
        business_account: {
          id: string;
          business_name: string | null;
          business_email: string | null;
          business_phone: string | null;
          business_location: string | null;
          account_type: string;
          face_image: string | null;
          status: string;
        } | null;
      } | null;
      BusinessQoute: Array<{
        id: string;
        businessRfq_id: string;
        respond_business_id: string;
        qouteAmount: string;
        currency: string | null;
        delivery_time: string | null;
        quote_validity: string | null;
        message: string | null;
        PaymentTerms: string | null;
        DeliveryTerms: string | null;
        warrantly: string | null;
        cancellatioinTerms: string | null;
        attachement: string | null;
        attachment_1: string | null;
        attachment_2: string | null;
        status: string | null;
        created_at: string;
        updated_at: string | null;
        business_account: {
          id: string;
          business_name: string | null;
          business_email: string | null;
          business_phone: string | null;
          business_location: string | null;
          account_type: string;
          face_image: string | null;
          status: string;
          user_id: string;
          Users: {
            id: string;
            name: string | null;
            email: string | null;
            phone: string | null;
          } | null;
        } | null;
      }>;
    }>(GET_RFQ_DETAILS_AND_RESPONSES, {
      rfq_id: rfq_id,
    });

    if (!result.bussines_RFQ_by_pk) {
      return res.status(404).json({ error: "RFQ not found" });
    }

    return res.status(200).json({
      success: true,
      rfq: result.bussines_RFQ_by_pk,
      responses: result.BusinessQoute || [],
    });
  } catch (error: any) {
    console.error("Error fetching RFQ details and responses:", error);
    return res.status(500).json({
      error: "Failed to fetch RFQ details and responses",
      message: error.message,
    });
  }
}
