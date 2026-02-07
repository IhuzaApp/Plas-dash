import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const CREATE_BUSINESS_RFQ = gql`
  mutation CreateBusinessRFQ(
    $attachment: String = ""
    $business_id: uuid = ""
    $category: String = ""
    $contact_name: String = ""
    $description: String = ""
    $email: String = ""
    $estimated_quantity: String = ""
    $expected_delivery_date: String = ""
    $location: String = ""
    $max_budget: String = ""
    $min_budget: String = ""
    $notes: String = ""
    $title: String = ""
    $requirements: json = ""
    $response_date: String = ""
    $phone: String = ""
    $payment_terms: String = ""
    $delivery_terms: String = ""
    $warranty_information: String = ""
    $cancellation_terms: String = ""
    $urgency_level: String = ""
    $user_id: uuid = ""
  ) {
    insert_bussines_RFQ(
      objects: {
        attachment: $attachment
        business_id: $business_id
        category: $category
        contact_name: $contact_name
        description: $description
        email: $email
        estimated_quantity: $estimated_quantity
        expected_delivery_date: $expected_delivery_date
        location: $location
        max_budget: $max_budget
        min_budget: $min_budget
        notes: $notes
        title: $title
        requirements: $requirements
        response_date: $response_date
        phone: $phone
        payment_terms: $payment_terms
        delivery_terms: $delivery_terms
        warranty_information: $warranty_information
        cancellation_terms: $cancellation_terms
        urgency_level: $urgency_level
        user_id: $user_id
      }
    ) {
      affected_rows
      returning {
        id
        title
        description
        category
        created_at
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

interface CreateBusinessRFQInput {
  title: string;
  description: string;
  category: string;
  min_budget?: string;
  max_budget?: string;
  location: string;
  response_date: string;
  urgency_level?: string;
  estimated_quantity?: string;
  expected_delivery_date?: string;
  payment_terms?: string;
  delivery_terms?: string;
  warranty_information?: string;
  cancellation_terms?: string;
  requirements?: any;
  notes?: string;
  contact_name: string;
  email: string;
  phone?: string;
  attachment?: string;
  business_id?: string;
  user_id?: string;
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

    const {
      title,
      description,
      category,
      min_budget,
      max_budget,
      location,
      response_date,
      urgency_level,
      estimated_quantity,
      expected_delivery_date,
      payment_terms,
      delivery_terms,
      warranty_information,
      cancellation_terms,
      requirements,
      notes,
      contact_name,
      email,
      phone,
      attachment,
      business_id,
      user_id,
    } = req.body as CreateBusinessRFQInput;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ error: "Description is required" });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({ error: "Category is required" });
    }

    if (!location || !location.trim()) {
      return res.status(400).json({ error: "Location is required" });
    }

    if (!response_date || !response_date.trim()) {
      return res.status(400).json({ error: "Response date is required" });
    }

    if (!contact_name || !contact_name.trim()) {
      return res.status(400).json({ error: "Contact name is required" });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Get user_id from session if not provided
    const final_user_id = user_id || session?.user?.id || "";

    // Get business_id from business account if not provided
    let final_business_id = business_id;
    if (!final_business_id && final_user_id) {
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
          user_id: final_user_id,
        });
        if (
          accountResult.business_accounts &&
          accountResult.business_accounts.length > 0
        ) {
          final_business_id = accountResult.business_accounts[0].id;
        }
      } catch (error) {
        // Silently fail - business_id is optional
      }
    }

    // Convert requirements array to JSON if it's an array
    let requirementsJson = "";
    if (requirements) {
      if (Array.isArray(requirements)) {
        requirementsJson = JSON.stringify(
          requirements.filter((r) => r.trim() !== "")
        );
      } else if (typeof requirements === "string") {
        requirementsJson = requirements;
      } else {
        requirementsJson = JSON.stringify(requirements);
      }
    }

    const variables: Record<string, any> = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      location: location.trim(),
      response_date: response_date.trim(),
      contact_name: contact_name.trim(),
      email: email.trim(),
      min_budget: min_budget ? min_budget.trim() : "",
      max_budget: max_budget ? max_budget.trim() : "",
      urgency_level: urgency_level ? urgency_level.trim() : "",
      estimated_quantity: estimated_quantity ? estimated_quantity.trim() : "",
      expected_delivery_date: expected_delivery_date
        ? expected_delivery_date.trim()
        : "",
      payment_terms: payment_terms ? payment_terms.trim() : "",
      delivery_terms: delivery_terms ? delivery_terms.trim() : "",
      warranty_information: warranty_information
        ? warranty_information.trim()
        : "",
      cancellation_terms: cancellation_terms ? cancellation_terms.trim() : "",
      requirements: requirementsJson || "[]",
      notes: notes ? notes.trim() : "",
      phone: phone ? phone.trim() : "",
      attachment: attachment ? attachment.trim() : "",
      business_id: final_business_id || "",
      user_id: final_user_id,
    };

    const result = await hasuraClient.request<{
      insert_bussines_RFQ: {
        affected_rows: number;
        returning: Array<{
          id: string;
          title: string;
          description: string;
          category: string;
          created_at: string;
        }>;
      };
    }>(CREATE_BUSINESS_RFQ, variables);

    if (
      !result.insert_bussines_RFQ ||
      result.insert_bussines_RFQ.affected_rows === 0
    ) {
      throw new Error("Failed to create business RFQ");
    }

    const createdRFQ = result.insert_bussines_RFQ.returning[0];

    return res.status(200).json({
      success: true,
      rfq: {
        id: createdRFQ.id,
        title: createdRFQ.title,
        description: createdRFQ.description,
        category: createdRFQ.category,
        createdAt: createdRFQ.created_at,
      },
    });
  } catch (error: any) {
    const errorMessage =
      error.response?.errors?.[0]?.message || error.message || "Unknown error";
    const errorCode = error.response?.errors?.[0]?.extensions?.code;
    const errorPath = error.response?.errors?.[0]?.extensions?.path;
    const allErrors = error.response?.errors || [];

    return res.status(500).json({
      error: "Failed to create business RFQ",
      message: errorMessage,
      code: errorCode,
      path: errorPath,
      details: allErrors,
    });
  }
}
