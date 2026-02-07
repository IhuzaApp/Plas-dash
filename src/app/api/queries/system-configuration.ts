import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

// GraphQL query to fetch system configuration
const GET_SYSTEM_CONFIGURATION = gql`
  query getSystemConfiguration {
    System_configuratioins {
      baseDeliveryFee
      currency
      discounts
      id
      serviceFee
      shoppingTime
      unitsSurcharge
      extraUnits
      cappedDistanceFee
      distanceSurcharge
      deliveryCommissionPercentage
      productCommissionPercentage
      tax
      allowScheduledDeliveries
      rushHourSurcharge
      rushHours
      enableRush
      suggestedMinimumTip
      withDrawCharges
    }
  }
`;

interface SystemConfigurationResponse {
  System_configuratioins: Array<{
    baseDeliveryFee: string;
    currency: string;
    discounts: boolean;
    id: string;
    serviceFee: string;
    shoppingTime: string;
    unitsSurcharge: string;
    extraUnits: string;
    cappedDistanceFee: string;
    distanceSurcharge: string;
    deliveryCommissionPercentage: string;
    productCommissionPercentage: string;
    tax: string;
    allowScheduledDeliveries?: boolean;
    rushHourSurcharge?: string;
    rushHours?: string;
    enableRush?: boolean;
    suggestedMinimumTip?: string;
    withDrawCharges?: string | number;
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

    // Fetch system configuration from Hasura
    const data = await hasuraClient.request<SystemConfigurationResponse>(
      GET_SYSTEM_CONFIGURATION
    );

    // Return the first configuration object (there should only be one)
    const config = data.System_configuratioins[0] || {};

    // Return the configuration
    res.status(200).json({
      success: true,
      config,
    });
  } catch (error) {
    console.error("Error fetching system configuration:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch system configuration",
    });
  }
}
