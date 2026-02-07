import { NextApiRequest, NextApiResponse } from "next";
import { gql } from "graphql-request";
import { hasuraClient } from "../../../src/lib/hasuraClient";

const GET_SYSTEM_CONFIG = gql`
  query getSystemConfiguration {
    System_configuratioins {
      baseDeliveryFee
      serviceFee
      shoppingTime
      unitsSurcharge
      extraUnits
      cappedDistanceFee
      distanceSurcharge
      currency
      discounts
      deliveryCommissionPercentage
      productCommissionPercentage
    }
  }
`;

interface SystemConfigResponse {
  System_configuratioins: Array<{
    baseDeliveryFee: string;
    serviceFee: string;
    shoppingTime: string;
    unitsSurcharge: string;
    extraUnits: string;
    cappedDistanceFee: string;
    distanceSurcharge: string;
    currency: string;
    discounts: any;
    deliveryCommissionPercentage: string;
    productCommissionPercentage: string;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = await hasuraClient.request<SystemConfigResponse>(
      GET_SYSTEM_CONFIG
    );

    const config = data.System_configuratioins[0] || null;

    return res.status(200).json({ config });
  } catch (error: any) {
    console.error("Error fetching system configuration:", error);
    return res.status(500).json({
      error: "Failed to fetch system configuration",
      details: error.message,
    });
  }
}
