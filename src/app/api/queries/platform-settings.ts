import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_PLATFORM_SETTINGS = gql`
  query GetPlatformSettings {
    Platform_Settings {
      id
      key
      value
      created_at
      updated_at
    }
  }
`;

interface PlatformSettingsResponse {
  Platform_Settings: Array<{
    id: string;
    key: string;
    value: string;
    created_at: string;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const data = await hasuraClient.request<PlatformSettingsResponse>(
      GET_PLATFORM_SETTINGS
    );
    res.status(200).json({ platform_settings: data.Platform_Settings });
  } catch (error) {
    console.error("Error fetching platform settings:", error);
    res.status(500).json({ error: "Failed to fetch platform settings" });
  }
}
