import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_BUSINESS_PROFILE = gql`
  query GetBusinessProfile($user_id: uuid!) {
    # Get user information
    Users_by_pk(id: $user_id) {
      id
      name
      email
      phone
      profile_picture
      created_at
    }
    # Get business account information
    business_accounts(where: { user_id: { _eq: $user_id } }) {
      id
      account_type
      business_name
      business_email
      business_phone
      business_location
      rdb_certificate
      selfie_image
      id_image
      face_image
      status
      created_at
      updated_at
      user_id
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
      Users_by_pk: {
        id: string;
        name: string | null;
        email: string | null;
        phone: string | null;
        profile_picture: string | null;
        created_at: string;
      } | null;
      business_accounts: Array<{
        id: string;
        account_type: string;
        business_name: string | null;
        business_email: string | null;
        business_phone: string | null;
        business_location: string | null;
        rdb_certificate: string | null;
        selfie_image: string | null;
        id_image: string | null;
        face_image: string | null;
        status: string;
        created_at: string;
        updated_at: string;
        user_id: string;
      }>;
    }>(GET_BUSINESS_PROFILE, { user_id });

    const user = result.Users_by_pk;
    const businessAccount =
      result.business_accounts.length > 0 ? result.business_accounts[0] : null;

    return res.status(200).json({
      user: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            profilePicture: user.profile_picture,
            createdAt: user.created_at,
          }
        : null,
      businessAccount: businessAccount
        ? {
            id: businessAccount.id,
            accountType: businessAccount.account_type,
            businessName: businessAccount.business_name,
            businessEmail: businessAccount.business_email,
            businessPhone: businessAccount.business_phone,
            businessLocation: businessAccount.business_location,
            rdbCertificate: businessAccount.rdb_certificate,
            selfieImage: businessAccount.selfie_image,
            idImage: businessAccount.id_image,
            faceImage: businessAccount.face_image,
            status: businessAccount.status,
            createdAt: businessAccount.created_at,
            updatedAt: businessAccount.updated_at,
            userId: businessAccount.user_id,
          }
        : null,
      hasBusinessAccount: !!businessAccount,
    });
  } catch (error: any) {
    console.error("Error fetching business profile:", error);
    return res.status(500).json({
      error: "Failed to fetch business profile",
      message: error.message,
    });
  }
}
