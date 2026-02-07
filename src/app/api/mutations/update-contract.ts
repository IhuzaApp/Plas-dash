import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const UPDATE_CONTRACT = gql`
  mutation UpdateContract(
    $contractId: uuid!
    $contract_Value: String
    $value: String
    $startDate: date
    $endDate: date
    $duration: String
    $dueDate: String
    $paymentSchedule: String
    $paymentTerms: String
    $terminationTerms: String
    $specialConditions: String
    $projecDeliverables: jsonb
    $type: String
  ) {
    update_BusinessContracts_by_pk(
      pk_columns: { id: $contractId }
      _set: {
        contract_Value: $contract_Value
        value: $value
        startDate: $startDate
        endDate: $endDate
        duration: $duration
        dueDate: $dueDate
        paymentSchedule: $paymentSchedule
        paymentTerms: $paymentTerms
        terminationTerms: $terminationTerms
        specialConditions: $specialConditions
        projecDeliverables: $projecDeliverables
        type: $type
      }
    ) {
      id
      status
      contract_Value
      startDate
      endDate
    }
  }
`;

const GET_CONTRACT_OWNER = gql`
  query GetContractOwner($contractId: uuid!) {
    BusinessContracts_by_pk(id: $contractId) {
      id
      bussinessProfile_id
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

    const { contractId, ...updateData } = req.body;

    if (!contractId) {
      return res.status(400).json({ error: "Contract ID is required" });
    }

    // Get contract to check ownership and status
    const contractResult = await hasuraClient.request<{
      BusinessContracts_by_pk: {
        id: string;
        bussinessProfile_id: string;
        status: string;
      } | null;
    }>(GET_CONTRACT_OWNER, {
      contractId: contractId,
    });

    if (!contractResult.BusinessContracts_by_pk) {
      return res.status(404).json({ error: "Contract not found" });
    }

    const contract = contractResult.BusinessContracts_by_pk;

    // Check if contract status allows editing (only waiting_for_supplier)
    if (contract.status !== "waiting_for_supplier") {
      return res.status(400).json({
        error: "Contract cannot be edited",
        message:
          "Only contracts with status 'waiting_for_supplier' can be edited",
      });
    }

    // Get user's business account ID
    const user_id = session.user.id;
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
      return res.status(403).json({ error: "Business account not found" });
    }

    // Check if user owns the contract (is the client who created it)
    if (contract.bussinessProfile_id !== businessProfileId) {
      return res.status(403).json({
        error: "Unauthorized",
        message: "You can only edit contracts owned by your business",
      });
    }

    // Prepare update variables
    const updateVariables: any = {
      contractId: contractId,
    };

    if (updateData.contract_Value !== undefined) {
      updateVariables.contract_Value = updateData.contract_Value;
      updateVariables.value = updateData.contract_Value;
    }
    if (updateData.startDate !== undefined) {
      updateVariables.startDate = updateData.startDate;
    }
    if (updateData.endDate !== undefined) {
      updateVariables.endDate = updateData.endDate;
    }
    if (updateData.duration !== undefined) {
      updateVariables.duration = updateData.duration;
    }
    if (updateData.dueDate !== undefined) {
      updateVariables.dueDate = updateData.dueDate;
    }
    if (updateData.paymentSchedule !== undefined) {
      updateVariables.paymentSchedule = updateData.paymentSchedule;
    }
    if (updateData.paymentTerms !== undefined) {
      updateVariables.paymentTerms = updateData.paymentTerms;
    }
    if (updateData.terminationTerms !== undefined) {
      updateVariables.terminationTerms = updateData.terminationTerms;
    }
    if (updateData.specialConditions !== undefined) {
      updateVariables.specialConditions = updateData.specialConditions;
    }
    if (updateData.projecDeliverables !== undefined) {
      updateVariables.projecDeliverables = updateData.projecDeliverables;
    }
    if (updateData.type !== undefined) {
      updateVariables.type = updateData.type;
    }

    // Update contract
    const updateResult = await hasuraClient.request<{
      update_BusinessContracts_by_pk: {
        id: string;
        status: string;
        contract_Value: string;
        startDate: string;
        endDate: string;
      } | null;
    }>(UPDATE_CONTRACT, updateVariables);

    if (!updateResult.update_BusinessContracts_by_pk) {
      return res.status(500).json({ error: "Failed to update contract" });
    }

    return res.status(200).json({
      success: true,
      message: "Contract updated successfully",
      contract: updateResult.update_BusinessContracts_by_pk,
    });
  } catch (error: any) {
    console.error("Error updating contract:", error);
    return res.status(500).json({
      error: "Failed to update contract",
      message: error.message,
    });
  }
}
