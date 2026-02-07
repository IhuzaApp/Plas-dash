import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]";

const UPDATE_SHOPPER_PHOTO = gql`
  mutation UpdateShopperPhoto(
    $user_id: uuid!
    $photo_type: String!
    $photo_data: String!
  ) {
    update_shoppers(
      where: { user_id: { _eq: $user_id } }
      _set: { profile_photo: $photo_data }
    ) {
      affected_rows
      returning {
        id
        user_id
      }
    }
  }
`;

const UPDATE_SHOPPER_ID_PHOTOS = gql`
  mutation UpdateShopperIdPhotos(
    $user_id: uuid!
    $national_id_photo_front: String
    $national_id_photo_back: String
  ) {
    update_shoppers(
      where: { user_id: { _eq: $user_id } }
      _set: {
        national_id_photo_front: $national_id_photo_front
        national_id_photo_back: $national_id_photo_back
      }
    ) {
      affected_rows
      returning {
        id
        user_id
      }
    }
  }
`;

const UPDATE_SHOPPER_LICENSE = gql`
  mutation UpdateShopperLicense($user_id: uuid!, $driving_license: String) {
    update_shoppers(
      where: { user_id: { _eq: $user_id } }
      _set: { driving_license: $driving_license }
    ) {
      affected_rows
      returning {
        id
        user_id
      }
    }
  }
`;

const UPDATE_SHOPPER_SIGNATURE = gql`
  mutation UpdateShopperSignature($user_id: uuid!, $signature: String!) {
    update_shoppers(
      where: { user_id: { _eq: $user_id } }
      _set: { signature: $signature }
    ) {
      affected_rows
      returning {
        id
        user_id
      }
    }
  }
`;

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
  // Only allow POST requests
  if (req.method !== "POST") {
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
      return res
        .status(401)
        .json({ error: "You must be authenticated to upload photos" });
    }

    if (!hasuraClient) {
      console.error(
        "Hasura client is not initialized. Check environment variables."
      );
      throw new Error(
        "Hasura client is not initialized. Please check server configuration."
      );
    }

    const { photoType, photoData, user_id } = req.body;

    // Validate required fields
    if (!photoType || !photoData || !user_id) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "photoType, photoData, and user_id are required",
      });
    }

    // Verify the user ID matches the authenticated user
    if (user_id !== session.user.id) {
      return res.status(403).json({
        error:
          "User ID mismatch. You can only upload photos for your own account.",
      });
    }

    let mutation;
    let variables;

    // Determine which mutation to use based on photo type
    switch (photoType) {
      case "profile_photo":
        mutation = UPDATE_SHOPPER_PHOTO;
        variables = {
          user_id,
          photo_type: photoType,
          photo_data: photoData,
        };
        break;

      case "national_id_front":
      case "national_id_back":
        // For ID photos, we need to update both fields
        const frontPhoto = photoType === "national_id_front" ? photoData : null;
        const backPhoto = photoType === "national_id_back" ? photoData : null;

        mutation = UPDATE_SHOPPER_ID_PHOTOS;
        variables = {
          user_id,
          national_id_photo_front: frontPhoto,
          national_id_photo_back: backPhoto,
        };
        break;

      case "driving_license":
        mutation = UPDATE_SHOPPER_LICENSE;
        variables = {
          user_id,
          driving_license: photoData,
        };
        break;

      case "signature":
        mutation = UPDATE_SHOPPER_SIGNATURE;
        variables = {
          user_id,
          signature: photoData,
        };
        break;

      default:
        return res.status(400).json({
          error: "Invalid photo type",
          message:
            "Supported photo types: profile_photo, national_id_front, national_id_back, driving_license, signature",
        });
    }

    console.log(`Uploading ${photoType} for user ${user_id}`);

    // Execute the appropriate mutation
    const result = await hasuraClient.request(mutation, variables);

    if (result.update_shoppers.affected_rows > 0) {
      console.log(`${photoType} uploaded successfully for user ${user_id}`);
      return res.status(200).json({
        success: true,
        message: `${photoType} uploaded successfully`,
        affected_rows: result.update_shoppers.affected_rows,
        photoType,
      });
    } else {
      console.log(`No shopper record found for user ${user_id}`);
      return res.status(404).json({
        error: "Shopper record not found",
        message:
          "No shopper application found for this user. Please complete the registration first.",
      });
    }
  } catch (error: any) {
    console.error("Error uploading shopper photo:", error);
    res.status(500).json({
      error: "Failed to upload photo",
      message: error.message,
      details: error.response?.errors || "No additional details available",
    });
  }
}
