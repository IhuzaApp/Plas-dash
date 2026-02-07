import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const CHECK_BUSINESS_ACCOUNT = gql`
  query CheckBusinessAccount($user_id: uuid!) {
    business_accounts(where: { user_id: { _eq: $user_id } }) {
      account_type
      business_email
      business_location
      business_name
      business_phone
      created_at
      face_image
      id
      id_image
      rdb_certificate
      updated_at
      user_id
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
  if (req.method !== "GET" && req.method !== "POST") {
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

    const result = await hasuraClient.request<{
      business_accounts: Array<{
        id: string;
        account_type: string;
        business_email: string | null;
        business_location: string | null;
        business_name: string | null;
        business_phone: string | null;
        created_at: string;
        face_image: string | null;
        id_image: string | null;
        rdb_certificate: string | null;
        updated_at: string;
        user_id: string;
        status: string;
      }>;
    }>(CHECK_BUSINESS_ACCOUNT, { user_id });

    const hasAccount = result.business_accounts.length > 0;
    const account = hasAccount ? result.business_accounts[0] : null;

    const responseData = {
      hasAccount,
      account: account
        ? {
            id: account.id,
            accountType: account.account_type,
            businessEmail: account.business_email,
            businessLocation: account.business_location,
            businessName: account.business_name,
            businessPhone: account.business_phone,
            createdAt: account.created_at,
            faceImage: account.face_image,
            idImage: account.id_image,
            rdbCertificate: account.rdb_certificate,
            updatedAt: account.updated_at,
            userId: account.user_id,
            status: account.status,
          }
        : null,
    };

    return res.status(200).json(responseData);
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to check business account",
      message: error.message,
    });
  }
}
