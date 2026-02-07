import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_BUSINESS_CONTRACTS = gql`
  query GetBusinessContracts(
    $businessProfileId: uuid!
    $supplierBusinessId: uuid!
  ) {
    # Contracts where user is the client (created the contract)
    BusinessContracts_Client: BusinessContracts(
      where: { bussinessProfile_id: { _eq: $businessProfileId } }
    ) {
      id
      bussinessProfile_id
      rfq_response_id
      contract_Value
      value
      type
      startDate
      endDate
      duration
      dueDate
      paymentSchedule
      paymentTerms
      terminationTerms
      specialConditions
      projecDeliverables
      clientSignature
      clientPhoto
      supplierSignature
      supplierPhoto
      proofAggred
      done_at
      status
      update_on
      business_account {
        id
        business_name
        business_email
        business_phone
        business_location
        face_image
      }
      bussines_RFQ {
        id
        title
        description
        business_id
        user_id
      }
    }
    # Contracts where user is the supplier (quote was submitted by them)
    # First get quotes where user is supplier
    SupplierQuotes: BusinessQoute(
      where: { respond_business_id: { _eq: $supplierBusinessId } }
    ) {
      id
      businessRfq_id
      qouteAmount
      currency
      respond_business_id
      business_account {
        id
        business_name
        business_email
        business_phone
        business_location
        face_image
      }
    }
    # Then get contracts for those RFQs (we'll filter in code)
    BusinessContracts_Supplier: BusinessContracts {
      id
      bussinessProfile_id
      rfq_response_id
      contract_Value
      value
      type
      startDate
      endDate
      duration
      dueDate
      paymentSchedule
      paymentTerms
      terminationTerms
      specialConditions
      projecDeliverables
      clientSignature
      clientPhoto
      supplierSignature
      supplierPhoto
      proofAggred
      done_at
      status
      update_on
      business_account {
        id
        business_name
        business_email
        business_phone
        business_location
        face_image
      }
      bussines_RFQ {
        id
        title
        description
        business_id
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
      return res.status(200).json({ contracts: [] });
    }

    const result = await hasuraClient.request<{
      BusinessContracts_Client: Array<{
        id: string;
        bussinessProfile_id: string;
        rfq_response_id: string;
        contract_Value: string;
        value: string;
        type: string;
        startDate: string;
        endDate: string;
        duration: string | null;
        dueDate: string | null;
        paymentSchedule: string | null;
        paymentTerms: string | null;
        terminationTerms: string | null;
        specialConditions: string | null;
        projecDeliverables: any;
        clientSignature: string | null;
        clientPhoto: string | null;
        supplierSignature: string | null;
        supplierPhoto: string | null;
        proofAggred: boolean;
        done_at: string | null;
        status: string;
        update_on: string | null;
        business_account: {
          id: string;
          business_name: string | null;
          business_email: string | null;
          business_phone: string | null;
          business_location: string | null;
          face_image: string | null;
        } | null;
        bussines_RFQ: {
          id: string;
          title: string | null;
          description: string | null;
          business_id: string | null;
          user_id: string;
        } | null;
      }>;
      BusinessContracts_Supplier: Array<{
        id: string;
        bussinessProfile_id: string;
        rfq_response_id: string;
        contract_Value: string;
        value: string;
        type: string;
        startDate: string;
        endDate: string;
        duration: string | null;
        dueDate: string | null;
        paymentSchedule: string | null;
        paymentTerms: string | null;
        terminationTerms: string | null;
        specialConditions: string | null;
        projecDeliverables: any;
        clientSignature: string | null;
        clientPhoto: string | null;
        supplierSignature: string | null;
        supplierPhoto: string | null;
        proofAggred: boolean;
        done_at: string | null;
        status: string;
        update_on: string | null;
        business_account: {
          id: string;
          business_name: string | null;
          business_email: string | null;
          business_phone: string | null;
          business_location: string | null;
          face_image: string | null;
        } | null;
        bussines_RFQ: {
          id: string;
          title: string | null;
          description: string | null;
          business_id: string | null;
          user_id: string;
        } | null;
      }>;
      SupplierQuotes: Array<{
        id: string;
        businessRfq_id: string;
        qouteAmount: string;
        currency: string | null;
        respond_business_id: string;
        business_account: {
          id: string;
          business_name: string | null;
          business_email: string | null;
          business_phone: string | null;
          business_location: string | null;
          face_image: string | null;
        } | null;
      }>;
    }>(GET_BUSINESS_CONTRACTS, {
      businessProfileId: businessProfileId,
      supplierBusinessId: businessProfileId, // Same ID, used to find contracts where user is supplier
    });

    // Get supplier quote IDs and their RFQ IDs
    const supplierQuoteIds = new Set(
      (result.SupplierQuotes || []).map((q) => q.id)
    );
    const supplierRfqIds = new Set(
      (result.SupplierQuotes || []).map((q) => q.businessRfq_id)
    );

    // Create a map of RFQ ID to quote data for supplier quotes
    const supplierQuoteMap = new Map(
      (result.SupplierQuotes || []).map((q) => [q.businessRfq_id, q])
    );

    // Filter supplier contracts: contracts where the RFQ ID matches supplier's RFQ IDs
    const supplierContracts = (result.BusinessContracts_Supplier || []).filter(
      (contract) => {
        const rfqId = contract.bussines_RFQ?.id;
        return rfqId && supplierRfqIds.has(rfqId);
      }
    );

    // Combine contracts from both perspectives (client and supplier)
    const allContracts = [
      ...(result.BusinessContracts_Client || []),
      ...supplierContracts,
    ];

    // Remove duplicates based on contract ID and sort by update_on (most recent first)
    const supplierContractIds = new Set(supplierContracts.map((c) => c.id));
    const uniqueContracts = Array.from(
      new Map(allContracts.map((contract) => [contract.id, contract])).values()
    ).sort((a, b) => {
      // Sort by update_on descending (most recent first)
      const dateA = a.update_on ? new Date(a.update_on).getTime() : 0;
      const dateB = b.update_on ? new Date(b.update_on).getTime() : 0;
      return dateB - dateA;
    });

    // Transform contracts to match the expected format
    const contracts = uniqueContracts.map((contract) => {
      const rfq = contract.bussines_RFQ;
      // For supplier contracts, get quote info from the supplierQuoteMap
      // For client contracts, use business_account from contract
      const rfqId = rfq?.id;
      const supplierQuote = rfqId ? supplierQuoteMap.get(rfqId) : null;
      const supplierAccount =
        supplierQuote?.business_account || contract.business_account;
      const role = supplierContractIds.has(contract.id) ? "supplier" : "client";

      return {
        id: contract.id,
        role,
        contractId: contract.id.slice(0, 8).toUpperCase(),
        title: rfq?.title || "Contract",
        supplierName: supplierAccount?.business_name || "Unknown Supplier",
        supplierCompany: supplierAccount?.business_name || "Unknown Company",
        contractType: contract.type || "Service Agreement",
        status: (contract.status || "pending") as
          | "draft"
          | "pending"
          | "waiting_for_supplier"
          | "active"
          | "completed"
          | "terminated"
          | "expired"
          | "rejected",
        startDate: contract.startDate,
        endDate: contract.endDate,
        totalValue: parseFloat(
          contract.contract_Value || contract.value || "0"
        ),
        currency: supplierQuote?.currency || "RWF",
        paymentSchedule: contract.paymentSchedule || "Not specified",
        progress: 0, // Can be calculated based on deliverables if needed
        // Additional fields
        duration: contract.duration,
        paymentTerms: contract.paymentTerms,
        terminationTerms: contract.terminationTerms,
        specialConditions: contract.specialConditions,
        deliverables: contract.projecDeliverables || [],
        supplierId: supplierAccount?.id || "",
        quoteId: supplierQuote?.id || "",
        rfqId: rfq?.id || "",
        lastActivity: contract.update_on || contract.done_at || "",
        created: contract.update_on || contract.done_at || "",
        clientSignature: contract.clientSignature,
        supplierSignature: contract.supplierSignature,
        updated_at: contract.update_on,
        created_at: contract.done_at || contract.update_on,
        done_at: contract.done_at,
      };
    });

    return res.status(200).json({
      success: true,
      contracts: contracts,
    });
  } catch (error: any) {
    console.error("Error fetching business contracts:", error);
    return res.status(500).json({
      error: "Failed to fetch contracts",
      message: error.message,
    });
  }
}
