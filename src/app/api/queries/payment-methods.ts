import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import type { Session } from "next-auth";

interface PaymentMethod {
  id: string;
  user_id: string;
  method: string;
  names: string;
  number: string;
  CCV: string;
  validity: string;
  is_default: boolean;
  create_at: string;
  update_on: string;
}

const GET_PAYMENT_METHODS = gql`
  query GetPaymentMethods($user_id: uuid!) {
    Payment_Methods(where: { user_id: { _eq: $user_id } }) {
      id
      user_id
      method
      names
      number
      CCV
      validity
      is_default
      create_at
      update_on
    }
  }
`;

const RESET_DEFAULT = gql`
  mutation ResetPaymentDefault($user_id: uuid!) {
    update_Payment_Methods(
      where: { user_id: { _eq: $user_id }, is_default: { _eq: true } }
      _set: { is_default: false }
    ) {
      affected_rows
    }
  }
`;

const INSERT_PAYMENT_METHOD = gql`
  mutation InsertPaymentMethod(
    $user_id: uuid!
    $method: String!
    $names: String!
    $number: String!
    $CCV: String!
    $validity: String!
    $is_default: Boolean!
  ) {
    insert_Payment_Methods_one(
      object: {
        user_id: $user_id
        method: $method
        names: $names
        number: $number
        CCV: $CCV
        validity: $validity
        is_default: $is_default
      }
    ) {
      id
      user_id
      method
      names
      number
      CCV
      validity
      is_default
      create_at
      update_on
    }
  }
`;

const UPDATE_DEFAULT = gql`
  mutation UpdatePaymentDefault($id: uuid!, $is_default: Boolean!) {
    update_Payment_Methods_by_pk(
      pk_columns: { id: $id }
      _set: { is_default: $is_default }
    ) {
      id
      is_default
    }
  }
`;

const SET_DEFAULT_PAYMENT = gql`
  mutation SetDefaultPayment($user_id: uuid!, $id: uuid!) {
    reset: update_Payment_Methods(
      where: { user_id: { _eq: $user_id }, is_default: { _eq: true } }
      _set: { is_default: false }
    ) {
      affected_rows
    }
    setDefault: update_Payment_Methods_by_pk(
      pk_columns: { id: $id }
      _set: { is_default: true }
    ) {
      id
      is_default
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = (await getServerSession(
    req,
    res,
    authOptions as any
  )) as Session | null;
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user_id = session.user.id;

  if (req.method === "GET") {
    try {
      if (!hasuraClient) {
        throw new Error("Hasura client is not initialized");
      }

      const data = await hasuraClient.request<{
        Payment_Methods: PaymentMethod[];
      }>(GET_PAYMENT_METHODS, { user_id });
      return res.status(200).json({ paymentMethods: data.Payment_Methods });
    } catch (err) {
      console.error("Error fetching payment methods:", err);
      return res.status(500).json({ error: "Failed to fetch payment methods" });
    }
  }

  if (req.method === "POST") {
    const { method, names, number, CCV, validity, is_default } = req.body;
    if (!method || !names || !number || typeof is_default !== "boolean") {
      return res.status(400).json({ error: "Missing or invalid fields" });
    }
    if (method.toLowerCase() !== "mtn momo" && (!CCV || !validity)) {
      return res
        .status(400)
        .json({ error: "Missing CCV or validity for card payments" });
    }
    try {
      if (!hasuraClient) {
        throw new Error("Hasura client is not initialized");
      }

      if (is_default) {
        await hasuraClient.request(RESET_DEFAULT, { user_id });
      }
      const inserted = await hasuraClient.request<{
        insert_Payment_Methods_one: PaymentMethod;
      }>(INSERT_PAYMENT_METHOD, {
        user_id,
        method,
        names,
        number,
        CCV,
        validity,
        is_default,
      });
      return res
        .status(201)
        .json({ paymentMethod: inserted.insert_Payment_Methods_one });
    } catch (err) {
      console.error("Error saving payment method:", err);
      return res.status(500).json({ error: "Failed to save payment method" });
    }
  }

  if (req.method === "PUT") {
    console.log(
      "PUT /api/queries/payment-methods called with body:",
      req.body,
      "user_id:",
      user_id
    );
    const { id, is_default } = req.body;
    if (!id || typeof is_default !== "boolean") {
      return res.status(400).json({ error: "Missing id or is_default flag" });
    }
    try {
      if (!hasuraClient) {
        throw new Error("Hasura client is not initialized");
      }

      if (is_default) {
        console.log("Resetting default for user", user_id);
        const resetRes = await hasuraClient.request(RESET_DEFAULT, { user_id });
        console.log("RESET_DEFAULT result:", resetRes);
      }
      const updateRes = await hasuraClient.request<{
        update_Payment_Methods_by_pk: Pick<
          PaymentMethod,
          "id" | "is_default"
        > | null;
      }>(UPDATE_DEFAULT, { id, is_default });
      console.log("UPDATE_DEFAULT result:", updateRes);
      const updated = updateRes.update_Payment_Methods_by_pk;
      if (!updated) {
        return res
          .status(400)
          .json({ error: "Payment method not found or update failed" });
      }
      return res.status(200).json({ paymentMethod: updated });
    } catch (err) {
      console.error("Error updating payment default:", err);
      return res.status(500).json({ error: "Failed to update default" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
