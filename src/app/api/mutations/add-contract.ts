import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const ADD_CONTRACT = gql`
  mutation AddContract(
    $bussinessProfile_id: uuid = ""
    $clientPhoto: String = ""
    $clientSignature: String = ""
    $contract_Value: String = ""
    $done_at: timestamptz = ""
    $dueDate: String = ""
    $duration: String = ""
    $endDate: date = ""
    $paymentSchedule: String = ""
    $paymentTerms: String = ""
    $projecDeliverables: jsonb = ""
    $proofAggred: Boolean = false
    $rfq_response_id: uuid = ""
    $specialConditions: String = ""
    $startDate: date = ""
    $supplierPhoto: String = ""
    $supplierSignature: String = ""
    $terminationTerms: String = ""
    $type: String = ""
    $value: String = ""
    $status: String = ""
  ) {
    insert_BusinessContracts(
      objects: {
        bussinessProfile_id: $bussinessProfile_id
        clientPhoto: $clientPhoto
        clientSignature: $clientSignature
        contract_Value: $contract_Value
        done_at: $done_at
        dueDate: $dueDate
        duration: $duration
        endDate: $endDate
        paymentSchedule: $paymentSchedule
        paymentTerms: $paymentTerms
        projecDeliverables: $projecDeliverables
        proofAggred: $proofAggred
        rfq_response_id: $rfq_response_id
        specialConditions: $specialConditions
        startDate: $startDate
        supplierPhoto: $supplierPhoto
        supplierSignature: $supplierSignature
        terminationTerms: $terminationTerms
        type: $type
        value: $value
        status: $status
      }
    ) {
      affected_rows
    }
  }
`;

const UPDATE_QUOTE_STATUS = gql`
  mutation UpdateQuoteStatus($quote_id: uuid!, $status: String!) {
    update_BusinessQoute_by_pk(
      pk_columns: { id: $quote_id }
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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

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

    const user_id = session.user.id;

    // Get business account ID (business profile ID)
    let businessProfileId: string | null = null;
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
        businessProfileId = accountResult.business_accounts[0].id;
      }
    } catch (error) {
      console.error("Error fetching business account:", error);
    }

    if (!businessProfileId) {
      return res.status(400).json({ error: "Business account not found" });
    }

    const {
      rfq_response_id,
      contract_Value,
      value,
      type,
      startDate,
      endDate,
      duration,
      dueDate,
      paymentSchedule,
      paymentTerms,
      terminationTerms,
      specialConditions,
      projecDeliverables,
      clientSignature,
      clientPhoto,
      supplierSignature,
      supplierPhoto,
      proofAggred,
      status = "pending",
    } = req.body;

    if (!rfq_response_id) {
      return res.status(400).json({ error: "RFQ response ID is required" });
    }

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required" });
    }

    // Verify that the quote response exists and get the RFQ ID
    let businessRfqId: string | null = null;
    try {
      const VERIFY_QUOTE_RESPONSE = gql`
        query VerifyQuoteResponse($quote_id: uuid!) {
          BusinessQoute_by_pk(id: $quote_id) {
            id
            businessRfq_id
            status
          }
        }
      `;
      const quoteResult = await hasuraClient.request<{
        BusinessQoute_by_pk: {
          id: string;
          businessRfq_id: string;
          status: string;
        } | null;
      }>(VERIFY_QUOTE_RESPONSE, {
        quote_id: rfq_response_id,
      });

      if (!quoteResult.BusinessQoute_by_pk) {
        return res.status(404).json({
          error: "Quote response not found",
          message: `No quote response found with ID: ${rfq_response_id}`,
        });
      }

      businessRfqId = quoteResult.BusinessQoute_by_pk.businessRfq_id;
      console.log("Verified quote response:", quoteResult.BusinessQoute_by_pk);
      console.log("Business RFQ ID:", businessRfqId);
    } catch (verifyError: any) {
      console.error("Error verifying quote response:", verifyError);
      return res.status(400).json({
        error: "Failed to verify quote response",
        message:
          verifyError.message || "Could not verify quote response exists",
      });
    }

    // Use contract_Value if provided, otherwise use value
    const contractValue = contract_Value || value || "0";

    // Set done_at to current timestamp if proofAggred is true
    const doneAt = proofAggred ? new Date().toISOString() : null;

    console.log("Attempting to create contract with:", {
      bussinessProfile_id: businessProfileId,
      rfq_response_id: rfq_response_id,
      businessRfqId: businessRfqId,
      startDate,
      endDate,
    });

    // Based on the foreign key constraint, rfq_response_id might actually need to be the RFQ ID (bussines_RFQ.id)
    // instead of the quote response ID (BusinessQoute.id). Let's try using businessRfqId if available.
    // If the foreign key points to bussines_RFQ table, we should use businessRfqId
    const rfqIdToUse = businessRfqId || rfq_response_id;

    console.log("Using RFQ ID for foreign key:", rfqIdToUse);

    const result = await hasuraClient.request<{
      insert_BusinessContracts: {
        affected_rows: number;
      };
    }>(ADD_CONTRACT, {
      bussinessProfile_id: businessProfileId,
      rfq_response_id: rfqIdToUse, // Try using businessRfqId if foreign key points to bussines_RFQ table
      contract_Value: contractValue,
      value: value || contractValue,
      type: type || "",
      startDate: startDate,
      endDate: endDate,
      duration: duration || "",
      dueDate: dueDate || "",
      paymentSchedule: paymentSchedule || "",
      paymentTerms: paymentTerms || "",
      terminationTerms: terminationTerms || "",
      specialConditions: specialConditions || "",
      projecDeliverables: projecDeliverables || null,
      clientSignature: clientSignature || "",
      clientPhoto: clientPhoto || "",
      supplierSignature: supplierSignature || "",
      supplierPhoto: supplierPhoto || "",
      proofAggred: proofAggred || false,
      done_at: doneAt || "",
      status: status || "waiting_for_supplier", // Default to waiting_for_supplier if not provided
    });

    // Update the quote response status to "accepted"
    try {
      await hasuraClient.request<{
        update_BusinessQoute_by_pk: {
          id: string;
          status: string;
        } | null;
      }>(UPDATE_QUOTE_STATUS, {
        quote_id: rfq_response_id,
        status: "accepted",
      });
    } catch (quoteUpdateError) {
      console.error("Error updating quote status:", quoteUpdateError);
      // Don't fail the entire request if quote update fails
    }

    return res.status(200).json({
      success: true,
      affected_rows: result.insert_BusinessContracts.affected_rows,
    });
  } catch (error: any) {
    console.error("Error adding contract:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response,
      request: error.request,
    });

    // Extract GraphQL errors if present
    const graphqlErrors = error.response?.errors || [];
    const errorMessages = graphqlErrors
      .map((err: any) => err.message)
      .join(", ");

    return res.status(500).json({
      error: "Failed to add contract",
      message: error.message || "Unknown error",
      graphqlErrors: errorMessages || undefined,
      details: error.response?.errors || undefined,
    });
  }
}
