import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_CONTRACT_DETAILS = gql`
  query GetContractDetails($contractId: uuid!) {
    BusinessContracts_by_pk(id: $contractId) {
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
        contact_name
        email
        phone
        location
        estimated_quantity
        business_account {
          id
          business_name
          business_email
          business_phone
          business_location
          face_image
          account_type
          status
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

    const { id: contractId } = req.query;

    if (!contractId || typeof contractId !== "string") {
      return res.status(400).json({ error: "Contract ID is required" });
    }

    // Get quote information separately
    const contractResult = await hasuraClient.request<{
      BusinessContracts_by_pk: {
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
          business_account: {
            id: string;
            business_name: string | null;
            business_email: string | null;
            business_phone: string | null;
            business_location: string | null;
            face_image: string | null;
            account_type: string | null;
            status: string | null;
          } | null;
          contact_name: string | null;
          email: string | null;
          phone: string | null;
          location: string | null;
        } | null;
      } | null;
    }>(GET_CONTRACT_DETAILS, {
      contractId: contractId,
    });

    if (!contractResult.BusinessContracts_by_pk) {
      return res.status(404).json({ error: "Contract not found" });
    }

    const contract = contractResult.BusinessContracts_by_pk;
    const rfq = contract.bussines_RFQ;

    // Get quote information - rfq_response_id is actually the RFQ ID, not the quote ID
    // We need to find the quote where businessRfq_id matches rfq_response_id
    let quoteInfo = null;
    if (contract.rfq_response_id && rfq) {
      try {
        const GET_QUOTE_BY_RFQ = gql`
          query GetQuoteByRFQ($rfqId: uuid!) {
            BusinessQoute(
              where: {
                businessRfq_id: { _eq: $rfqId }
                status: { _in: ["accepted", "pending"] }
              }
              order_by: { created_at: desc }
              limit: 1
            ) {
              id
              businessRfq_id
              respond_business_id
              qouteAmount
              currency
              status
              delivery_time
              quote_validity
              message
              PaymentTerms
              DeliveryTerms
              warrantly
              cancellatioinTerms
              business_account {
                id
                business_name
                business_email
                business_phone
                business_location
                face_image
                account_type
                status
              }
            }
          }
        `;
        const quoteResult = await hasuraClient.request<{
          BusinessQoute: Array<{
            id: string;
            businessRfq_id: string;
            respond_business_id: string;
            qouteAmount: string;
            currency: string | null;
            status: string | null;
            business_account: {
              id: string;
              business_name: string | null;
              business_email: string | null;
              business_phone: string | null;
              business_location: string | null;
              face_image: string | null;
              account_type: string | null;
              status: string | null;
            } | null;
            delivery_time: string | null;
            quote_validity: string | null;
            message: string | null;
            PaymentTerms: string | null;
            DeliveryTerms: string | null;
            warrantly: string | null;
            cancellatioinTerms: string | null;
          }>;
        }>(GET_QUOTE_BY_RFQ, {
          rfqId: contract.rfq_response_id,
        });
        quoteInfo =
          quoteResult.BusinessQoute && quoteResult.BusinessQoute.length > 0
            ? quoteResult.BusinessQoute[0]
            : null;
      } catch (error) {
        console.error("Error fetching quote:", error);
      }
    }

    // Transform contract data
    // Client is the one who created the RFQ (bussines_RFQ.business_account)
    // Supplier is the one who responded to the quote (BusinessQoute.business_account)
    const clientAccount = rfq?.business_account || contract.business_account;
    const supplierAccount = quoteInfo?.business_account || null;

    // Get additional client info from RFQ if available
    const clientContactName = rfq?.contact_name || null;
    const clientContactEmail = rfq?.email || null;
    const clientContactPhone = rfq?.phone || null;
    const clientLocation = rfq?.location || null;

    const transformedContract = {
      id: contract.id,
      contractId: contract.id.slice(0, 8).toUpperCase(),
      title: rfq?.title || "Contract",
      supplierName: supplierAccount?.business_name || "Unknown Supplier",
      supplierCompany: supplierAccount?.business_name || "Unknown Company",
      supplierId: supplierAccount?.id || "",
      supplierEmail: supplierAccount?.business_email || "",
      supplierPhone: supplierAccount?.business_phone || "",
      supplierAddress: supplierAccount?.business_location || "",
      clientName:
        clientAccount?.business_name || clientContactName || "Client Company",
      clientCompany: clientAccount?.business_name || "Client Company",
      clientEmail: clientAccount?.business_email || clientContactEmail || "",
      clientPhone: clientAccount?.business_phone || clientContactPhone || "",
      clientAddress: clientAccount?.business_location || clientLocation || "",
      contractType: contract.type || "Service Agreement",
      status: contract.status || "pending",
      startDate: contract.startDate,
      endDate: contract.endDate,
      totalValue: parseFloat(contract.contract_Value || contract.value || "0"),
      currency: quoteInfo?.currency || "RWF",
      paymentSchedule: contract.paymentSchedule || "Not specified",
      progress: 0, // Will be calculated on frontend
      duration: contract.duration,
      paymentTerms: contract.paymentTerms,
      terminationTerms: contract.terminationTerms,
      specialConditions: contract.specialConditions,
      deliverables: Array.isArray(contract.projecDeliverables)
        ? contract.projecDeliverables.map((del: any, idx: number) => ({
            id: del.id || `del-${idx}`,
            description: del.description || "",
            dueDate: del.dueDate || "",
            value: del.value || 0,
            status: del.status || "pending",
          }))
        : [],
      supplierId_field: supplierAccount?.id || "",
      quoteId: quoteInfo?.id || "",
      rfqId: rfq?.id || "",
      rfqDescription: rfq?.description || "",
      estimatedQuantity: rfq?.estimated_quantity || null,
      lastActivity: contract.update_on || "",
      created: contract.update_on || "",
      doneAt: contract.done_at || null,
      updateOn: contract.update_on || null,
      clientSignature: contract.clientSignature,
      clientPhoto: contract.clientPhoto,
      supplierSignature: contract.supplierSignature,
      supplierPhoto: contract.supplierPhoto,
    };

    return res.status(200).json({
      success: true,
      contract: transformedContract,
    });
  } catch (error: any) {
    console.error("Error fetching contract details:", error);
    return res.status(500).json({
      error: "Failed to fetch contract details",
      message: error.message,
    });
  }
}
