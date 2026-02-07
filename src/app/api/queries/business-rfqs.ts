import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_BUSINESS_RFQS = gql`
  query GetBusinessRFQs($user_id: uuid, $business_id: uuid) {
    bussines_RFQ(
      where: {
        _and: [
          { user_id: { _eq: $user_id } }
          { business_id: { _eq: $business_id } }
        ]
      }
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
      // If no business account, we'll still query with user_id only
    }

    // Build query variables
    const variables: any = {
      user_id: user_id,
    };

    // Only add business_id filter if we have one
    if (business_id) {
      variables.business_id = business_id;
    } else {
      // If no business_id, query only by user_id (business_id can be null)
      const GET_RFQS_BY_USER = gql`
        query GetRFQsByUser($user_id: uuid!) {
          bussines_RFQ(
            where: {
              _and: [
                { user_id: { _eq: $user_id } }
                { business_id: { _is_null: true } }
              ]
            }
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
          }
        }
      `;
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
          requirements: any;
          notes: string;
          contact_name: string;
          email: string;
          phone: string;
          attachment: string;
          business_id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        }>;
      }>(GET_RFQS_BY_USER, variables);

      return res.status(200).json({
        rfqs: result.bussines_RFQ || [],
      });
    }

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
        requirements: any;
        notes: string;
        contact_name: string;
        email: string;
        phone: string;
        attachment: string;
        business_id: string;
        user_id: string;
        created_at: string;
        updated_at: string;
      }>;
    }>(GET_BUSINESS_RFQS, variables);

    return res.status(200).json({
      rfqs: result.bussines_RFQ || [],
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to fetch business RFQs",
      message: error.message,
    });
  }
}
