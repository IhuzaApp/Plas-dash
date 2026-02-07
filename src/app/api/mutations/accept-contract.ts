import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const ACCEPT_CONTRACT = gql`
  mutation AcceptContract(
    $contractId: uuid!
    $status: String!
    $supplierSignature: String
    $supplierPhoto: String
    $updateOn: timestamptz
  ) {
    update_BusinessContracts_by_pk(
      pk_columns: { id: $contractId }
      _set: {
        status: $status
        supplierSignature: $supplierSignature
        supplierPhoto: $supplierPhoto
        update_on: $updateOn
      }
    ) {
      id
      status
      supplierSignature
      supplierPhoto
      update_on
    }
  }
`;

const UPDATE_QUOTE_STATUS = gql`
  mutation UpdateQuoteStatus($quoteId: uuid!, $status: String!) {
    update_BusinessQoute_by_pk(
      pk_columns: { id: $quoteId }
      _set: { status: $status }
    ) {
      id
      status
    }
  }
`;

const GET_CONTRACT_WITH_QUOTE = gql`
  query GetContractWithQuote($contractId: uuid!) {
    BusinessContracts_by_pk(id: $contractId) {
      id
      rfq_response_id
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

    const { contractId, supplierSignature, supplierPhoto } = req.body;

    if (!contractId) {
      return res.status(400).json({ error: "Contract ID is required" });
    }

    if (!supplierSignature) {
      return res.status(400).json({ error: "Supplier signature is required" });
    }

    if (!supplierPhoto) {
      return res.status(400).json({ error: "Supplier photo is required" });
    }

    // Get contract to find quote ID
    const contractResult = await hasuraClient.request<{
      BusinessContracts_by_pk: {
        id: string;
        rfq_response_id: string;
        status: string;
      } | null;
    }>(GET_CONTRACT_WITH_QUOTE, {
      contractId: contractId,
    });

    if (!contractResult.BusinessContracts_by_pk) {
      return res.status(404).json({ error: "Contract not found" });
    }

    const contract = contractResult.BusinessContracts_by_pk;

    if (contract.status !== "waiting_for_supplier") {
      return res.status(400).json({
        error: "Contract cannot be accepted",
        message:
          "Only contracts with status 'waiting_for_supplier' can be accepted",
      });
    }

    // Update contract status to "active" with supplier signature and photo
    const currentTimestamp = new Date().toISOString();
    const updateResult = await hasuraClient.request<{
      update_BusinessContracts_by_pk: {
        id: string;
        status: string;
        supplierSignature: string | null;
        supplierPhoto: string | null;
        update_on: string | null;
      } | null;
    }>(ACCEPT_CONTRACT, {
      contractId: contractId,
      status: "active",
      supplierSignature: supplierSignature || null,
      supplierPhoto: supplierPhoto || null,
      updateOn: currentTimestamp,
    });

    if (!updateResult.update_BusinessContracts_by_pk) {
      return res.status(500).json({ error: "Failed to update contract" });
    }

    // Update quote status to "accepted" if quote ID exists
    if (contract.rfq_response_id) {
      try {
        await hasuraClient.request<{
          update_BusinessQoute_by_pk: {
            id: string;
            status: string;
          } | null;
        }>(UPDATE_QUOTE_STATUS, {
          quoteId: contract.rfq_response_id,
          status: "accepted",
        });
      } catch (error) {
        console.error("Error updating quote status:", error);
        // Don't fail the request if quote update fails
      }
    }

    return res.status(200).json({
      success: true,
      message: "Contract accepted successfully",
      contract: updateResult.update_BusinessContracts_by_pk,
    });
  } catch (error: any) {
    console.error("Error accepting contract:", error);
    return res.status(500).json({
      error: "Failed to accept contract",
      message: error.message,
    });
  }
}
