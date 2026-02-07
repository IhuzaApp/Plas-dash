import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]";

const GET_SHOPPER_APPLICATION = gql`
  query GetShopperApplication($user_id: uuid!) {
    shoppers(where: { user_id: { _eq: $user_id } }) {
      id
      full_name
      address
      phone_number
      national_id
      drivingLicense_Image
      transport_mode
      profile_photo
      Police_Clearance_Cert
      guarantor
      guarantorPhone
      guarantorRelationship
      latitude
      longitude
      mutual_StatusCertificate
      mutual_status
      national_id_photo_back
      national_id_photo_front
      proofOfResidency
      signature
      status
      active
      onboarding_step
      collection_comment
      needCollection
      created_at
      updated_at
    }
  }
`;

interface GetShopperApplicationResponse {
  shoppers: Array<{
    id: string;
    full_name: string;
    address: string;
    phone_number: string;
    national_id: string;
    drivingLicense_Image?: string;
    transport_mode: string;
    profile_photo?: string;
    Police_Clearance_Cert?: string;
    guarantor?: string;
    guarantorPhone?: string;
    guarantorRelationship?: string;
    latitude?: string;
    longitude?: string;
    mutual_StatusCertificate?: string;
    mutual_status?: string;
    national_id_photo_back?: string;
    national_id_photo_front?: string;
    proofOfResidency?: string;
    signature?: string;
    status: string;
    active: boolean;
    onboarding_step: string;
    collection_comment?: string;
    needCollection?: boolean;
    created_at: string;
    updated_at: string;
  }>;
}

// Define the session user type
interface SessionUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

// Define the session type
interface Session {
  user: SessionUser;
  expires: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify the user is authenticated
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as Session | null;

    if (!session || !session.user) {
      return res.status(401).json({
        error: "You must be authenticated to get shopper application",
      });
    }

    if (!hasuraClient) {
      console.error(
        "Hasura client is not initialized. Check environment variables."
      );
      throw new Error(
        "Hasura client is not initialized. Please check server configuration."
      );
    }

    const user_id = session.user.id;

    // Get the full shopper application data
    const shopperData =
      await hasuraClient.request<GetShopperApplicationResponse>(
        GET_SHOPPER_APPLICATION,
        { user_id }
      );

    if (shopperData.shoppers.length > 0) {
      const shopper = shopperData.shoppers[0];
      return res.status(200).json({ shopper });
    } else {
      return res.status(404).json({ error: "No shopper application found" });
    }
  } catch (error: any) {
    console.error("Error getting shopper application:", error);
    res.status(500).json({
      error: "Failed to get shopper application",
      message: error.message,
      details: error.response?.errors || "No additional details available",
    });
  }
}
