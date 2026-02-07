import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]";
import { logger } from "../../../src/utils/logger";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

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

interface AddVehicleResponse {
  insert_vehicles: {
    affected_rows: number;
  };
}

const ADD_VEHICLE = gql`
  mutation addShopperVehicles(
    $user_id: uuid!
    $type: String!
    $plate_number: String!
    $model: String!
    $photo: String!
  ) {
    insert_vehicles(
      objects: {
        user_id: $user_id
        type: $type
        plate_number: $plate_number
        model: $model
        photo: $photo
      }
    ) {
      affected_rows
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify the user is authenticated using getServerSession
    const session = (await getServerSession(
      req,
      res,
      authOptions as any
    )) as Session | null;

    if (!session || !session.user) {
      return res
        .status(401)
        .json({ error: "You must be authenticated to add a vehicle" });
    }

    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const { type, plate_number, model, photo } = req.body;

    // Validate required fields
    if (!type || !plate_number || !model || !photo) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Save the vehicle information directly to Hasura
    const data = await hasuraClient.request<AddVehicleResponse>(ADD_VEHICLE, {
      user_id: session.user.id,
      type,
      plate_number,
      model,
      photo,
    });

    if (!data.insert_vehicles.affected_rows) {
      throw new Error("Failed to add vehicle");
    }

    res.status(200).json({
      message: "Vehicle added successfully",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Error adding vehicle:", errorMessage);
    res.status(500).json({ error: errorMessage });
  }
}
