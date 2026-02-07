import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_BUSINESS_SUBMITTED_QUOTES = gql`
  query GetBusinessSubmittedQuotes($respond_business_id: uuid!) {
    BusinessQoute(
      where: { respond_business_id: { _eq: $respond_business_id } }
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
      bussines_RFQ {
        id
        title
        description
        category
        min_budget
        max_budget
        location
        response_date
        created_at
        business_account {
          business_name
          business_email
          business_phone
          account_type
          business_location
          face_image
          created_at
          id
          id_image
          rdb_certificate
          status
          updated_at
          user_id
        }
        attachment
        contact_name
        email
        estimated_quantity
        expected_delivery_date
        notes
        open
        payment_terms
        phone
        requirements
        updated_at
        urgency_level
        user_id
        business_id
      }
      business_account {
        id
        business_name
        business_email
        business_phone
        business_location
        account_type
        face_image
        created_at
        id_image
        rdb_certificate
        status
        updated_at
        user_id
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

    const user_id = session.user.id;

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
      console.error("Error fetching business account:", error);
    }

    if (!business_id) {
      return res.status(200).json({ quotes: [] });
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
        bussines_RFQ: {
          id: string;
          title: string;
          description: string;
          category: string;
          min_budget: string;
          max_budget: string;
          location: string;
          response_date: string;
          created_at: string;
          business_account: {
            business_name: string;
            business_email: string;
            business_phone: string;
            account_type: string;
            business_location: string;
            face_image: string;
            created_at: string;
            id: string;
            id_image: string;
            rdb_certificate: string;
            status: string;
            updated_at: string;
            user_id: string;
          };
          attachment: string;
          contact_name: string;
          email: string;
          estimated_quantity: string;
          expected_delivery_date: string;
          notes: string;
          open: boolean;
          payment_terms: string;
          phone: string;
          requirements: any;
          updated_at: string;
          urgency_level: string;
          user_id: string;
          business_id: string;
        };
        business_account: {
          id: string;
          business_name: string;
          business_email: string;
          business_phone: string;
          business_location: string;
          account_type: string;
          face_image: string;
          created_at: string;
          id_image: string;
          rdb_certificate: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
      }>;
    }>(GET_BUSINESS_SUBMITTED_QUOTES, {
      respond_business_id: business_id,
    });

    return res.status(200).json({
      success: true,
      quotes: result.BusinessQoute || [],
    });
  } catch (error: any) {
    console.error("Error fetching business submitted quotes:", error);
    return res.status(500).json({
      error: "Failed to fetch quotes",
      message: error.message,
    });
  }
}
